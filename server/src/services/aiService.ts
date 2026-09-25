import { GoogleGenAI } from "@google/genai";

export interface AIAnalysisResult {
  summary: string;
  aiNotes: string;
  decisions: string[];
  actionItems: string[];
  unresolvedQuestions: string[];
}

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.7-flash";

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;

const getAIClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env");
  }

  return new GoogleGenAI({
    apiKey,
  });
};

/**
 * Waits for a specified amount of time.
 */
const wait = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

/**
 * Gets a useful error message from an unknown Gemini/API error.
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return String(error);
};

/**
 * Checks whether the error is a temporary server-side
 * error that is reasonable to retry.
 *
 * We intentionally do NOT retry configuration,
 * authentication, validation, or parsing errors.
 */
const isRetryableError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("temporarily overloaded")
  ) {
    return true;
  }

  if (
    message.includes("500") ||
    message.includes("internal server error")
  ) {
    return true;
  }

  if (
    message.includes("504") ||
    message.includes("deadline exceeded") ||
    message.includes("gateway timeout")
  ) {
    return true;
  }

  return false;
};

/**
 * Attempts to extract a JSON object from Gemini's response.
 *
 * Gemini may sometimes return:
 *
 * {
 *   ...
 * }
 *
 * or:
 *
 * ```json
 * {
 *   ...
 * }
 * ```
 *
 * or even some explanatory text around the JSON.
 *
 * This function makes the parser much more tolerant.
 */
const extractJsonObject = (text: string): string => {
  let cleaned = text.trim();

  // Remove markdown code fences.
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // First try the entire response.
  try {
    JSON.parse(cleaned);

    return cleaned;
  } catch {
    // Continue with extraction.
  }

  // Find the first JSON object.
  const firstBrace = cleaned.indexOf("{");

  if (firstBrace === -1) {
    throw new Error(
      "Gemini response does not contain a JSON object"
    );
  }

  // Find the matching closing brace while respecting strings.
  let depth = 0;
  let insideString = false;
  let escaped = false;

  for (
    let i = firstBrace;
    i < cleaned.length;
    i++
  ) {
    const character = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === '"') {
      insideString = !insideString;
      continue;
    }

    if (insideString) {
      continue;
    }

    if (character === "{") {
      depth++;
    }

    if (character === "}") {
      depth--;

      if (depth === 0) {
        return cleaned.slice(
          firstBrace,
          i + 1
        );
      }
    }
  }

  throw new Error(
    "Could not find a complete JSON object in Gemini response"
  );
};

/**
 * Converts unknown values into safe strings.
 */
const toStringArray = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (
        typeof item === "object" &&
        item !== null &&
        "text" in item
      ) {
        const text = (
          item as { text?: unknown }
        ).text;

        if (typeof text === "string") {
          return text.trim();
        }
      }

      return String(item).trim();
    })
    .filter(Boolean);
};

/**
 * Makes sure the AI result always follows Taskie's
 * expected structure.
 */
const normalizeAnalysis = (
  value: Record<string, unknown>
): AIAnalysisResult => {
  const summary =
    typeof value.summary === "string"
      ? value.summary.trim()
      : "";

  const aiNotes =
    typeof value.aiNotes === "string"
      ? value.aiNotes.trim()
      : "";

  return {
    summary:
      summary ||
      "The transcript was analyzed, but no concise summary was identified.",

    aiNotes:
      aiNotes ||
      "No additional meeting notes were identified.",

    decisions: toStringArray(
      value.decisions
    ),

    actionItems: toStringArray(
      value.actionItems
    ),

    unresolvedQuestions:
      toStringArray(
        value.unresolvedQuestions
      ),
  };
};

/**
 * Sends the analysis request to one Gemini model.
 */
const requestGeminiAnalysis = async (
  ai: GoogleGenAI,
  model: string,
  prompt: string
): Promise<string> => {
  const response =
    await ai.models.generateContent({
      model,
      contents: prompt,
    });

  const responseText = response.text;

  if (
    !responseText ||
    !responseText.trim()
  ) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }

  return responseText;
};

/**
 * Attempts a Gemini request with limited exponential
 * backoff for temporary server-side failures.
 *
 * Example:
 *
 * Attempt 1
 *    ↓ 503
 * wait ~1 second
 *
 * Attempt 2
 *    ↓ 503
 * wait ~2 seconds
 *
 * Attempt 3
 *    ↓
 * give up on this model
 */
const requestWithRetry = async (
  ai: GoogleGenAI,
  model: string,
  prompt: string
): Promise<string> => {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `Gemini request using ${model} (attempt ${
          attempt + 1
        }/${MAX_RETRIES + 1})`
      );

      const responseText =
        await requestGeminiAnalysis(
          ai,
          model,
          prompt
        );

      console.log(
        `Gemini request succeeded using ${model}.`
      );

      return responseText;
    } catch (error) {
      lastError = error;

      const retryable =
        isRetryableError(error);

      console.error(
        `Gemini request failed using ${model} on attempt ${
          attempt + 1
        }:`,
        error
      );

      /*
       * If this is not a temporary server-side
       * problem, fail immediately.
       */
      if (!retryable) {
        throw error;
      }

      /*
       * No delay after the final attempt because
       * there is nothing left to retry on this model.
       */
      if (attempt === MAX_RETRIES) {
        break;
      }

      /*
       * Exponential backoff:
       *
       * attempt 0 -> about 1 second
       * attempt 1 -> about 2 seconds
       *
       * A small random jitter prevents multiple
       * clients from retrying at exactly the same time.
       */
      const baseDelay =
        INITIAL_RETRY_DELAY_MS *
        Math.pow(2, attempt);

      const jitter =
        Math.floor(
          Math.random() * 500
        );

      const delay =
        baseDelay + jitter;

      console.log(
        `Temporary Gemini error. Retrying ${model} in ${delay}ms...`
      );

      await wait(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        `Gemini request failed using ${model}`
      );
};

/**
 * Analyzes a meeting transcript using Gemini.
 */
export const analyzeMeeting = async (
  transcript: string
): Promise<AIAnalysisResult> => {
  if (
    !transcript ||
    !transcript.trim()
  ) {
    throw new Error(
      "Transcript is required for AI analysis"
    );
  }

  const ai = getAIClient();

  /*
   * IMPORTANT:
   *
   * The prompt deliberately does NOT require a
   * particular transcript format.
   *
   * Taskie should be able to analyze:
   * - speaker-labelled transcripts
   * - plain text
   * - speech-to-text transcripts
   * - timestamped transcripts
   * - transcripts with filler words
   * - incomplete sentences
   * - short conversations
   * - long meetings
   * - messy transcription
   */
  const prompt = `
You are Taskie's meeting intelligence engine.

Your job is to analyze ANY reasonable meeting transcript or conversation text.

The input may be:
- speaker-labelled
- unlabeled
- timestamped
- generated by speech-to-text
- informal
- grammatically incorrect
- incomplete
- repetitive
- filled with filler words such as "um", "uh", "yeah", "basically", etc.
- short or very long
- missing speaker names
- partially structured

DO NOT reject the transcript simply because its formatting is unusual.

Understand the meaning and extract useful information from the conversation.

Return ONLY valid JSON.

The JSON must contain EXACTLY these fields:

{
  "summary": "Concise factual summary of the conversation",
  "aiNotes": "Important discussion points and context",
  "decisions": [],
  "actionItems": [],
  "unresolvedQuestions": []
}

RULES:

1. SUMMARY
- Summarize what was actually discussed.
- Do not invent information.
- Keep it concise but meaningful.
- If the transcript is very short, summarize whatever information is available.

2. AI NOTES
- Include important topics, progress updates, blockers, commitments, risks, or other useful context.
- Do not invent facts.

3. DECISIONS
- Extract decisions that were actually made.
- Include explicit agreements.
- If no decision exists, return [].

4. ACTION ITEMS
- Extract tasks, commitments, follow-ups, or things someone agreed to do.
- Preserve useful details such as the responsible person and timing inside the text.
- Example:
  "Marcus will finish the password reset flow today."
- Do not invent an assignee or deadline.
- If no action item exists, return [].

5. UNRESOLVED QUESTIONS
- Extract questions or issues that remain unresolved.
- If there are none, return [].

6. IMPORTANT
- Do not require speaker labels.
- Do not require a particular transcript structure.
- Do not fail because of spelling mistakes.
- Do not fail because of grammar mistakes.
- Do not fail because of filler words.
- Do not fail because timestamps are present.
- Do not fail because the transcript is short.
- Do not invent missing information.
- Do not add explanations outside the JSON.
- Return valid JSON only.

MEETING TRANSCRIPT:

${transcript}
`;

  let responseText: string;

  try {
    /*
     * First try the primary model.
     *
     * It gets limited exponential-backoff retries
     * for temporary server-side errors such as 503.
     */
    responseText =
      await requestWithRetry(
        ai,
        PRIMARY_MODEL,
        prompt
      );
  } catch (primaryError) {
    console.error(
      `Primary Gemini model ${PRIMARY_MODEL} failed:`,
      primaryError
    );

    /*
     * Only fall back for temporary Gemini
     * infrastructure errors.
     *
     * Configuration, authentication,
     * invalid-request, and parsing errors should
     * NOT silently switch models.
     */
    if (
      !isRetryableError(primaryError)
    ) {
      throw primaryError;
    }

    console.log(
      `Trying Gemini fallback model ${FALLBACK_MODEL}...`
    );

    try {
      responseText =
        await requestWithRetry(
          ai,
          FALLBACK_MODEL,
          prompt
        );

      console.log(
        `Gemini fallback model ${FALLBACK_MODEL} succeeded.`
      );
    } catch (fallbackError) {
      console.error(
        `Gemini fallback model ${FALLBACK_MODEL} also failed:`,
        fallbackError
      );

      throw new Error(
        "The AI service is temporarily unavailable. Please try again in a few minutes."
      );
    }
  }

  /*
   * Parse Gemini's response.
   */
  const jsonText =
    extractJsonObject(
      responseText
    );

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(jsonText);
  } catch (parseError) {
    console.error(
      "Failed to parse Gemini JSON response:",
      parseError
    );

    console.error(
      "Gemini response was:",
      responseText
    );

    throw new Error(
      "Gemini returned invalid JSON"
    );
  }

  /*
   * Validate the top-level structure.
   */
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "Gemini returned an invalid analysis structure"
    );
  }

  /*
   * Normalize the response into Taskie's
   * expected structure.
   */
  const analysis =
    normalizeAnalysis(
      parsed as Record<string, unknown>
    );

  return analysis;
};
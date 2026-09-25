import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not configured. Please check server/.env"
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

const getMimeType = (
  fileName: string,
  suppliedMimeType?: string
): string => {
  // Normalize the MIME type so it is never undefined.
  const mimeType = (suppliedMimeType || "").toLowerCase();

  // Browser MediaRecorder commonly produces:
  // audio/webm
  // audio/webm;codecs=opus
  if (
    mimeType === "audio/webm" ||
    mimeType.startsWith("audio/webm;")
  ) {
    return "audio/webm";
  }

  // Some browsers may produce:
  // audio/mp4
  // audio/mp4;codecs=mp4a.40.2
  if (
    mimeType === "audio/mp4" ||
    mimeType.startsWith("audio/mp4;")
  ) {
    return "audio/mp4";
  }

  if (mimeType === "audio/wav") {
    return "audio/wav";
  }

  if (
    mimeType === "audio/mpeg" ||
    mimeType === "audio/mp3"
  ) {
    return "audio/mpeg";
  }

  // If the browser sends an unusual/empty MIME type,
  // fall back to the file extension.
  const extension = fileName
    .toLowerCase()
    .substring(fileName.lastIndexOf("."));

  const mimeTypes: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".webm": "audio/webm",
  };

  const detectedMimeType = mimeTypes[extension];

  if (!detectedMimeType) {
    throw new Error(
      `Unsupported audio format. File: ${fileName}, MIME type: ${
        suppliedMimeType || "unknown"
      }`
    );
  }

  return detectedMimeType;
};

export const transcribeAudio = async (
  buffer: Buffer,
  fileName: string,
  suppliedMimeType = ""
): Promise<string> => {
  // Make sure a file was actually received.
  if (!buffer || buffer.length === 0) {
    throw new Error("The uploaded audio file is empty.");
  }

  // Maximum audio size: 20 MB.
  const maxSize = 20 * 1024 * 1024;

  if (buffer.length > maxSize) {
    throw new Error(
      "Audio file is too large. Please use a recording smaller than 20 MB."
    );
  }

  // Detect the correct MIME type.
  const mimeType = getMimeType(
    fileName,
    suppliedMimeType
  );

  console.log("======================================");
  console.log("Audio received:", fileName);
  console.log("MIME type:", mimeType);
  console.log(
    "Size:",
    `${(buffer.length / 1024 / 1024).toFixed(2)} MB`
  );
  console.log("======================================");

  // Convert audio to Base64 for Gemini.
  const base64Audio = buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",

      contents: [
        {
          role: "user",

          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },

            {
              text: `
Transcribe this meeting audio accurately.

Requirements:

1. Return only the transcript.
2. Do not summarize the meeting.
3. Do not analyze the meeting.
4. Do not create action items.
5. Do not add explanations.
6. Preserve the meaning of what was spoken.
7. Keep speaker labels when clearly identifiable.
8. Keep the natural order of the conversation.
9. Do not invent words or information.
10. If something is unclear, write [inaudible].
11. Transcribe the complete audio.

The transcript will later be analyzed by Taskie's meeting analysis system.
              `.trim(),
            },
          ],
        },
      ],
    });

    const transcript = response.text?.trim() || "";

    if (!transcript) {
      throw new Error(
        "Gemini returned an empty transcript."
      );
    }

    return transcript;
  } catch (error) {
    console.error(
      "Gemini transcription error:",
      error
    );

    if (error instanceof Error) {
      throw new Error(
        `Gemini transcription failed: ${error.message}`
      );
    }

    throw new Error(
      "Gemini transcription failed."
    );
  }
};
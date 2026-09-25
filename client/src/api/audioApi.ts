import axios from "axios";

const API_URL =
  "http://localhost:5000/api/audio";

interface TranscribeAudioResponse {
  message: string;
  transcript: string;
  fileName: string;
}

interface ErrorResponse {
  message?: string;
}

export const transcribeAudio = async (
  audioFile: File
): Promise<string> => {
  const formData = new FormData();

  formData.append(
    "audio",
    audioFile
  );

  try {
    const response =
      await axios.post<TranscribeAudioResponse>(
        `${API_URL}/transcribe`,
        formData
      );

    return response.data.transcript;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const backendMessage =
        (
          error.response?.data as
            | ErrorResponse
            | undefined
        )?.message;

      if (backendMessage) {
        throw new Error(
          backendMessage
        );
      }

      if (
        error.response?.status === 500
      ) {
        throw new Error(
          "The server failed while transcribing the audio. Check the backend terminal for the Gemini error."
        );
      }
    }

    throw new Error(
      "Failed to send audio to the transcription server."
    );
  }
};
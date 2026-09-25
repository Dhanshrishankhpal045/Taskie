import axios from "axios";

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_URL =
  "http://localhost:5000/api/exports";

const api = axios.create({
  baseURL: API_URL,
});

/* =========================================================
   AUTH INTERCEPTOR
   ========================================================= */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "taskie_token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(error)
);

/* =========================================================
   DOWNLOAD HELPER
   ========================================================= */

const downloadFile = (
  blob: Blob,
  filename: string
) => {
  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
};

/* =========================================================
   EXPORT MEETING AS JSON
   ========================================================= */

export const exportMeetingJSON =
  async (
    meetingId: string,
    meetingTitle?: string
  ): Promise<void> => {
    try {
      const response =
        await api.get(
          `/meetings/${meetingId}/json`,
          {
            responseType: "blob",
          }
        );

      const safeTitle =
        meetingTitle
          ?.replace(
            /[^a-z0-9-_ ]/gi,
            ""
          )
          .trim()
          .replace(/\s+/g, "-") ||
        "meeting";

      downloadFile(
        response.data,
        `${safeTitle}.json`
      );
    } catch (error) {
      console.error(
        "Failed to export meeting JSON:",
        error
      );

      if (
        axios.isAxiosError(error) &&
        error.response?.data instanceof Blob
      ) {
        try {
          const text =
            await error.response.data.text();

          const parsed =
            JSON.parse(text);

          throw new Error(
            parsed.message ||
              "Failed to export meeting as JSON."
          );
        } catch (parseError) {
          if (
            parseError instanceof Error
          ) {
            throw parseError;
          }

          throw new Error(
            "Failed to export meeting as JSON."
          );
        }
      }

      throw new Error(
        "Failed to export meeting as JSON."
      );
    }
  };

/* =========================================================
   EXPORT MEETING AS PDF
   ========================================================= */

export const exportMeetingPDF =
  async (
    meetingId: string,
    meetingTitle?: string
  ): Promise<void> => {
    try {
      const response =
        await api.get(
          `/meetings/${meetingId}/pdf`,
          {
            responseType: "blob",
          }
        );

      const safeTitle =
        meetingTitle
          ?.replace(
            /[^a-z0-9-_ ]/gi,
            ""
          )
          .trim()
          .replace(/\s+/g, "-") ||
        "meeting";

      downloadFile(
        response.data,
        `${safeTitle}.pdf`
      );
    } catch (error) {
      console.error(
        "Failed to export meeting PDF:",
        error
      );

      if (
        axios.isAxiosError(error) &&
        error.response?.data instanceof Blob
      ) {
        try {
          const text =
            await error.response.data.text();

          const parsed =
            JSON.parse(text);

          throw new Error(
            parsed.message ||
              "Failed to export meeting as PDF."
          );
        } catch (parseError) {
          if (
            parseError instanceof Error
          ) {
            throw parseError;
          }

          throw new Error(
            "Failed to export meeting as PDF."
          );
        }
      }

      throw new Error(
        "Failed to export meeting as PDF."
      );
    }
  };
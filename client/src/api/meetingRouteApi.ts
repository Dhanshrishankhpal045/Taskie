import axios from "axios";
import API_URL from "../apiConfig";

import type { Meeting } from "./meetingApi";

const api = axios.create({
  baseURL: `${API_URL}/api/meetings`,
});

/* -------------------------------- */
/* AUTH INTERCEPTOR */
/* -------------------------------- */

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

/* -------------------------------- */
/* TYPES */
/* -------------------------------- */

interface GetMeetingResponse {
  message: string;
  meeting: Meeting;
}

/* -------------------------------- */
/* GET MEETING BY ID */
/* -------------------------------- */

export const getMeetingById =
  async (
    meetingId: string
  ): Promise<Meeting> => {
    if (!meetingId) {
      throw new Error(
        "Meeting ID is required."
      );
    }

    try {
      const response =
        await api.get<GetMeetingResponse>(
          `/${meetingId}`
        );

      if (!response.data.meeting) {
        throw new Error(
          "Meeting was not found."
        );
      }

      return response.data.meeting;
    } catch (error) {
      console.error(
        "Failed to fetch meeting:",
        error
      );

      if (axios.isAxiosError(error)) {
        const serverMessage =
          error.response?.data?.message;

        if (
          typeof serverMessage ===
            "string" &&
          serverMessage.trim()
        ) {
          throw new Error(
            serverMessage
          );
        }

        if (
          error.response?.status === 401
        ) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (
          error.response?.status === 403
        ) {
          throw new Error(
            "You do not have permission to view this meeting."
          );
        }

        if (
          error.response?.status === 404
        ) {
          throw new Error(
            "Meeting was not found."
          );
        }

        throw new Error(
          "Unable to connect to the meeting server."
        );
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        "Failed to load meeting details."
      );
    }
  };
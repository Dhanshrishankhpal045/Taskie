import axios from "axios";
import API_URL from "../apiConfig";

const API_BASE_URL =
  `${API_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

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

export interface ActionItem {
  actionItemId?: string;
  text: string;
  assignee?: string;
  dueDate?: string;
  priority?:
    | "low"
    | "medium"
    | "high"
    | "critical";
  status:
    | "pending"
    | "approved"
    | "rejected";
}

export interface Meeting {
  _id: string;
  title: string;
  transcript?: string;
  summary?: string;
  aiNotes?: string;
  personalNotes?: string;
  decisions?: string[];
  actionItems?: ActionItem[];
  unresolvedQuestions?: string[];
  analysisStatus?:
    | "pending"
    | "approved"
    | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMeetingData {
  title: string;
  transcript?: string;
}

/* -------------------------------- */
/* MEETINGS */
/* -------------------------------- */

export const getMeetings =
  async (): Promise<Meeting[]> => {
    const response =
      await api.get("/meetings");

    return response.data.meetings;
  };

export const getMeetingById =
  async (
    meetingId: string
  ): Promise<Meeting> => {
    const response =
      await api.get(
        `/meetings/${meetingId}`
      );

    return response.data.meeting;
  };

export const createMeeting =
  async (
    data: CreateMeetingData
  ): Promise<Meeting> => {
    const response =
      await api.post(
        "/meetings",
        data
      );

    return response.data.meeting;
  };

/* -------------------------------- */
/* AI ANALYSIS */
/* -------------------------------- */

export const analyzeMeeting =
  async (
    meetingId: string,
    transcript: string
  ) => {
    const response =
      await api.post(
        "/ai/analyze",
        {
          meetingId,
          transcript,
        }
      );

    return response.data;
  };

/* -------------------------------- */
/* MEETING APPROVAL */
/* -------------------------------- */

export const approveMeeting =
  async (
    meetingId: string
  ): Promise<Meeting> => {
    const response =
      await api.patch(
        `/meetings/${meetingId}/approve`
      );

    return response.data.meeting;
  };

export const rejectMeeting =
  async (
    meetingId: string
  ): Promise<Meeting> => {
    const response =
      await api.patch(
        `/meetings/${meetingId}/reject`
      );

    return response.data.meeting;
  };

/* -------------------------------- */
/* ACTION ITEMS */
/* -------------------------------- */

export const approveActionItem =
  async (
    meetingId: string,
    actionItemIndex: number
  ): Promise<Meeting> => {
    const response =
      await api.patch(
        "/meetings/action-item/approve",
        {
          meetingId,
          actionItemIndex,
        }
      );

    return response.data.meeting;
  };

export const rejectActionItem =
  async (
    meetingId: string,
    actionItemIndex: number
  ): Promise<Meeting> => {
    const response =
      await api.patch(
        "/meetings/action-item/reject",
        {
          meetingId,
          actionItemIndex,
        }
      );

    return response.data.meeting;
  };

export const editActionItem =
  async (
    meetingId: string,
    actionItemIndex: number,
    data: {
      text: string;
      assignee?: string;
      dueDate?: string;
      priority?:
        | "low"
        | "medium"
        | "high"
        | "critical";
    }
  ): Promise<Meeting> => {
    const response =
      await api.patch(
        "/meetings/action-item/edit",
        {
          meetingId,
          actionItemIndex,
          ...data,
        }
      );

    return response.data.meeting;
  };

export const addActionItem =
  async (
    meetingId: string,
    data: {
      text: string;
      assignee?: string;
      dueDate?: string;
      priority?:
        | "low"
        | "medium"
        | "high"
        | "critical";
    }
  ): Promise<Meeting> => {
    const response =
      await api.post(
        "/meetings/action-item",
        {
          meetingId,
          ...data,
        }
      );

    return response.data.meeting;
  };

export const deleteActionItem =
  async (
    meetingId: string,
    actionItemIndex: number
  ): Promise<Meeting> => {
    const response =
      await api.delete(
        "/meetings/action-item",
        {
          data: {
            meetingId,
            actionItemIndex,
          },
        }
      );

    return response.data.meeting;
  };

/* -------------------------------- */
/* TASK CREATION */
/* -------------------------------- */

export const createTaskFromActionItem = async (
  meetingId: string,
  actionItemIndex?: number,
  actionItemId?: string
) => {
  const payload: {
    meetingId: string;
    actionItemIndex?: number;
    actionItemId?: string;
  } = { meetingId };

  if (actionItemIndex !== undefined) {
    payload.actionItemIndex = actionItemIndex;
  }

  if (actionItemId) {
    payload.actionItemId = actionItemId;
  }

  const response = await api.post(
    "/tasks/from-action-item",
    payload
  );

  return response.data;
};

/* -------------------------------- */
/* PERSONAL NOTES */
/* -------------------------------- */

export const updatePersonalNotes = async (
  meetingId: string,
  personalNotes: string
): Promise<Meeting> => {
  const response = await api.patch(
    `/meetings/${meetingId}/personal-notes`,
    { personalNotes }
  );

  return response.data.meeting;
};
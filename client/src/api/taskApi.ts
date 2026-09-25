import axios from "axios";

const API_URL =
  "http://localhost:5000/api/tasks";

const api = axios.create({
  baseURL: API_URL,
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
  }
);

/* -------------------------------- */
/* TYPES */
/* -------------------------------- */

export interface Task {
  _id: string;

  title: string;

  description?: string;

  assignee?: string;

  dueDate?: string;

  priority:
    | "low"
    | "medium"
    | "high"
    | "critical";

  status:
    | "todo"
    | "in-progress"
    | "completed";

  /*
   * Source meeting for this task.
   */
  meetingId?: string;

  /*
   * Permanent connection between
   * this task and the original
   * meeting action item.
   */
  actionItemId?: string;

  /*
   * Kept for compatibility with
   * older tasks created before the
   * stable actionItemId was introduced.
   */
  actionItemIndex?: number;

  createdAt?: string;

  updatedAt?: string;
}

interface GetTasksResponse {
  message: string;

  tasks: Task[];
}

/* -------------------------------- */
/* GET TASKS */
/* -------------------------------- */

export const getTasks =
  async (): Promise<Task[]> => {
    const response =
      await api.get<GetTasksResponse>(
        "/"
      );

    return response.data.tasks;
  };

/* -------------------------------- */
/* UPDATE TASK */
/* -------------------------------- */

export const updateTask =
  async (
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task> => {
    const response =
      await api.put<{ task: Task }>(
        `/${taskId}`,
        updates
      );

    return response.data.task;
  };

/* -------------------------------- */
/* DELETE TASK */
/* -------------------------------- */

export const deleteTask =
  async (
    taskId: string
  ): Promise<void> => {
    await api.delete(
      `/${taskId}`
    );
  };
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

const TOKEN_KEY = "taskie_token";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

interface MeResponse {
  message: string;
  user: User;
}

interface UpdateProfileResponse {
  message: string;
  user: User;
}

const setAuthToken = (token: string): void => {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

const clearAuthToken = (): void => {
  delete axios.defaults.headers.common.Authorization;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    throw new Error("Name is required.");
  }

  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  if (password.length < 6) {
    throw new Error(
      "Password must contain at least 6 characters."
    );
  }

  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/register`,
      {
        name: trimmedName,
        email: trimmedEmail,
        password,
      }
    );

    const { token, user } = response.data;

    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);

    return user;
  } catch (error) {
    console.error("Registration failed:", error);

    if (axios.isAxiosError(error)) {
      const serverMessage = error.response?.data?.message;

      if (
        typeof serverMessage === "string" &&
        serverMessage.trim()
      ) {
        throw new Error(serverMessage);
      }

      throw new Error(
        "Unable to create your account."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Registration failed."
    );
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/login`,
      {
        email: trimmedEmail,
        password,
      }
    );

    const { token, user } = response.data;

    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);

    return user;
  } catch (error) {
    console.error("Login failed:", error);

    if (axios.isAxiosError(error)) {
      const serverMessage = error.response?.data?.message;

      if (
        typeof serverMessage === "string" &&
        serverMessage.trim()
      ) {
        throw new Error(serverMessage);
      }

      throw new Error(
        "Unable to log in."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Login failed."
    );
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  try {
    setAuthToken(token);

    const response = await axios.get<MeResponse>(
      `${API_URL}/me`
    );

    return response.data.user;
  } catch (error) {
    console.error(
      "Failed to restore authentication:",
      error
    );

    localStorage.removeItem(TOKEN_KEY);
    clearAuthToken();

    return null;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  clearAuthToken();
};

export const updateCurrentUser = async (
  updates: Partial<
    Pick<User, "name" | "email">
  >
): Promise<User> => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error(
      "Authentication required."
    );
  }

  setAuthToken(token);

  const payload: Partial<
    Pick<User, "name" | "email">
  > = {};

  if (updates.name !== undefined) {
    const trimmedName =
      updates.name.trim();

    if (!trimmedName) {
      throw new Error(
        "Name is required."
      );
    }

    payload.name = trimmedName;
  }

  if (updates.email !== undefined) {
    const trimmedEmail =
      updates.email.trim().toLowerCase();

    if (!trimmedEmail) {
      throw new Error(
        "Email is required."
      );
    }

    payload.email = trimmedEmail;
  }

  try {
    const response =
      await axios.put<UpdateProfileResponse>(
        `${API_URL}/profile`,
        payload
      );

    return response.data.user;
  } catch (error) {
    console.error(
      "Profile update failed:",
      error
    );

    if (axios.isAxiosError(error)) {
      const serverMessage =
        error.response?.data?.message;

      if (
        typeof serverMessage === "string" &&
        serverMessage.trim()
      ) {
        throw new Error(serverMessage);
      }

      if (
        error.response?.status === 401
      ) {
        localStorage.removeItem(
          TOKEN_KEY
        );
        clearAuthToken();
      }

      throw new Error(
        "Unable to update your profile."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Profile update failed."
    );
  }
};

export const restoreAuthToken = (): void => {
  const token =
    localStorage.getItem(TOKEN_KEY);

  if (token) {
    setAuthToken(token);
  }
};
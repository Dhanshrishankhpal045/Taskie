import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  restoreAuthToken,
  updateCurrentUser,
  type User,
} from "../api/authApi";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;

  updateProfile: (
    updates: Partial<
      Pick<User, "name" | "email">
    >
  ) => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        try {
          restoreAuthToken();

          const currentUser =
            await getCurrentUser();

          if (mounted) {
            setUser(currentUser);
          }
        } catch (error) {
          console.error(
            "Failed to restore session:",
            error
          );

          if (mounted) {
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<void> => {
    const loggedInUser =
      await loginUser(
        email,
        password
      );

    setUser(loggedInUser);
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    const newUser =
      await registerUser(
        name,
        email,
        password
      );

    setUser(newUser);
  };

  const logout = (): void => {
    logoutUser();
    setUser(null);
  };

  const updateProfile = async (
    updates: Partial<
      Pick<User, "name" | "email">
    >
  ): Promise<void> => {
    const updatedUser =
      await updateCurrentUser(
        updates
      );

    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated:
          Boolean(user),
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth =
  (): AuthContextType => {
    const context =
      useContext(AuthContext);

    if (!context) {
      throw new Error(
        "useAuth must be used inside an AuthProvider."
      );
    }

    return context;
  };
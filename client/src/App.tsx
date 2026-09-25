import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import type { ReactElement } from "react";

import Layout from "./components/Layout";
import MeetingDetailsRoute from "./components/MeetingDetailsRoute";

import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import Meetings from "./pages/Meetings";
import NewMeeting from "./pages/NewMeeting";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

interface ProtectedRouteProps {
  children: ReactElement;
}

const ProtectedRoute = ({
  children,
}: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card">
          <div className="app-loading-spinner" />

          <p>
            Loading Taskie...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
};

const App = () => {
  return (
    <AuthProvider>

      <Routes>

        {/* =================================================
            AUTHENTICATION
            ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =================================================
            PROTECTED APPLICATION
            ================================================= */}

        <Route
          element={<ProtectedLayout />}
        >

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* Meetings */}
          <Route
            path="/meetings"
            element={<Meetings />}
          />


          {/* New Meeting */}
          <Route
            path="/meetings/new"
            element={<NewMeeting />}
          />


          {/* Meeting Details */}
          <Route
            path="/meetings/:id"
            element={<MeetingDetailsRoute />}
          />


          {/* Tasks */}
          <Route
            path="/tasks"
            element={<Tasks />}
          />


          {/* History */}
          <Route
            path="/history"
            element={<History />}
          />


          {/* Profile */}
          <Route
            path="/profile"
            element={<Profile />}
          />


          {/* Settings */}
          <Route
            path="/settings"
            element={<Settings />}
          />


          {/* Root */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Route>


        {/* =================================================
            UNKNOWN ROUTES
            ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </AuthProvider>
  );
};

export default App;
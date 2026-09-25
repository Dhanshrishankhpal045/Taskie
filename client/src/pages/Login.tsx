import {
  useState,
  type FormEvent,
} from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          throw new Error("Please enter your full name.");
        }

        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }

        if (!password) {
          throw new Error("Please enter a password.");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await register(name.trim(), email.trim(), password);
      } else {
        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }

        if (!password) {
          throw new Error("Please enter your password.");
        }

        await login(email.trim(), password);
      }

      // AuthContext handles the existing authentication persistence.
      // Keep rememberMe available for the current UI without changing
      // the existing authentication flow.
      void rememberMe;

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegistering((current) => !current);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRememberMe(false);
  };

  return (
    <main className="taskie-auth-page">
      <section
        className="taskie-auth-shell"
        aria-label="Taskie authentication"
      >
        {/* LEFT VISUAL PANEL */}
        <div className="taskie-auth-visual" aria-hidden="true">
          <img
            src="/taskie-login-visual.jpeg"
            alt=""
            className="taskie-auth-visual-image"
          />

          <div className="taskie-auth-visual-overlay" />

          <div className="taskie-auth-visual-copy">
            <span>MEETING INTELLIGENCE</span>

            <h1>
              Turn conversations into
              <br />
              verified execution.
            </h1>

            <p>
              Capture decisions, verify action items, and keep your team
              moving.
            </p>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="taskie-auth-panel">
          <div className="taskie-auth-brand">
            <div className="taskie-auth-brand-icon">
              <LogIn size={21} strokeWidth={2.2} />
            </div>

            <div>
              <h1>Taskie</h1>
              <p>From Conversation → to Verified Execution</p>
            </div>
          </div>

          <div className="taskie-auth-heading">
            <span className="taskie-auth-eyebrow">
              {isRegistering ? "GET STARTED" : "WELCOME"}
            </span>

            <h2>
              {isRegistering ? "Create your account" : "Welcome"}
            </h2>

            <p>
              {isRegistering
                ? "Create an account to start turning meetings into action."
                : "Sign in to continue managing your meetings and tasks."}
            </p>
          </div>

          {error && (
            <div className="taskie-auth-error" role="alert">
              {error}
            </div>
          )}

          <form className="taskie-auth-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="taskie-auth-field">
                <label htmlFor="name">Full name</label>

                <div className="taskie-auth-input-wrap">
                  <UserRound size={18} aria-hidden="true" />

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="taskie-auth-field">
              <label htmlFor="email">Email address</label>

              <div className="taskie-auth-input-wrap">
                <Mail size={18} aria-hidden="true" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="taskie-auth-field">
              <label htmlFor="password">Password</label>

              <div className="taskie-auth-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete={
                    isRegistering
                      ? "new-password"
                      : "current-password"
                  }
                  disabled={loading}
                />

                <button
                  type="button"
                  className="taskie-auth-password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div className="taskie-auth-field">
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="taskie-auth-input-wrap">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="taskie-auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {!isRegistering && (
              <div className="taskie-auth-options">
                <label className="taskie-auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    disabled={loading}
                  />

                  <span
                    className="taskie-auth-checkmark"
                    aria-hidden="true"
                  />

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="taskie-auth-forgot"
                  onClick={() =>
                    setError(
                      "Password reset is not connected yet."
                    )
                  }
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="taskie-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="taskie-auth-submit-loading">
                  Please wait...
                </span>
              ) : isRegistering ? (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="taskie-auth-switch">
            <span>
              {isRegistering
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
              disabled={loading}
            >
              {isRegistering ? "Login" : "Create account"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Monitor,
  Moon,
  Palette,
  Save,
  Sun,
} from "lucide-react";

type ThemeMode =
  | "dark"
  | "light"
  | "system";

const THEME_KEY =
  "taskie_theme";

const NOTIFICATIONS_KEY =
  "taskie_notifications";

const getSystemTheme = (): "dark" | "light" => {
  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
};

const applyThemeToDocument = (
  selectedTheme: ThemeMode
) => {
  const actualTheme =
    selectedTheme === "system"
      ? getSystemTheme()
      : selectedTheme;

  document.documentElement.setAttribute(
    "data-theme",
    actualTheme
  );
};

const Settings = () => {
  const [theme, setTheme] =
    useState<ThemeMode>("dark");

  const [notifications, setNotifications] =
    useState(true);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    const storedTheme =
      localStorage.getItem(
        THEME_KEY
      );

    const storedNotifications =
      localStorage.getItem(
        NOTIFICATIONS_KEY
      );

    let initialTheme: ThemeMode =
      "dark";

    if (
      storedTheme === "dark" ||
      storedTheme === "light" ||
      storedTheme === "system"
    ) {
      initialTheme =
        storedTheme;
    }

    setTheme(initialTheme);

    if (
      storedNotifications !==
      null
    ) {
      setNotifications(
        storedNotifications ===
          "true"
      );
    }

    applyThemeToDocument(
      initialTheme
    );
  }, []);

  const handleThemeChange = (
    selectedTheme: ThemeMode
  ) => {
    setTheme(
      selectedTheme
    );

    applyThemeToDocument(
      selectedTheme
    );

    localStorage.setItem(
      THEME_KEY,
      selectedTheme
    );
  };

  const handleSave = () => {
    localStorage.setItem(
      THEME_KEY,
      theme
    );

    localStorage.setItem(
      NOTIFICATIONS_KEY,
      String(
        notifications
      )
    );

    applyThemeToDocument(
      theme
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      2500
    );
  };

  return (
    <div className="settings-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            PREFERENCES
          </p>

          <h1>
            Settings
          </h1>

          <p>
            Customize your Taskie
            experience.
          </p>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <Palette size={20} />
          </div>

          <div>
            <h2>
              Appearance
            </h2>

            <p>
              Choose how Taskie
              should appear.
            </p>
          </div>
        </div>

        <div className="theme-options">
          <button
            type="button"
            className={`theme-option ${
              theme === "dark"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleThemeChange(
                "dark"
              )
            }
            aria-pressed={
              theme === "dark"
            }
          >
            <Moon size={20} />

            <div>
              <strong>
                Dark
              </strong>

              <span>
                Use Taskie's dark
                developer theme.
              </span>
            </div>

            {theme ===
              "dark" && (
              <Check size={18} />
            )}
          </button>

          <button
            type="button"
            className={`theme-option ${
              theme === "light"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleThemeChange(
                "light"
              )
            }
            aria-pressed={
              theme === "light"
            }
          >
            <Sun size={20} />

            <div>
              <strong>
                Light
              </strong>

              <span>
                Use a brighter
                interface.
              </span>
            </div>

            {theme ===
              "light" && (
              <Check size={18} />
            )}
          </button>

          <button
            type="button"
            className={`theme-option ${
              theme === "system"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleThemeChange(
                "system"
              )
            }
            aria-pressed={
              theme === "system"
            }
          >
            <Monitor size={20} />

            <div>
              <strong>
                System
              </strong>

              <span>
                Follow your device
                preference.
              </span>
            </div>

            {theme ===
              "system" && (
              <Check size={18} />
            )}
          </button>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <Bell size={20} />
          </div>

          <div>
            <h2>
              Notifications
            </h2>

            <p>
              Control your
              notification preference.
            </p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div>
            <strong>
              Enable notifications
            </strong>

            <p>
              Keep notification
              preferences enabled for
              future Taskie updates.
            </p>
          </div>

          <button
            type="button"
            className={`settings-toggle ${
              notifications
                ? "active"
                : ""
            }`}
            onClick={() =>
              setNotifications(
                (current) =>
                  !current
              )
            }
            aria-label="Toggle notifications"
            aria-pressed={
              notifications
            }
          >
            <span />
          </button>
        </div>
      </section>

      <div className="settings-save-area">
        {saved && (
          <span className="settings-saved">
            <Check size={16} />
            Settings saved
          </span>
        )}

        <button
          type="button"
          className="create-button"
          onClick={
            handleSave
          }
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
import { useState } from "react";
import {
  Mail,
  Pencil,
  Save,
  User,
  X,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const {
    user,
    updateProfile,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState(user?.name || "");

  const [email, setEmail] =
    useState(user?.email || "");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleEdit = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setError("");
    setSuccess("");
    setEditing(false);
  };

  const handleSave =
    async () => {
      try {
        setError("");
        setSuccess("");

        if (!name.trim()) {
          setError(
            "Name is required."
          );
          return;
        }

        if (!email.trim()) {
          setError(
            "Email is required."
          );
          return;
        }

        await updateProfile({
          name: name.trim(),
          email: email
            .trim()
            .toLowerCase(),
        });

        setSuccess(
          "Profile updated successfully."
        );

        setEditing(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update profile."
        );
      }
    };

  const handleLogout =
    () => {
      logout();

      navigate("/login", {
        replace: true,
      });
    };

  if (!user) {
    return null;
  }

  const initial =
    user.name
      ? user.name
          .charAt(0)
          .toUpperCase()
      : "U";

  const createdDate =
    user.createdAt
      ? new Date(
          user.createdAt
        )
      : null;

  const formattedCreatedDate =
    createdDate &&
    !Number.isNaN(
      createdDate.getTime()
    )
      ? createdDate.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        )
      : "Not available";

  return (
    <div className="profile-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            ACCOUNT
          </p>

          <h1>
            Profile
          </h1>

          <p>
            Manage your Taskie
            account information.
          </p>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {initial}
          </div>

          <div className="profile-header-info">
            <h2>
              {user.name}
            </h2>

            <p>
              {user.email}
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              className="secondary-button profile-edit-button"
              onClick={
                handleEdit
              }
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>

        <div className="profile-divider" />

        {error && (
          <div className="profile-message profile-error">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-message profile-success">
            {success}
          </div>
        )}

        <div className="profile-fields">
          <div className="profile-field">
            <label htmlFor="profile-name">
              Name
            </label>

            <div className="profile-input-wrapper">
              <User size={18} />

              <input
                id="profile-name"
                type="text"
                value={name}
                disabled={!editing}
                onChange={(
                  event
                ) =>
                  setName(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="profile-email">
              Email
            </label>

            <div className="profile-input-wrapper">
              <Mail size={18} />

              <input
                id="profile-email"
                type="email"
                value={email}
                disabled={!editing}
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </div>

          <div className="profile-field">
            <label>
              Account ID
            </label>

            <div className="profile-readonly-value">
              {user.id}
            </div>
          </div>

          <div className="profile-field">
            <label>
              Account Created
            </label>

            <div className="profile-readonly-value">
              {formattedCreatedDate}
            </div>
          </div>
        </div>

        {editing && (
          <div className="profile-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={
                handleCancel
              }
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="button"
              className="create-button"
              onClick={
                handleSave
              }
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )}
      </section>

      <section className="profile-card">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <User size={20} />
          </div>

          <div>
            <h2>
              Account
            </h2>

            <p>
              Your account is protected
              by Taskie's authentication
              system.
            </p>
          </div>
        </div>

        <div className="profile-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={
              handleLogout
            }
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MeetingDetails from "./MeetingDetails";

import type { Meeting } from "../api/meetingApi";
import { getMeetingById } from "../api/meetingRouteApi.ts";

const MeetingDetailsRoute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMeeting = async () => {
      if (!id) {
        setError("Meeting ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const loadedMeeting = await getMeetingById(id);

        setMeeting(loadedMeeting);
      } catch (err) {
        console.error(
          "Failed to load meeting details:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load meeting details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMeeting();
  }, [id]);

  const handleMeetingUpdated = (
    updatedMeeting: Meeting
  ) => {
    setMeeting(updatedMeeting);
  };

  const handleBack = () => {
    navigate("/meetings");
  };

  if (loading) {
    return (
      <div className="meeting-route-loading">
        <div className="meeting-route-loading-card">
          <div className="app-loading-spinner" />

          <p>
            Loading meeting details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meeting-route-error">
        <div className="meeting-route-error-card">

          <h2>
            Unable to load meeting
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={handleBack}
          >
            Back to Meetings
          </button>

        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="meeting-route-error">
        <div className="meeting-route-error-card">

          <h2>
            Meeting not found
          </h2>

          <p>
            The requested meeting could not be found.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={handleBack}
          >
            Back to Meetings
          </button>

        </div>
      </div>
    );
  }

  return (
    <MeetingDetails
      meeting={meeting}
      onMeetingUpdated={handleMeetingUpdated}
      onBack={handleBack}
    />
  );
};

export default MeetingDetailsRoute;
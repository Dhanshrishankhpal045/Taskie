import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  ListChecks,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  
} from "lucide-react";

import {
  getMeetings,
  type Meeting,
} from "../api/meetingApi";
import {
  exportMeetingJSON,
  exportMeetingPDF,
} from "../api/exportApi";

function formatDate(dateString?: string) {
  if (!dateString) {
    return "Unknown date";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status?: Meeting["analysisStatus"]) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Pending";
}

function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [exportingId, setExportingId] = useState<string>("");

  const handleExport = async (
    meeting: Meeting,
    format: "pdf" | "json"
  ) => {
    try {
      setExportingId(`${meeting._id}-${format}`);

      if (format === "pdf") {
        await exportMeetingPDF(meeting._id, meeting.title);
      } else {
        await exportMeetingJSON(meeting._id, meeting.title);
      }
    } catch (err) {
      console.error(`Failed to export meeting as ${format}:`, err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to export meeting as ${format}.`
      );
    } finally {
      setExportingId("");
    }
  };

  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "title-asc" | "title-desc"
  >("newest");

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMeetings();

        setMeetings(data);
      } catch (err) {
        console.error("Failed to load meetings:", err);
        setError("Failed to load meetings.");
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
  }, []);

  const filteredMeetings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = meetings.filter((meeting) => {
      const matchesSearch =
        !normalizedQuery ||
        meeting.title.toLowerCase().includes(normalizedQuery) ||
        (meeting.summary ?? "")
          .toLowerCase()
          .includes(normalizedQuery) ||
        (meeting.transcript ?? "")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" ||
        (meeting.analysisStatus ?? "pending") === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }

      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      if (sortBy === "oldest") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });
  }, [meetings, searchQuery, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="meetings-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">MEETINGS</p>
            <h1>Your Meetings</h1>
            <p>
              Review conversations, AI insights, decisions,
              and action items.
            </p>
          </div>
        </div>

        <div className="meetings-loading">
          <Loader2 className="loading-spinner" size={22} />
          <span>Loading meetings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="meetings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MEETINGS</p>

          <h1>Your Meetings</h1>

          <p>
            Review conversations, AI insights, decisions,
            and action items.
          </p>
        </div>

        <Link
          to="/meetings/new"
          className="create-button"
        >
          <Plus size={18} />
          New Meeting
        </Link>
      </div>

      {error && (
        <div className="meetings-error">
          <FileText size={18} />
          <span>{error}</span>
        </div>
      )}

      {!error && meetings.length > 0 && (
        <div
          className="meetings-toolbar"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) auto auto",
            gap: "12px",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Search size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search meetings..."
              aria-label="Search meetings"
              style={{
                width: "100%",
                minWidth: 0,
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <SlidersHorizontal size={17} />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "pending"
                    | "approved"
                    | "rejected"
                )
              }
              aria-label="Filter meetings by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowUpDown size={17} />
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as
                    | "newest"
                    | "oldest"
                    | "title-asc"
                    | "title-desc"
                )
              }
              aria-label="Sort meetings"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
          </label>
        </div>
      )}

      {!error && meetings.length === 0 && (
        <div className="meetings-empty">
          <div className="empty-state-icon">
            <CalendarDays size={21} />
          </div>

          <h2>No meetings yet</h2>

          <p>
            Create your first meeting and turn the
            conversation into verified action.
          </p>

          <Link
            to="/meetings/new"
            className="create-button"
          >
            <Plus size={18} />
            Create Meeting
          </Link>
        </div>
      )}

      {meetings.length > 0 && filteredMeetings.length === 0 && (
        <div className="meetings-empty">
          <div className="empty-state-icon">
            <Search size={21} />
          </div>

          <h2>No matching meetings</h2>

          <p>
            Try a different search term or change the status
            filter.
          </p>
        </div>
      )}

      {filteredMeetings.length > 0 && (
        <div className="meetings-grid">
          {filteredMeetings.map((meeting) => {
            const actionItemCount =
              meeting.actionItems?.length ?? 0;

            const status =
              getStatusLabel(meeting.analysisStatus);

            return (
              <div
                key={meeting._id}
                className="meeting-card"
              >
                <div className="meeting-card-top">
                  <div className="meeting-card-icon">
                    <CalendarDays size={19} />
                  </div>

                  <span
                    className={`meeting-status ${meeting.analysisStatus ?? "pending"}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="meeting-card-content">
                  <h2>{meeting.title}</h2>

                  <p>
                    {meeting.summary ||
                      "No summary available for this meeting yet."}
                  </p>
                </div>

                <div className="meeting-card-footer">
                  <div className="meeting-card-meta">
                    <span>
                      <CalendarDays size={14} />
                      {formatDate(meeting.createdAt)}
                    </span>

                    <span>
                      <ListChecks size={14} />
                      {actionItemCount}{" "}
                      {actionItemCount === 1
                        ? "action"
                        : "actions"}
                    </span>
                  </div>

                  <div className="meeting-card-arrow">
                    <Link
                      to={`/meetings/${meeting._id}`}
                      aria-label={`Open ${meeting.title}`}
                    >
                      <ChevronRight size={17} />
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    to={`/meetings/${meeting._id}`}
                    className="meeting-action-secondary"
                  >
                    <FileText size={14} />
                    Open
                  </Link>

                  <button
                    type="button"
                    className="meeting-action-secondary"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleExport(meeting, "pdf");
                    }}
                    disabled={exportingId !== ""}
                  >
                    <FileText size={14} />
                    {exportingId === `${meeting._id}-pdf`
                      ? "PDF..."
                      : "PDF"}
                  </button>

                  <button
                    type="button"
                    className="meeting-action-secondary"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleExport(meeting, "json");
                    }}
                    disabled={exportingId !== ""}
                  >
                    <Download size={14} />
                    {exportingId === `${meeting._id}-json`
                      ? "JSON..."
                      : "JSON"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Meetings;
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMeetings,
  type Meeting,
} from "../api/meetingApi";

type StatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

type SortOrder =
  | "newest"
  | "oldest"
  | "title";

const History = () => {
  const navigate = useNavigate();

  const [meetings, setMeetings] =
    useState<Meeting[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [sortOrder, setSortOrder] =
    useState<SortOrder>("newest");

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMeetings();

        setMeetings(data);
      } catch (err) {
        console.error(
          "Failed to load history:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load meeting history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
  }, []);

  const normalizedSearch =
    searchQuery
      .trim()
      .toLowerCase();

  const filteredMeetings =
    useMemo(() => {
      const filtered = meetings.filter(
        (meeting) => {
          const searchableText = [
            meeting.title,
            meeting.summary,
            meeting.aiNotes,
            meeting.personalNotes,
            meeting.transcript,
            ...(meeting.decisions ?? []),
            ...(meeting.unresolvedQuestions ?? []),
            ...(meeting.actionItems ?? []).map(
              (item) =>
                [
                  item.text,
                  item.assignee,
                  item.priority,
                  item.status,
                ]
                  .filter(Boolean)
                  .join(" ")
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(
              normalizedSearch
            );

          const matchesStatus =
            statusFilter === "all" ||
            meeting.analysisStatus ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

      return [...filtered].sort(
        (a, b) => {
          if (
            sortOrder === "title"
          ) {
            return a.title.localeCompare(
              b.title
            );
          }

          const timeA = a.createdAt
            ? new Date(
                a.createdAt
              ).getTime()
            : 0;

          const timeB = b.createdAt
            ? new Date(
                b.createdAt
              ).getTime()
            : 0;

          return sortOrder === "newest"
            ? timeB - timeA
            : timeA - timeB;
        }
      );
    },
    [
      meetings,
      normalizedSearch,
      statusFilter,
      sortOrder,
    ]
  );

  const totalMeetings =
    meetings.length;

  const pendingMeetings =
    meetings.filter(
      (meeting) =>
        meeting.analysisStatus ===
        "pending"
    ).length;

  const approvedMeetings =
    meetings.filter(
      (meeting) =>
        meeting.analysisStatus ===
        "approved"
    ).length;

  const rejectedMeetings =
    meetings.filter(
      (meeting) =>
        meeting.analysisStatus ===
        "rejected"
    ).length;

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    sortOrder !== "newest";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOrder("newest");
  };

  const getStatusLabel = (
    status?: Meeting["analysisStatus"]
  ) => {
    switch (status) {
      case "approved":
        return "Approved";

      case "rejected":
        return "Rejected";

      case "pending":
      default:
        return "Pending";
    }
  };

  const getStatusClass = (
    status?: Meeting["analysisStatus"]
  ) => {
    switch (status) {
      case "approved":
        return "history-status approved";

      case "rejected":
        return "history-status rejected";

      case "pending":
      default:
        return "history-status pending";
    }
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (
    date?: string
  ) => {
    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const getActionItemCount = (
    meeting: Meeting
  ) => {
    return (
      meeting.actionItems?.length ??
      0
    );
  };

  const getDecisionCount = (
    meeting: Meeting
  ) => {
    return (
      meeting.decisions?.length ??
      0
    );
  };

  const getUnresolvedCount = (
    meeting: Meeting
  ) => {
    return (
      meeting.unresolvedQuestions
        ?.length ?? 0
    );
  };

  const handleViewMeeting = (
    meetingId: string
  ) => {
    navigate(
      `/meetings/${meetingId}`
    );
  };

  if (loading) {
    return (
      <section className="history-page">
        <div className="history-loading">
          <div className="history-loading-spinner" />

          <p>
            Loading meeting history...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="history-page">
      {/* HEADER */}

      <div className="history-header">
        <div>
          <p className="history-eyebrow">
            Meeting archive
          </p>

          <h1>
            History
          </h1>

          <p className="history-subtitle">
            Review your previous meetings,
            analysis results, and verification
            status.
          </p>
        </div>

        <button
          type="button"
          className="history-new-meeting-button"
          onClick={() =>
            navigate("/meetings/new")
          }
        >
          <FileText size={17} />

          New Meeting
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="history-error">
          <XCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* STATISTICS */}

      <div className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-icon">
            <FileText size={19} />
          </div>

          <div>
            <span>
              Total Meetings
            </span>

            <strong>
              {totalMeetings}
            </strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon pending">
            <Clock3 size={19} />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {pendingMeetings}
            </strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon approved">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>
              Approved
            </span>

            <strong>
              {approvedMeetings}
            </strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon rejected">
            <XCircle size={19} />
          </div>

          <div>
            <span>
              Rejected
            </span>

            <strong>
              {rejectedMeetings}
            </strong>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}

      <div className="history-toolbar">
        <div className="history-search">
          <Search size={18} />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search meetings, notes, decisions, action items..."
            aria-label="Search meeting history"
          />
        </div>

        <div className="history-filters">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            aria-label="Filter by status"
          >
            <option value="all">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(
                event.target
                  .value as SortOrder
              )
            }
            aria-label="Sort meetings"
          >
            <option value="newest">
              Newest First
            </option>

            <option value="oldest">
              Oldest First
            </option>

            <option value="title">
              Title A-Z
            </option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="history-clear-button"
              onClick={clearFilters}
            >
              <RotateCcw size={15} />

              Clear
            </button>
          )}
        </div>
      </div>

      {/* RESULTS SUMMARY */}

      {meetings.length > 0 && (
        <div className="history-results-summary">
          <span>
            Showing{" "}
            <strong>
              {filteredMeetings.length}
            </strong>{" "}
            of{" "}
            <strong>
              {meetings.length}
            </strong>{" "}
            meetings
          </span>
        </div>
      )}

      {/* EMPTY / NO RESULTS */}

      {filteredMeetings.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <FileText size={25} />
          </div>

          <h2>
            {meetings.length === 0
              ? "No meetings yet"
              : "No meetings found"}
          </h2>

          <p>
            {meetings.length === 0
              ? "Your analyzed meetings will appear here."
              : "Try changing your search or filters."}
          </p>

          {meetings.length === 0 ? (
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/meetings/new"
                )
              }
              className="history-empty-button"
            >
              Create Your First Meeting

              <ArrowRight size={16} />
            </button>
          ) : (
            hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="history-empty-button"
              >
                Clear Search & Filters

                <RotateCcw size={16} />
              </button>
            )
          )}
        </div>
      ) : (
        /* HISTORY LIST */

        <div className="history-list">
          {filteredMeetings.map(
            (meeting) => {
              const actionItemCount =
                getActionItemCount(
                  meeting
                );

              const decisionCount =
                getDecisionCount(
                  meeting
                );

              const unresolvedCount =
                getUnresolvedCount(
                  meeting
                );

              return (
                <article
                  key={meeting._id}
                  className="history-card"
                >
                  <div className="history-card-main">
                    {/* CARD HEADER */}

                    <div className="history-card-top">
                      <div className="history-card-title-wrap">
                        <div className="history-card-icon">
                          <FileText
                            size={18}
                          />
                        </div>

                        <div>
                          <h2>
                            {meeting.title}
                          </h2>

                          <div className="history-card-meta">
                            <span>
                              <CalendarDays
                                size={14}
                              />

                              {formatDate(
                                meeting.createdAt
                              )}
                            </span>

                            {formatTime(
                              meeting.createdAt
                            ) && (
                              <span>
                                <Clock3
                                  size={14}
                                />

                                {formatTime(
                                  meeting.createdAt
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={getStatusClass(
                          meeting.analysisStatus
                        )}
                      >
                        {getStatusLabel(
                          meeting.analysisStatus
                        )}
                      </span>
                    </div>

                    {/* SUMMARY */}

                    {meeting.summary && (
                      <p className="history-card-summary">
                        {meeting.summary}
                      </p>
                    )}

                    {/* CARD FOOTER */}

                    <div className="history-card-bottom">
                      <div className="history-card-info">
                        <span>
                          {actionItemCount}{" "}
                          action item
                          {actionItemCount ===
                          1
                            ? ""
                            : "s"}
                        </span>

                        <span>
                          {decisionCount}{" "}
                          decision
                          {decisionCount ===
                          1
                            ? ""
                            : "s"}
                        </span>

                        <span>
                          {unresolvedCount}{" "}
                          unresolved
                        </span>
                      </div>

                      <button
                        type="button"
                        className="history-view-button"
                        onClick={() =>
                          handleViewMeeting(
                            meeting._id
                          )
                        }
                      >
                        View Meeting

                        <ArrowRight
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
};

export default History;
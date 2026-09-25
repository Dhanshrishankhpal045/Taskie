import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Target,
  X,
  XCircle,
} from "lucide-react";

import {
  addActionItem,
  api,
  deleteActionItem,
} from "../api/meetingApi";
import type { Meeting } from "../api/meetingApi";
import API_URL from "../apiConfig";
import { downloadMeetingReport } from "../utils/reportGenerator";
import {
  exportMeetingJSON,
  exportMeetingPDF,
} from "../api/exportApi";

interface MeetingDetailsProps {
  meeting: Meeting;
  onMeetingUpdated: (meeting: Meeting) => void;
  onBack: () => void;
}


function MeetingDetails({
  meeting,
  onMeetingUpdated,
  onBack,
}: MeetingDetailsProps) {
  const [loadingAction, setLoadingAction] = useState("");

  const [editingIndex, setEditingIndex] = useState<number | null>(
    null
  );

  const [editText, setEditText] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const [editPriority, setEditPriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");

  const [createdTaskIndexes, setCreatedTaskIndexes] = useState<
    number[]
  >([]);

  const [error, setError] = useState("");

  const [exporting, setExporting] = useState<"pdf" | "json" | "">("");

  const [personalNotes, setPersonalNotes] = useState(
    meeting.personalNotes || ""
  );

  const [personalNotesSaved, setPersonalNotesSaved] = useState(false);

  const [showAddActionItem, setShowAddActionItem] =
    useState(false);
  const [newActionText, setNewActionText] =
    useState("");
  const [newActionAssignee, setNewActionAssignee] =
    useState("");
  const [newActionDueDate, setNewActionDueDate] =
    useState("");
  const [newActionPriority, setNewActionPriority] =
    useState<"low" | "medium" | "high" | "critical">("medium");

  useEffect(() => {
    setPersonalNotes(meeting.personalNotes || "");
    setPersonalNotesSaved(false);
  }, [meeting.personalNotes]);

  const actionItems = meeting.actionItems || [];
  const decisions = meeting.decisions || [];
  const unresolvedQuestions = meeting.unresolvedQuestions || [];

  const isPendingVerification =
    !meeting.analysisStatus ||
    meeting.analysisStatus === "pending";

  const isApproved =
    meeting.analysisStatus === "approved";

  const isRejected =
    meeting.analysisStatus === "rejected";

  /*
   * ============================================================
   * MEETING PROGRESS / EXECUTION READINESS
   * ============================================================
   * These metrics are derived from the existing meeting data.
   * Nothing is persisted or changed here; this is presentation only.
   */

  const pendingActionItems = actionItems.filter(
    (item) => item.status === "pending"
  ).length;

  const approvedActionItems = actionItems.filter(
    (item) => item.status === "approved"
  ).length;

  const rejectedActionItems = actionItems.filter(
    (item) => item.status === "rejected"
  ).length;

  const reviewedActionItems =
    approvedActionItems + rejectedActionItems;

  const verificationProgress =
    actionItems.length === 0
      ? 100
      : Math.round(
          (reviewedActionItems / actionItems.length) * 100
        );

  const approvalProgress =
    actionItems.length === 0
      ? 0
      : Math.round(
          (approvedActionItems / actionItems.length) * 100
        );

  const highPriorityActionItems = actionItems.filter(
    (item) =>
      item.priority === "high" ||
      item.priority === "critical"
  ).length;

  const actionItemsWithDueDates = actionItems.filter(
    (item) => Boolean(item.dueDate)
  ).length;

  const meetingProgressLabel = isRejected
    ? "Analysis Rejected"
    : isApproved && pendingActionItems === 0
    ? "Verified & Ready"
    : isApproved
    ? "Analysis Approved"
    : "Verification In Progress";

  const meetingProgressMessage = isRejected
    ? "The meeting analysis was rejected. Review the extracted information before using it as final work."
    : actionItems.length === 0
    ? "No action items were extracted. The meeting currently has no execution items waiting for verification."
    : `${approvedActionItems} of ${actionItems.length} action items are approved for execution.`;

  const getAnalysisStatus = () => {
    if (isApproved) {
      return "Approved";
    }

    if (isRejected) {
      return "Rejected";
    }

    return "Pending Verification";
  };

  const getStatusClass = () => {
    if (isApproved) {
      return "approved";
    }

    if (isRejected) {
      return "rejected";
    }

    return "pending";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return "Unknown date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleString();
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /*
   * ============================================================
   * MEETING-LEVEL VERIFICATION
   * ============================================================
   */

  const approveMeeting = async () => {
    if (isApproved) {
      return;
    }

    try {
      setError("");
      setLoadingAction("approve-meeting");

      const response = await api.patch<{
        meeting: Meeting;
      }>(
        `${API_URL}/meetings/${meeting._id}/approve`
      );

      onMeetingUpdated(response.data.meeting);
    } catch (err) {
      console.error(
        "Failed to approve meeting:",
        err
      );

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Failed to approve meeting analysis."
        );
      } else {
        setError(
          "Failed to approve meeting analysis."
        );
      }
    } finally {
      setLoadingAction("");
    }
  };

  const rejectMeeting = async () => {
    if (isRejected) {
      return;
    }

    try {
      setError("");
      setLoadingAction("reject-meeting");

      const response = await api.patch<{
        meeting: Meeting;
      }>(
        `${API_URL}/meetings/${meeting._id}/reject`
      );

      onMeetingUpdated(response.data.meeting);
    } catch (err) {
      console.error(
        "Failed to reject meeting:",
        err
      );

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Failed to reject meeting analysis."
        );
      } else {
        setError(
          "Failed to reject meeting analysis."
        );
      }
    } finally {
      setLoadingAction("");
    }
  };

  /*
   * ============================================================
   * ACTION ITEM VERIFICATION
   * ============================================================
   */

  const approveActionItem = async (
    index: number
  ) => {
    try {
      setError("");
      setLoadingAction(
        `approve-action-${index}`
      );

      const response = await api.patch<{
        meeting: Meeting;
      }>(
        `${API_URL}/meetings/action-item/approve`,
        {
          meetingId: meeting._id,
          actionItemIndex: index,
        }
      );

      onMeetingUpdated(response.data.meeting);
    } catch (err) {
      console.error(
        "Failed to approve action item:",
        err
      );

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Failed to approve action item."
        );
      } else {
        setError(
          "Failed to approve action item."
        );
      }
    } finally {
      setLoadingAction("");
    }
  };

  const rejectActionItem = async (
    index: number
  ) => {
    try {
      setError("");
      setLoadingAction(
        `reject-action-${index}`
      );

      const response = await api.patch<{
        meeting: Meeting;
      }>(
        `${API_URL}/meetings/action-item/reject`,
        {
          meetingId: meeting._id,
          actionItemIndex: index,
        }
      );

      onMeetingUpdated(response.data.meeting);
    } catch (err) {
      console.error(
        "Failed to reject action item:",
        err
      );

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Failed to reject action item."
        );
      } else {
        setError(
          "Failed to reject action item."
        );
      }
    } finally {
      setLoadingAction("");
    }
  };

  /*
   * ============================================================
   * ACTION ITEM EDITING
   * ============================================================
   */

  const startEditing = (
    index: number
  ) => {
    const item = actionItems[index];

    if (!item) {
      return;
    }

    setEditingIndex(index);

    setEditText(item.text);

    setEditAssignee(
      item.assignee || ""
    );

    setEditDueDate(
      item.dueDate
        ? new Date(item.dueDate)
            .toISOString()
            .split("T")[0]
        : ""
    );

    setEditPriority(
      item.priority || "medium"
    );

    setError("");
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditText("");
    setEditAssignee("");
    setEditDueDate("");
    setEditPriority("medium");
  };

  const saveActionItem = async (
    index: number
  ) => {
    if (!editText.trim()) {
      setError(
        "Action item cannot be empty."
      );

      return;
    }

    try {
      setError("");

      setLoadingAction(
        `edit-action-${index}`
      );

      const response = await api.patch<{
        meeting: Meeting;
      }>(
        `${API_URL}/meetings/action-item/edit`,
        {
          meetingId: meeting._id,
          actionItemIndex: index,
          text: editText.trim(),
          assignee:
            editAssignee.trim(),
          dueDate:
            editDueDate || undefined,
          priority: editPriority,
        }
      );

      onMeetingUpdated(
        response.data.meeting
      );

      cancelEditing();
    } catch (err) {
      console.error(
        "Failed to edit action item:",
        err
      );

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Failed to edit action item."
        );
      } else {
        setError(
          "Failed to edit action item."
        );
      }
    } finally {
      setLoadingAction("");
    }
  };

  /*
   * ============================================================
   * CREATE TASK FROM APPROVED ACTION ITEM
   * ============================================================
   */

  const handleExport = async (format: "pdf" | "json") => {
    try {
      setError("");
      setExporting(format);

      if (format === "pdf") {
        await exportMeetingPDF(
          meeting._id,
          meeting.title
        );
      } else {
        await exportMeetingJSON(
          meeting._id,
          meeting.title
        );
      }
    } catch (err) {
      console.error(
        `Failed to export meeting as ${format}:`,
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : `Failed to export meeting as ${format}.`
      );
    } finally {
      setExporting("");
    }
  };

  const savePersonalNotes = async () => {
    try {
      setError("");
      setLoadingAction("save-personal-notes");
      setPersonalNotesSaved(false);

      const response = await api.patch<{
        meeting: Meeting;
      }>(
        `${API_URL}/meetings/${meeting._id}/personal-notes`,
        {
          personalNotes,
        }
      );

      onMeetingUpdated(response.data.meeting);
      setPersonalNotesSaved(true);
    } catch (err) {
      console.error("Failed to save personal notes:", err);

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        setError(
          typeof message === "string"
            ? message
            : "Failed to save personal notes."
        );
      } else {
        setError("Failed to save personal notes.");
      }
    } finally {
      setLoadingAction("");
    }
  };

  const resetNewActionItem = () => {
    setShowAddActionItem(false);
    setNewActionText("");
    setNewActionAssignee("");
    setNewActionDueDate("");
    setNewActionPriority("medium");
  };

  const saveNewActionItem = async () => {
    if (!newActionText.trim()) {
      setError("Action item cannot be empty.");
      return;
    }

    try {
      setError("");
      setLoadingAction("add-action");

      const updatedMeeting = await addActionItem(
        meeting._id,
        {
          text: newActionText.trim(),
          assignee: newActionAssignee.trim() || undefined,
          dueDate: newActionDueDate || undefined,
          priority: newActionPriority,
        }
      );

      onMeetingUpdated(updatedMeeting);
      setCreatedTaskIndexes([]);
      resetNewActionItem();
    } catch (err) {
      console.error("Failed to add action item:", err);

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        setError(
          typeof message === "string"
            ? message
            : "Failed to add action item."
        );
      } else {
        setError("Failed to add action item.");
      }
    } finally {
      setLoadingAction("");
    }
  };

  const removeActionItem = async (index: number) => {
    const item = actionItems[index];

    if (!item) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this action item? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setLoadingAction(`delete-action-${index}`);

      const updatedMeeting = await deleteActionItem(
        meeting._id,
        index
      );

      onMeetingUpdated(updatedMeeting);
      setCreatedTaskIndexes([]);

      if (editingIndex === index) {
        cancelEditing();
      }
    } catch (err) {
      console.error("Failed to delete action item:", err);

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        setError(
          typeof message === "string"
            ? message
            : "Failed to delete action item."
        );
      } else {
        setError("Failed to delete action item.");
      }
    } finally {
      setLoadingAction("");
    }
  };



  const createTask = async (
    index: number
  ) => {
    const item = actionItems[index];

    if (!item) {
      return;
    }

    if (item.status !== "approved") {
      setError(
        "Only approved action items can be converted into tasks."
      );

      return;
    }

    if (
      createdTaskIndexes.includes(index)
    ) {
      return;
    }

    try {
      setError("");

      setLoadingAction(
        `create-task-${index}`
      );

      await api.post(
        `${API_URL}/tasks/from-action-item`,
        {
          meetingId: meeting._id,
          actionItemIndex: index,
          actionItemId: item.actionItemId,
        }
      );

      setCreatedTaskIndexes(
        (current) => [
          ...current,
          index,
        ]
      );
    } catch (err) {
      console.error(
        "Failed to create task:",
        err
      );

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === "string"
            ? message
            : "Failed to create task."
        );
      } else {
        setError(
          "Failed to create task."
        );
      }
    } finally {
      setLoadingAction("");
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="meeting-details-page">

      <style>{`
        .meeting-progress-card {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 18px;
          padding: 20px;
          background: rgba(15, 23, 42, 0.55);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
        }

        .meeting-progress-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .meeting-progress-eyebrow {
          display: block;
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #94a3b8;
        }

        .meeting-progress-card-top strong {
          display: block;
          font-size: 30px;
          line-height: 1;
        }

        .meeting-progress-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.12);
        }

        .meeting-progress-track {
          width: 100%;
          height: 9px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
        }

        .meeting-progress-track-small {
          height: 7px;
          margin-top: 9px;
        }

        .meeting-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 220ms ease;
        }

        .meeting-progress-message {
          margin: 12px 0 0;
          color: #94a3b8;
          line-height: 1.55;
        }

        .meeting-progress-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .meeting-progress-stat {
          min-width: 0;
          padding: 12px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.42);
        }

        .meeting-progress-stat span {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
          color: #94a3b8;
        }

        .meeting-progress-stat strong {
          font-size: 20px;
        }

        .meeting-approval-summary {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
        }

        .meeting-approval-summary > div:first-child {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
          color: #cbd5e1;
        }

        @media (max-width: 900px) {
          .meeting-progress-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .meeting-progress-card {
            padding: 16px;
          }

          .meeting-progress-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="meeting-details-header">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Meetings
        </button>

        <div className="meeting-header-content">

          <div>

            <p className="eyebrow">
              MEETING
            </p>

            <h1>
              {meeting.title}
            </h1>

            <div className="meeting-header-meta">

              <span>
                <Clock3 size={14} />
                {formatDate(
                  meeting.createdAt
                )}
              </span>

              <span
                className={`meeting-status meeting-status-${getStatusClass()}`}
              >
                {isApproved ? (
                  <CheckCircle2
                    size={14}
                  />
                ) : isRejected ? (
                  <XCircle
                    size={14}
                  />
                ) : (
                  <Clock3
                    size={14}
                  />
                )}

                {getAnalysisStatus()}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="meeting-download-button"
            onClick={() =>
              downloadMeetingReport(
                meeting
              )
            }
          >
            <Download size={16} />
            Download Report
          </button>

        </div>

      </div>


      {/* ======================================================
          HUMAN VERIFICATION BANNER
      ====================================================== */}

      <section className="meeting-verification-section">

        <div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >

            <ShieldCheck size={20} />

            <h2>
              Human Verification
            </h2>

          </div>

          {isPendingVerification && (
            <p>
              Review the AI-generated meeting
              information and action items before
              approving the analysis.
            </p>
          )}

          {isApproved && (
            <p>
              This AI analysis has been reviewed
              and approved.
            </p>
          )}

          {isRejected && (
            <p>
              This AI analysis has been rejected.
              You can review the extracted
              information above.
            </p>
          )}

        </div>

        {isPendingVerification && (
          <div className="meeting-verification-buttons">

            <button
              type="button"
              className="meeting-action-danger"
              onClick={rejectMeeting}
              disabled={
                loadingAction ===
                  "reject-meeting" ||
                loadingAction ===
                  "approve-meeting"
              }
            >
              <X size={16} />

              {loadingAction ===
              "reject-meeting"
                ? "Rejecting..."
                : "Reject Analysis"}
            </button>

            <button
              type="button"
              className="meeting-action-primary"
              onClick={approveMeeting}
              disabled={
                loadingAction ===
                  "approve-meeting" ||
                loadingAction ===
                  "reject-meeting"
              }
            >
              <CheckCircle2 size={16} />

              {loadingAction ===
              "approve-meeting"
                ? "Approving..."
                : "Approve Analysis"}
            </button>

          </div>
        )}

        {isApproved && (
          <div className="meeting-verification-buttons">

            <span className="meeting-status meeting-status-approved">
              <CheckCircle2 size={14} />
              Verified
            </span>

          </div>
        )}

        {isRejected && (
          <div className="meeting-verification-buttons">

            <span className="meeting-status meeting-status-rejected">
              <XCircle size={14} />
              Rejected
            </span>

          </div>
        )}

      </section>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="meeting-details-error">

          <XCircle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* ======================================================
          MEETING PROGRESS / EXECUTION READINESS
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">
            <BarChart3 size={18} />

            <div>
              <h2>Meeting Progress</h2>
              <p>Verification and execution readiness at a glance</p>
            </div>
          </div>

          <span
            className={`meeting-status meeting-status-${getStatusClass()}`}
          >
            {isRejected ? (
              <XCircle size={14} />
            ) : isApproved ? (
              <CheckCircle2 size={14} />
            ) : (
              <Clock3 size={14} />
            )}
            {meetingProgressLabel}
          </span>

        </div>

        <div className="meeting-progress-card">

          <div className="meeting-progress-card-top">
            <div>
              <span className="meeting-progress-eyebrow">
                VERIFICATION PROGRESS
              </span>
              <strong>{verificationProgress}%</strong>
            </div>

            <div className="meeting-progress-icon">
              <Target size={20} />
            </div>
          </div>

          <div className="meeting-progress-track" aria-label={`Verification progress ${verificationProgress}%`}>
            <div
              className="meeting-progress-fill"
              style={{ width: `${verificationProgress}%` }}
            />
          </div>

          <p className="meeting-progress-message">
            {meetingProgressMessage}
          </p>

          <div className="meeting-progress-grid">

            <div className="meeting-progress-stat">
              <span>Pending</span>
              <strong>{pendingActionItems}</strong>
            </div>

            <div className="meeting-progress-stat">
              <span>Approved</span>
              <strong>{approvedActionItems}</strong>
            </div>

            <div className="meeting-progress-stat">
              <span>Rejected</span>
              <strong>{rejectedActionItems}</strong>
            </div>

            <div className="meeting-progress-stat">
              <span>Decisions</span>
              <strong>{decisions.length}</strong>
            </div>

            <div className="meeting-progress-stat">
              <span>High Priority</span>
              <strong>{highPriorityActionItems}</strong>
            </div>

            <div className="meeting-progress-stat">
              <span>With Due Dates</span>
              <strong>{actionItemsWithDueDates}</strong>
            </div>

          </div>

          {actionItems.length > 0 && (
            <div className="meeting-approval-summary">
              <div>
                <span>Execution approval</span>
                <strong>{approvalProgress}%</strong>
              </div>
              <div className="meeting-progress-track meeting-progress-track-small">
                <div
                  className="meeting-progress-fill"
                  style={{ width: `${approvalProgress}%` }}
                />
              </div>
            </div>
          )}

        </div>

      </section>


      {/* ======================================================
          MEETING OVERVIEW
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">
            <BarChart3 size={18} />

            <div>
              <h2>Meeting Overview</h2>
              <p>Key information from this meeting in one place</p>
            </div>
          </div>

        </div>

        <div className="meeting-overview-grid">

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">Total Action Items</span>
            <strong>{actionItems.length}</strong>
            <span className="meeting-overview-detail">
              AI-extracted execution items
            </span>
          </div>

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">Approved</span>
            <strong>{approvedActionItems}</strong>
            <span className="meeting-overview-detail">
              Ready for task creation
            </span>
          </div>

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">Pending Verification</span>
            <strong>{pendingActionItems}</strong>
            <span className="meeting-overview-detail">
              Still need human review
            </span>
          </div>

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">Rejected</span>
            <strong>{rejectedActionItems}</strong>
            <span className="meeting-overview-detail">
              Not approved for execution
            </span>
          </div>

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">Decisions</span>
            <strong>{decisions.length}</strong>
            <span className="meeting-overview-detail">
              Decisions identified by AI
            </span>
          </div>

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">Unresolved Questions</span>
            <strong>{unresolvedQuestions.length}</strong>
            <span className="meeting-overview-detail">
              Items needing attention
            </span>
          </div>

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">High / Critical</span>
            <strong>{highPriorityActionItems}</strong>
            <span className="meeting-overview-detail">
              Higher-priority action items
            </span>
          </div>

          <div className="meeting-overview-card">
            <span className="meeting-overview-label">Tasks Created</span>
            <strong>{createdTaskIndexes.length}</strong>
            <span className="meeting-overview-detail">
              Created during this session
            </span>
          </div>

        </div>

        <div className="meeting-overview-footer">
          <div>
            <span>Verification</span>
            <strong>{verificationProgress}% reviewed</strong>
          </div>

          <div>
            <span>Execution approval</span>
            <strong>{approvalProgress}% approved</strong>
          </div>

          <div>
            <span>Due dates</span>
            <strong>{actionItemsWithDueDates} of {actionItems.length}</strong>
          </div>
        </div>

      </section>


      {/* ======================================================
          EXPORTS
      ====================================================== */}

      <section className="meeting-details-section">
        <div className="meeting-section-header">
          <div className="meeting-section-title">
            <Download size={18} />
            <div>
              <h2>Export Meeting</h2>
              <p>Download this meeting and its verified information</p>
            </div>
          </div>
        </div>

        <div
          className="meeting-content-card"
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="meeting-action-primary"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== ""}
          >
            <FileText size={16} />
            {exporting === "pdf"
              ? "Exporting PDF..."
              : "Export PDF"}
          </button>

          <button
            type="button"
            className="meeting-action-secondary"
            onClick={() => handleExport("json")}
            disabled={exporting !== ""}
          >
            <Download size={16} />
            {exporting === "json"
              ? "Exporting JSON..."
              : "Export JSON"}
          </button>
        </div>
      </section>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">

            <FileText size={18} />

            <div>

              <h2>
                Summary
              </h2>

              <p>
                AI-generated overview
              </p>

            </div>

          </div>

        </div>

        <div className="meeting-content-card">

          <p>
            {meeting.summary ||
              "No summary available."}
          </p>

        </div>

      </section>


      {/* ======================================================
          AI NOTES
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">

            <FileText size={18} />

            <div>

              <h2>
                AI Notes
              </h2>

              <p>
                Important discussion points
              </p>

            </div>

          </div>

        </div>

        <div className="meeting-content-card">

          <p>
            {meeting.aiNotes ||
              "No AI notes available."}
          </p>

        </div>

      </section>


      {/* ======================================================
          PERSONAL NOTES
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">

            <Pencil size={18} />

            <div>

              <h2>Personal Notes</h2>

              <p>Private notes for your own follow-up</p>

            </div>

          </div>

        </div>

        <div className="meeting-content-card">

          <textarea
            className="meeting-personal-notes-input"
            value={personalNotes}
            onChange={(event) => {
              setPersonalNotes(event.target.value);
              setPersonalNotesSaved(false);
            }}
            placeholder="Write your own notes, reminders, follow-ups, or context..."
            rows={7}
            disabled={loadingAction === "save-personal-notes"}
          />

          <div className="meeting-action-edit-buttons">
            <button
              type="button"
              className="meeting-action-primary"
              onClick={savePersonalNotes}
              disabled={loadingAction === "save-personal-notes"}
            >
              <Save size={15} />
              {loadingAction === "save-personal-notes"
                ? "Saving..."
                : personalNotesSaved
                ? "Saved"
                : "Save Notes"}
            </button>
          </div>

        </div>

      </section>


      {/* ======================================================
          DECISIONS
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">

            <CheckCircle2 size={18} />

            <div>

              <h2>
                Decisions
              </h2>

              <p>
                Decisions identified by AI
              </p>

            </div>

          </div>

        </div>

        <div className="meeting-content-card">

          {decisions.length === 0 ? (

            <p className="meeting-empty-text">
              No decisions identified.
            </p>

          ) : (

            <div className="meeting-list">

              {decisions.map(
                (decision, index) => (

                  <div
                    key={index}
                    className="meeting-list-item"
                  >

                    <span className="meeting-list-number">
                      {index + 1}
                    </span>

                    <span>
                      {decision}
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </section>


      {/* ======================================================
          ACTION ITEMS
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">

            <ListChecks size={18} />

            <div>

              <h2>
                Action Items
              </h2>

              <p>
                Review and verify AI-generated
                tasks
              </p>

            </div>

          </div>

          <div
            className="meeting-section-header-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span className="meeting-section-count">
              {actionItems.length}
            </span>

            <button
              type="button"
              className="meeting-action-secondary"
              onClick={() => {
                setShowAddActionItem((current) => !current);
                setError("");
              }}
            >
              <Plus size={14} />
              Add Action Item
            </button>
          </div>

        </div>


        {showAddActionItem && (
          <div className="meeting-action-edit" style={{ marginBottom: "14px" }}>
            <div className="meeting-edit-field">
              <label>Action Item</label>
              <textarea
                value={newActionText}
                onChange={(event) => setNewActionText(event.target.value)}
                placeholder="Describe the action that needs to be completed..."
              />
            </div>

            <div className="meeting-edit-grid">
              <div className="meeting-edit-field">
                <label>Assignee</label>
                <input
                  value={newActionAssignee}
                  onChange={(event) => setNewActionAssignee(event.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="meeting-edit-field">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newActionDueDate}
                  onChange={(event) => setNewActionDueDate(event.target.value)}
                />
              </div>

              <div className="meeting-edit-field">
                <label>Priority</label>
                <select
                  value={newActionPriority}
                  onChange={(event) =>
                    setNewActionPriority(
                      event.target.value as "low" | "medium" | "high" | "critical"
                    )
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="meeting-action-edit-buttons">
              <button
                type="button"
                className="meeting-action-secondary"
                onClick={resetNewActionItem}
                disabled={loadingAction === "add-action"}
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                className="meeting-action-primary"
                onClick={saveNewActionItem}
                disabled={loadingAction === "add-action"}
              >
                <Save size={15} />
                {loadingAction === "add-action" ? "Adding..." : "Add Action Item"}
              </button>
            </div>
          </div>
        )}

        <div className="meeting-action-items">

          {actionItems.length === 0 ? (

            <div className="meeting-content-card">

              <p className="meeting-empty-text">
                No action items identified.
              </p>

            </div>

          ) : (

            actionItems.map(
              (item, index) => {

                const isEditing =
                  editingIndex === index;

                const isCreating =
                  loadingAction ===
                  `create-task-${index}`;

                const isApproving =
                  loadingAction ===
                  `approve-action-${index}`;

                const isRejecting =
                  loadingAction ===
                  `reject-action-${index}`;

                const isSaving =
                  loadingAction ===
                  `edit-action-${index}`;

                const taskCreated =
                  createdTaskIndexes.includes(
                    index
                  );

                return (

                  <div
                    key={index}
                    className="meeting-action-card"
                  >

                    {isEditing ? (

                      /* ==============================
                         EDIT MODE
                      ============================== */

                      <div className="meeting-action-edit">

                        <div className="meeting-edit-field">

                          <label>
                            Action Item
                          </label>

                          <textarea
                            value={editText}
                            onChange={(event) =>
                              setEditText(
                                event.target.value
                              )
                            }
                            rows={3}
                          />

                        </div>


                        <div className="meeting-edit-grid">

                          <div className="meeting-edit-field">

                            <label>
                              Assignee
                            </label>

                            <input
                              type="text"
                              value={
                                editAssignee
                              }
                              onChange={(event) =>
                                setEditAssignee(
                                  event.target.value
                                )
                              }
                              placeholder="Optional"
                            />

                          </div>


                          <div className="meeting-edit-field">

                            <label>
                              Due Date
                            </label>

                            <input
                              type="date"
                              value={
                                editDueDate
                              }
                              onChange={(event) =>
                                setEditDueDate(
                                  event.target.value
                                )
                              }
                            />

                          </div>


                          <div className="meeting-edit-field">

                            <label>
                              Priority
                            </label>

                            <select
                              value={
                                editPriority
                              }
                              onChange={(event) =>
                                setEditPriority(
                                  event.target.value as
                                    | "low"
                                    | "medium"
                                    | "high"
                                    | "critical"
                                )
                              }
                            >

                              <option value="low">
                                Low
                              </option>

                              <option value="medium">
                                Medium
                              </option>

                              <option value="high">
                                High
                              </option>

                              <option value="critical">
                                Critical
                              </option>

                            </select>

                          </div>

                        </div>


                        <div className="meeting-action-edit-buttons">

                          <button
                            type="button"
                            className="meeting-action-secondary"
                            onClick={
                              cancelEditing
                            }
                            disabled={isSaving}
                          >
                            <X size={15} />

                            Cancel
                          </button>


                          <button
                            type="button"
                            className="meeting-action-primary"
                            onClick={() =>
                              saveActionItem(
                                index
                              )
                            }
                            disabled={isSaving}
                          >
                            <Save size={15} />

                            {isSaving
                              ? "Saving..."
                              : "Save Changes"}
                          </button>

                        </div>

                      </div>

                    ) : (

                      /* ==============================
                         NORMAL MODE
                      ============================== */

                      <>

                        <div className="meeting-action-main">

                          <div className="meeting-action-number">
                            {index + 1}
                          </div>


                          <div className="meeting-action-content">

                            <div className="meeting-action-title-row">

                              <h3>
                                {item.text}
                              </h3>


                              <span
                                className={`action-item-status action-item-status-${item.status}`}
                              >

                                {item.status ===
                                "approved" ? (

                                  <CheckCircle2
                                    size={13}
                                  />

                                ) : item.status ===
                                  "rejected" ? (

                                  <XCircle
                                    size={13}
                                  />

                                ) : (

                                  <Clock3
                                    size={13}
                                  />

                                )}

                                {item.status ===
                                "approved"
                                  ? "Approved"
                                  : item.status ===
                                    "rejected"
                                  ? "Rejected"
                                  : "Pending"}

                              </span>

                            </div>


                            <div className="meeting-action-meta">

                              {item.assignee && (
                                <span>
                                  Assignee:{" "}
                                  {item.assignee}
                                </span>
                              )}

                              {item.dueDate && (
                                <span>
                                  Due:{" "}
                                  {formatDueDate(
                                    item.dueDate
                                  )}
                                </span>
                              )}

                              {item.priority && (
                                <span
                                  className={`action-priority action-priority-${item.priority}`}
                                >
                                  {item.priority}
                                </span>
                              )}

                            </div>

                          </div>

                        </div>


                        <div className="meeting-action-buttons">

                          {/* EDIT */}

                          <button
                            type="button"
                            className="meeting-action-secondary"
                            onClick={() =>
                              startEditing(
                                index
                              )
                            }
                          >
                            <Pencil size={14} />

                            Edit
                          </button>

                          <button
                            type="button"
                            className="meeting-action-danger"
                            onClick={() => removeActionItem(index)}
                            disabled={
                              loadingAction ===
                              `delete-action-${index}`
                            }
                          >
                            <X size={14} />
                            {loadingAction === `delete-action-${index}`
                              ? "Deleting..."
                              : "Delete"}
                          </button>


                          {/* APPROVE */}

                          {item.status !==
                            "approved" && (

                            <button
                              type="button"
                              className="meeting-action-primary"
                              onClick={() =>
                                approveActionItem(
                                  index
                                )
                              }
                              disabled={
                                isApproving ||
                                isRejecting
                              }
                            >

                              <Check size={14} />

                              {isApproving
                                ? "Approving..."
                                : "Approve"}

                            </button>

                          )}


                          {/* REJECT */}

                          {item.status !==
                            "rejected" && (

                            <button
                              type="button"
                              className="meeting-action-danger"
                              onClick={() =>
                                rejectActionItem(
                                  index
                                )
                              }
                              disabled={
                                isApproving ||
                                isRejecting
                              }
                            >

                              <X size={14} />

                              {isRejecting
                                ? "Rejecting..."
                                : "Reject"}

                            </button>

                          )}


                          {/* CREATE TASK */}

                          {item.status ===
                            "approved" && (

                            <button
                              type="button"
                              className="meeting-action-task"
                              onClick={() =>
                                createTask(
                                  index
                                )
                              }
                              disabled={
                                isCreating ||
                                taskCreated
                              }
                            >

                              {taskCreated ? (

                                <>

                                  <CheckCircle2
                                    size={14}
                                  />

                                  Task Created

                                </>

                              ) : (

                                <>

                                  <Plus
                                    size={14}
                                  />

                                  {isCreating
                                    ? "Creating Task..."
                                    : "Create Task"}

                                </>

                              )}

                            </button>

                          )}

                        </div>

                      </>

                    )}

                  </div>

                );
              }
            )

          )}

        </div>

      </section>


      {/* ======================================================
          UNRESOLVED QUESTIONS
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">

            <Clock3 size={18} />

            <div>

              <h2>
                Unresolved Questions
              </h2>

              <p>
                Questions that still need
                attention
              </p>

            </div>

          </div>

        </div>


        <div className="meeting-content-card">

          {unresolvedQuestions.length ===
          0 ? (

            <p className="meeting-empty-text">
              No unresolved questions.
            </p>

          ) : (

            <div className="meeting-list">

              {unresolvedQuestions.map(
                (question, index) => (

                  <div
                    key={index}
                    className="meeting-list-item"
                  >

                    <span className="meeting-list-number">
                      ?
                    </span>

                    <span>
                      {question}
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </section>


      {/* ======================================================
          TRANSCRIPT
      ====================================================== */}

      <section className="meeting-details-section">

        <div className="meeting-section-header">

          <div className="meeting-section-title">

            <FileText size={18} />

            <div>

              <h2>
                Transcript
              </h2>

              <p>
                Original meeting transcript
              </p>

            </div>

          </div>

        </div>


        <div className="meeting-transcript-card">

          <pre>
            {meeting.transcript ||
              "No transcript available."}
          </pre>

        </div>

      </section>


      {/* ======================================================
          FINAL VERIFICATION STATUS
      ====================================================== */}

      <section className="meeting-verification-section">

        <div>

          <h2>
            Verification Status
          </h2>

          <p>
            {isPendingVerification &&
              "This meeting is waiting for human verification."}

            {isApproved &&
              "This meeting analysis has been approved by the reviewer."}

            {isRejected &&
              "This meeting analysis has been rejected by the reviewer."}
          </p>

        </div>


        {isPendingVerification && (

          <div className="meeting-verification-buttons">

            <button
              type="button"
              className="meeting-action-danger"
              onClick={rejectMeeting}
              disabled={
                loadingAction ===
                  "reject-meeting" ||
                loadingAction ===
                  "approve-meeting"
              }
            >

              <X size={16} />

              {loadingAction ===
              "reject-meeting"
                ? "Rejecting..."
                : "Reject Analysis"}

            </button>


            <button
              type="button"
              className="meeting-action-primary"
              onClick={approveMeeting}
              disabled={
                loadingAction ===
                  "approve-meeting" ||
                loadingAction ===
                  "reject-meeting"
              }
            >

              <CheckCircle2 size={16} />

              {loadingAction ===
              "approve-meeting"
                ? "Approving..."
                : "Approve Analysis"}

            </button>

          </div>

        )}

      </section>

    </div>
  );
}

export default MeetingDetails;
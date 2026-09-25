import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getMeetings,
  type Meeting,
} from "../api/meetingApi";

import {
  getTasks,
  type Task,
} from "../api/taskApi";

const Dashboard = () => {
  const [meetings, setMeetings] =
    useState<Meeting[]>([]);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboardData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            meetingsData,
            tasksData,
          ] = await Promise.all([
            getMeetings(),
            getTasks(),
          ]);

          if (!mounted) {
            return;
          }

          setMeetings(meetingsData);
          setTasks(tasksData);
        } catch (err) {
          console.error(
            "Failed to load dashboard data:",
            err
          );

          if (mounted) {
            setError(
              "Unable to load some dashboard data."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const totalMeetings =
    meetings.length;

  const pendingVerification =
    meetings.filter(
      (meeting) =>
        meeting.analysisStatus ===
        "pending"
    ).length;

  const totalTasks =
    tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "completed"
    ).length;

  const linkedActionTasks =
    tasks.filter(
      (task) =>
        Boolean(
          task.meetingId &&
          task.actionItemId
        )
    ).length;

  const overdueTasks =
    useMemo(() => {
      const now = new Date();

      return tasks.filter((task) => {
        if (
          !task.dueDate ||
          task.status === "completed"
        ) {
          return false;
        }

        const dueDate =
          new Date(task.dueDate);

        return (
          !Number.isNaN(
            dueDate.getTime()
          ) &&
          dueDate < now
        );
      }).length;
    }, [tasks]);

  const totalActionItems =
    meetings.reduce(
      (total, meeting) =>
        total +
        (meeting.actionItems
          ?.length || 0),
      0
    );

  const approvedActionItems =
    meetings.reduce(
      (total, meeting) =>
        total +
        (meeting.actionItems?.filter(
          (item) =>
            item.status ===
            "approved"
        ).length || 0),
      0
    );

  const recentMeetings =
    [...meetings]
      .sort((a, b) => {
        const first = a.createdAt
          ? new Date(
              a.createdAt
            ).getTime()
          : 0;

        const second = b.createdAt
          ? new Date(
              b.createdAt
            ).getTime()
          : 0;

        return second - first;
      })
      .slice(0, 5);

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "Date unavailable";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Date unavailable";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getMeetingStatus =
    (
      meeting: Meeting
    ) =>
      meeting.analysisStatus ||
      "pending";

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            OVERVIEW
          </p>

          <h1>
            Your workspace
          </h1>

          <p>
            Track meetings, verified
            actions, and tasks from
            one place.
          </p>
        </div>

        <Link
          to="/meetings/new"
          className="create-button"
        >
          <Plus size={17} />
          New Meeting
        </Link>
      </section>

      {error && (
        <div className="profile-message profile-error">
          {error}
        </div>
      )}

      <section className="stats-grid">
        <Link
          to="/meetings"
          className="stat-card"
        >
          <div className="stat-card-header">
            <span className="stat-card-label">
              Total Meetings
            </span>

            <div className="stat-icon">
              <CalendarDays
                size={18}
              />
            </div>
          </div>

          <p className="stat-card-value">
            {loading
              ? "—"
              : totalMeetings}
          </p>
        </Link>

        <Link
          to="/tasks"
          className="stat-card"
        >
          <div className="stat-card-header">
            <span className="stat-card-label">
              Total Tasks
            </span>

            <div className="stat-icon">
              <ListChecks
                size={18}
              />
            </div>
          </div>

          <p className="stat-card-value">
            {loading
              ? "—"
              : totalTasks}
          </p>
        </Link>

        <Link
          to="/tasks"
          className="stat-card"
        >
          <div className="stat-card-header">
            <span className="stat-card-label">
              Meeting-linked Tasks
            </span>

            <div className="stat-icon">
              <ListChecks
                size={18}
              />
            </div>
          </div>

          <p className="stat-card-value">
            {loading
              ? "—"
              : linkedActionTasks}
          </p>
        </Link>

        <Link
          to="/meetings"
          className="stat-card"
        >
          <div className="stat-card-header">
            <span className="stat-card-label">
              Pending Verification
            </span>

            <div className="stat-icon">
              <Clock3
                size={18}
              />
            </div>
          </div>

          <p className="stat-card-value">
            {loading
              ? "—"
              : pendingVerification}
          </p>
        </Link>

        <Link
          to="/tasks"
          className="stat-card"
        >
          <div className="stat-card-header">
            <span className="stat-card-label">
              Overdue Tasks
            </span>

            <div className="stat-icon">
              <CheckCircle2
                size={18}
              />
            </div>
          </div>

          <p className="stat-card-value">
            {loading
              ? "—"
              : overdueTasks}
          </p>
        </Link>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>
              Recent Meetings
            </h2>

            <Link
              to="/meetings"
              className="view-all"
            >
              View all
              <ArrowRight
                size={14}
              />
            </Link>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>
                Loading your
                meetings...
              </p>
            </div>
          ) : recentMeetings.length ===
            0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <CalendarDays
                  size={19}
                />
              </div>

              <h3>
                No meetings yet
              </h3>

              <p>
                Start your first
                meeting and Taskie
                will organize the
                conversation for you.
              </p>
            </div>
          ) : (
            <div className="meeting-list">
              {recentMeetings.map(
                (meeting) => {
                  const status =
                    getMeetingStatus(
                      meeting
                    );

                  return (
                    <Link
                      key={
                        meeting._id
                      }
                      to={`/meetings/${meeting._id}`}
                      className="meeting-row"
                    >
                      <div className="meeting-info">
                        <h3 className="meeting-title">
                          {meeting.title ||
                            "Untitled meeting"}
                        </h3>

                        <div className="meeting-meta">
                          <span>
                            {formatDate(
                              meeting.createdAt
                            )}
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {meeting
                              .actionItems
                              ?.length ||
                              0}{" "}
                            action items
                          </span>
                        </div>
                      </div>

                      <div
                        className={`meeting-status ${status}`}
                      >
                        {status}
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>
              Workspace Summary
            </h2>

            <span>
              Current data
            </span>
          </div>

          <div className="workflow-list">
            <div className="workflow-item">
              <div className="workflow-number">
                01
              </div>

              <div>
                <h3>
                  Meetings captured
                </h3>

                <p>
                  {totalMeetings} meeting
                  {totalMeetings !== 1
                    ? "s"
                    : ""}{" "}
                  in your workspace.
                </p>
              </div>
            </div>

            <div className="workflow-item">
              <div className="workflow-number">
                02
              </div>

              <div>
                <h3>
                  Actions extracted
                </h3>

                <p>
                  {totalActionItems} action
                  item
                  {totalActionItems !== 1
                    ? "s"
                    : ""}{" "}
                  identified from
                  meetings.
                </p>
              </div>
            </div>

            <div className="workflow-item">
              <div className="workflow-number">
                03
              </div>

              <div>
                <h3>
                  Actions verified
                </h3>

                <p>
                  {approvedActionItems} approved
                  action
                  {approvedActionItems !==
                  1
                    ? "s"
                    : ""}{" "}
                  ready to become
                  work.
                </p>
              </div>
            </div>

            <div className="workflow-item">
              <div className="workflow-number">
                04
              </div>

              <div>
                <h3>
                  Tasks completed
                </h3>

                <p>
                  {completedTasks} of{" "}
                  {totalTasks} task
                  {totalTasks !== 1
                    ? "s"
                    : ""}{" "}
                  completed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
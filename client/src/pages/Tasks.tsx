import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  Edit3,
  ListChecks,
  Loader2,
  Search,
  Trash2,
  User,
  X,
  ExternalLink,
  Eye,
} from "lucide-react";

import {
  deleteTask,
  getTasks,
  updateTask,
  type Task,
} from "../api/taskApi";

import { Link } from "react-router-dom";

import type { LucideIcon } from "lucide-react";

type StatusFilter =
  | "all"
  | "todo"
  | "in-progress"
  | "completed";

type PriorityFilter =
  | "all"
  | "low"
  | "medium"
  | "high"
  | "critical";

type SortOption =
  | "newest"
  | "oldest"
  | "due-date"
  | "priority"
  | "title";

interface TaskStat {
  icon: LucideIcon;
  label: string;
  count: number;
}

interface EditForm {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: Task["priority"];
  status: Task["status"];
}

function formatDate(
  dateString?: string
) {
  if (!dateString) {
    return "No due date";
  }

  const date = new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "No due date";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getPriorityClass(
  priority: Task["priority"]
) {
  return `task-priority ${priority}`;
}

function getStatusLabel(
  status: Task["status"]
) {
  if (
    status === "completed"
  ) {
    return "Completed";
  }

  if (
    status === "in-progress"
  ) {
    return "In Progress";
  }

  return "To Do";
}

function getPriorityValue(
  priority: Task["priority"]
) {
  const values: Record<
    Task["priority"],
    number
  > = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return values[priority];
}

function isTaskOverdue(
  task: Task
) {
  if (
    !task.dueDate ||
    task.status === "completed"
  ) {
    return false;
  }

  const dueDate =
    new Date(task.dueDate);

  if (
    Number.isNaN(
      dueDate.getTime()
    )
  ) {
    return false;
  }

  return dueDate < new Date();
}

function Tasks() {
  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("all");

  const [sortOption, setSortOption] =
    useState<SortOption>("newest");

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [viewingTask, setViewingTask] =
    useState<Task | null>(null);

  const taskModalRef =
    useRef<HTMLDivElement | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm>({
      title: "",
      description: "",
      assignee: "",
      dueDate: "",
      priority: "medium",
      status: "todo",
    });

  const [savingEdit, setSavingEdit] =
    useState(false);

  useEffect(() => {
    if (!viewingTask && !editingTask) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      taskModalRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [viewingTask, editingTask]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getTasks();

      setTasks(data);
    } catch (err) {
      console.error(
        "Failed to load tasks:",
        err
      );

      setError(
        "Failed to load tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleStatusChange =
    async (
      task: Task,
      status: Task["status"]
    ) => {
      try {
        setUpdatingId(
          task._id
        );
        setError("");

        const updatedTask =
          await updateTask(
            task._id,
            {
              status,
            }
          );

        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (currentTask) =>
                currentTask._id ===
                updatedTask._id
                  ? updatedTask
                  : currentTask
            )
        );
      } catch (err) {
        console.error(
          "Failed to update task:",
          err
        );

        setError(
          "Failed to update task."
        );
      } finally {
        setUpdatingId(null);
      }
    };

  const handleDelete =
    async (
      taskId: string
    ) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to delete this task?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setUpdatingId(taskId);
        setError("");

        await deleteTask(
          taskId
        );

        setTasks(
          (currentTasks) =>
            currentTasks.filter(
              (task) =>
                task._id !== taskId
            )
        );
      } catch (err) {
        console.error(
          "Failed to delete task:",
          err
        );

        setError(
          "Failed to delete task."
        );
      } finally {
        setUpdatingId(null);
      }
    };

  const startEditing =
    (task: Task) => {
      setEditingTask(task);

      setEditForm({
        title: task.title,
        description:
          task.description || "",
        assignee:
          task.assignee || "",
        dueDate: task.dueDate
          ? new Date(
              task.dueDate
            )
              .toISOString()
              .split("T")[0]
          : "",
        priority:
          task.priority,
        status:
          task.status,
      });

      setError("");
    };

  const cancelEditing =
    () => {
      if (savingEdit) {
        return;
      }

      setEditingTask(null);
    };

  const saveEdit =
    async () => {
      if (!editingTask) {
        return;
      }

      if (
        !editForm.title.trim()
      ) {
        setError(
          "Task title is required."
        );

        return;
      }

      try {
        setSavingEdit(true);
        setError("");

        const updatedTask =
          await updateTask(
            editingTask._id,
            {
              title:
                editForm.title.trim(),
              description:
                editForm.description.trim(),
              assignee:
                editForm.assignee.trim(),
              dueDate:
                editForm.dueDate ||
                undefined,
              priority:
                editForm.priority,
              status:
                editForm.status,
            }
          );

        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (task) =>
                task._id ===
                updatedTask._id
                  ? updatedTask
                  : task
            )
        );

        setEditingTask(null);
      } catch (err) {
        console.error(
          "Failed to edit task:",
          err
        );

        setError(
          "Failed to update task."
        );
      } finally {
        setSavingEdit(false);
      }
    };

  const filteredTasks =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const filtered =
        tasks.filter(
          (task) => {
            const matchesSearch =
              !normalizedSearch ||
              [
                task.title,
                task.description,
                task.assignee,
              ]
                .filter(Boolean)
                .some(
                  (value) =>
                    value!
                      .toLowerCase()
                      .includes(
                        normalizedSearch
                      )
                );

            const matchesStatus =
              statusFilter ===
                "all" ||
              task.status ===
                statusFilter;

            const matchesPriority =
              priorityFilter ===
                "all" ||
              task.priority ===
                priorityFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesPriority
            );
          }
        );

      return [
        ...filtered,
      ].sort((a, b) => {
        if (
          sortOption ===
          "title"
        ) {
          return a.title.localeCompare(
            b.title
          );
        }

        if (
          sortOption ===
          "priority"
        ) {
          return (
            getPriorityValue(
              b.priority
            ) -
            getPriorityValue(
              a.priority
            )
          );
        }

        if (
          sortOption ===
          "due-date"
        ) {
          const aDate =
            a.dueDate
              ? new Date(
                  a.dueDate
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          const bDate =
            b.dueDate
              ? new Date(
                  b.dueDate
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          return (
            aDate - bDate
          );
        }

        const aCreated =
          a.createdAt
            ? new Date(
                a.createdAt
              ).getTime()
            : 0;

        const bCreated =
          b.createdAt
            ? new Date(
                b.createdAt
              ).getTime()
            : 0;

        if (
          sortOption ===
          "oldest"
        ) {
          return (
            aCreated -
            bCreated
          );
        }

        return (
          bCreated -
          aCreated
        );
      });
    }, [
      tasks,
      search,
      statusFilter,
      priorityFilter,
      sortOption,
    ]);

  const totalTasks =
    tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "completed"
    ).length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "in-progress"
    ).length;

  const todoTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "todo"
    ).length;

  const overdueTasks =
    tasks.filter(
      isTaskOverdue
    ).length;

  const taskStats: TaskStat[] =
    [
      {
        icon: ListChecks,
        label: "Total Tasks",
        count: totalTasks,
      },
      {
        icon: Circle,
        label: "To Do",
        count: todoTasks,
      },
      {
        icon: Clock3,
        label: "In Progress",
        count:
          inProgressTasks,
      },
      {
        icon: CheckCircle2,
        label: "Completed",
        count:
          completedTasks,
      },
      {
        icon: AlertTriangle,
        label: "Overdue",
        count:
          overdueTasks,
      },
    ];

  const clearFilters =
    () => {
      setSearch("");
      setStatusFilter("all");
      setPriorityFilter("all");
      setSortOption("newest");
    };

  if (loading) {
    return (
      <div className="tasks-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              TASKS
            </p>

            <h1>
              Task Dashboard
            </h1>

            <p>
              Track verified action
              items and follow their
              progress.
            </p>
          </div>
        </div>

        <div className="tasks-loading">
          <Loader2
            className="loading-spinner"
            size={22}
          />

          <span>
            Loading tasks...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            TASKS
          </p>

          <h1>
            Task Dashboard
          </h1>

          <p>
            Track verified action
            items and follow their
            progress.
          </p>
        </div>
      </div>

      {error && (
        <div className="tasks-error">
          {error}
        </div>
      )}

      {/* STATS */}

      <div className="task-stats">
        {taskStats.map(
          ({
            icon: Icon,
            label,
            count,
          }) => (
            <div
              className="task-stat-card"
              key={label}
            >
              <div className="task-stat-icon">
                <Icon size={20} />
              </div>

              <div>
                <span>
                  {label}
                </span>

                <strong>
                  {count}
                </strong>
              </div>
            </div>
          )
        )}
      </div>

      {/* SEARCH / FILTERS */}

      <div className="task-toolbar">
        <div className="task-search">
          <Search
            size={17}
          />

          <input
            type="text"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search tasks..."
          />
        </div>

        <select
          value={
            statusFilter
          }
          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target
                .value as StatusFilter
            )
          }
        >
          <option value="all">
            All Statuses
          </option>

          <option value="todo">
            To Do
          </option>

          <option value="in-progress">
            In Progress
          </option>

          <option value="completed">
            Completed
          </option>
        </select>

        <select
          value={
            priorityFilter
          }
          onChange={(
            event
          ) =>
            setPriorityFilter(
              event.target
                .value as PriorityFilter
            )
          }
        >
          <option value="all">
            All Priorities
          </option>

          <option value="critical">
            Critical
          </option>

          <option value="high">
            High
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="low">
            Low
          </option>
        </select>

        <select
          value={
            sortOption
          }
          onChange={(
            event
          ) =>
            setSortOption(
              event.target
                .value as SortOption
            )
          }
        >
          <option value="newest">
            Newest
          </option>

          <option value="oldest">
            Oldest
          </option>

          <option value="due-date">
            Due Date
          </option>

          <option value="priority">
            Priority
          </option>

          <option value="title">
            Title A-Z
          </option>
        </select>

        {(search ||
          statusFilter !==
            "all" ||
          priorityFilter !==
            "all" ||
          sortOption !==
            "newest") && (
          <button
            type="button"
            className="task-clear-filters"
            onClick={
              clearFilters
            }
          >
            <X size={15} />
            Clear
          </button>
        )}
      </div>

      {/* TASK LIST */}

      {tasks.length === 0 ? (
        <div className="tasks-empty">
          <div className="empty-state-icon">
            <ListChecks
              size={22}
            />
          </div>

          <h2>
            No tasks yet
          </h2>

          <p>
            Approved meeting action
            items will appear here
            when converted into
            tasks.
          </p>
        </div>
      ) : filteredTasks.length ===
        0 ? (
        <div className="tasks-empty">
          <div className="empty-state-icon">
            <Search size={22} />
          </div>

          <h2>
            No matching tasks
          </h2>

          <p>
            Try changing your
            search or filters.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={
              clearFilters
            }
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(
            (task) => {
              const overdue =
                isTaskOverdue(
                  task
                );

              const updating =
                updatingId ===
                task._id;

              return (
                <div
                  className={`task-card ${
                    overdue
                      ? "task-card-overdue"
                      : ""
                  } ${
                    task.status === "completed"
                      ? "task-card-completed"
                      : ""
                  }`}
                  key={task._id}
                >
                  <div className="task-card-main">
                    <div className="task-card-title-row">
                      <h2>
                        {task.title}
                      </h2>

                      <span
                        className={getPriorityClass(
                          task.priority
                        )}
                      >
                        {
                          task.priority
                        }
                      </span>

                      {task.status === "completed" && (
                        <span className="task-completed-badge">
                          <CheckCircle2 size={14} />
                          Completed
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="task-description">
                        {
                          task.description
                        }
                      </p>
                    )}

                    <div className="task-meta">
                      <span>
                        <User
                          size={14}
                        />

                        {task.assignee ||
                          "Unassigned"}
                      </span>

                      <span>
                        <Clock3
                          size={14}
                        />

                        {formatDate(
                          task.dueDate
                        )}
                      </span>

                      <span>
                        Status:{" "}
                        {getStatusLabel(
                          task.status
                        )}
                      </span>

                      {overdue && (
                        <span className="task-overdue-label">
                          <AlertTriangle
                            size={14}
                          />
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* SOURCE MEETING */}

                    {task.meetingId && (
                      <div className="task-source">
                        <span>
                          Source Meeting
                        </span>

                        <Link
                          to={`/meetings/${task.meetingId}`}
                          className="task-source-link"
                        >
                          <ExternalLink
                            size={14}
                          />

                          View Meeting
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="task-card-actions">
                    <select
                      className={`task-status-select task-status-${task.status}`}
                      value={
                        task.status
                      }
                      disabled={
                        updating
                      }
                      onChange={(
                        event
                      ) =>
                        handleStatusChange(
                          task,
                          event
                            .target
                            .value as Task["status"]
                        )
                      }
                    >
                      <option value="todo">
                        To Do
                      </option>

                      <option value="in-progress">
                        In Progress
                      </option>

                      <option value="completed">
                        Completed
                      </option>
                    </select>

                    <button
                      type="button"
                      className="task-edit-button"
                      onClick={() =>
                        setViewingTask(task)
                      }
                      disabled={
                        updating
                      }
                      title="View task"
                    >
                      <Eye
                        size={17}
                      />
                    </button>

                    <button
                      type="button"
                      className="task-edit-button"
                      onClick={() =>
                        startEditing(
                          task
                        )
                      }
                      disabled={
                        updating
                      }
                      title="Edit task"
                    >
                      <Edit3
                        size={17}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          task._id
                        )
                      }
                      disabled={
                        updating
                      }
                      className="task-delete-button"
                      title="Delete task"
                    >
                      {updating ? (
                        <Loader2
                          size={17}
                          className="loading-spinner"
                        />
                      ) : (
                        <Trash2
                          size={17}
                        />
                      )}
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* TASK DETAILS */}

      {viewingTask && (
        <div
          className="task-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewingTask(null);
            }
          }}
        >
          <div
            className="task-modal"
            ref={taskModalRef}
            tabIndex={-1}
          >
            <div className="task-modal-header">
              <div>
                <p className="eyebrow">
                  TASK DETAILS
                </p>

                <h2>
                  {viewingTask.title}
                </h2>
              </div>

              <button
                type="button"
                className="task-modal-close"
                onClick={() =>
                  setViewingTask(null)
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="task-edit-form">
              <div className="task-meta">
                <span>
                  Status: {getStatusLabel(
                    viewingTask.status
                  )}
                </span>

                <span>
                  Priority: {viewingTask.priority}
                </span>

                <span>
                  <Clock3 size={14} />
                  {formatDate(
                    viewingTask.dueDate
                  )}
                </span>
              </div>

              <div className="task-edit-field">
                <label>Description</label>
                <p>
                  {viewingTask.description?.trim() ||
                    "No description added."}
                </p>
              </div>

              <div className="task-edit-field">
                <label>Assignee</label>
                <p>
                  {viewingTask.assignee?.trim() ||
                    "Unassigned"}
                </p>
              </div>

              {viewingTask.meetingId && (
                <div className="task-source">
                  <span>
                    Source Meeting
                  </span>

                  <Link
                    to={`/meetings/${viewingTask.meetingId}`}
                    className="task-source-link"
                    onClick={() =>
                      setViewingTask(null)
                    }
                  >
                    <ExternalLink
                      size={14}
                    />
                    View Meeting
                  </Link>
                </div>
              )}

              {viewingTask.actionItemId && (
                <div className="task-source">
                  <span>
                    Source Action Item
                  </span>

                  <span>
                    Verified meeting action item
                  </span>
                </div>
              )}
            </div>

            <div className="task-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setViewingTask(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="create-button"
                onClick={() => {
                  const task = viewingTask;
                  setViewingTask(null);
                  startEditing(task);
                }}
              >
                <Edit3 size={16} />
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK */}

      {editingTask && (
        <div
          className="task-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cancelEditing();
            }
          }}
        >
          <div
            className="task-modal"
            ref={taskModalRef}
            tabIndex={-1}
          >
            <div className="task-modal-header">
              <div>
                <p className="eyebrow">
                  TASK
                </p>

                <h2>
                  Edit Task
                </h2>
              </div>

              <button
                type="button"
                className="task-modal-close"
                onClick={
                  cancelEditing
                }
                disabled={
                  savingEdit
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="task-edit-form">
              <div className="task-edit-field">
                <label htmlFor="task-title">
                  Title
                </label>

                <input
                  id="task-title"
                  type="text"
                  value={
                    editForm.title
                  }
                  onChange={(
                    event
                  ) =>
                    setEditForm(
                      (
                        current
                      ) => ({
                        ...current,
                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="task-edit-field">
                <label htmlFor="task-description">
                  Description
                </label>

                <textarea
                  id="task-description"
                  value={
                    editForm.description
                  }
                  rows={4}
                  onChange={(
                    event
                  ) =>
                    setEditForm(
                      (
                        current
                      ) => ({
                        ...current,
                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="task-edit-grid">
                <div className="task-edit-field">
                  <label htmlFor="task-assignee">
                    Assignee
                  </label>

                  <input
                    id="task-assignee"
                    type="text"
                    value={
                      editForm.assignee
                    }
                    onChange={(
                      event
                    ) =>
                      setEditForm(
                        (
                          current
                        ) => ({
                          ...current,
                          assignee:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </div>

                <div className="task-edit-field">
                  <label htmlFor="task-due-date">
                    Due Date
                  </label>

                  <input
                    id="task-due-date"
                    type="date"
                    value={
                      editForm.dueDate
                    }
                    onChange={(
                      event
                    ) =>
                      setEditForm(
                        (
                          current
                        ) => ({
                          ...current,
                          dueDate:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </div>
              </div>

              <div className="task-edit-grid">
                <div className="task-edit-field">
                  <label htmlFor="task-priority">
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    value={
                      editForm.priority
                    }
                    onChange={(
                      event
                    ) =>
                      setEditForm(
                        (
                          current
                        ) => ({
                          ...current,
                          priority:
                            event
                              .target
                              .value as Task["priority"],
                        })
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

                <div className="task-edit-field">
                  <label htmlFor="task-status">
                    Status
                  </label>

                  <select
                    id="task-status"
                    value={
                      editForm.status
                    }
                    onChange={(
                      event
                    ) =>
                      setEditForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            event
                              .target
                              .value as Task["status"],
                        })
                      )
                    }
                  >
                    <option value="todo">
                      To Do
                    </option>

                    <option value="in-progress">
                      In Progress
                    </option>

                    <option value="completed">
                      Completed
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="task-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={
                  cancelEditing
                }
                disabled={
                  savingEdit
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="create-button"
                onClick={
                  saveEdit
                }
                disabled={
                  savingEdit
                }
              >
                {savingEdit ? (
                  <>
                    <Loader2
                      size={16}
                      className="loading-spinner"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      size={16}
                    />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
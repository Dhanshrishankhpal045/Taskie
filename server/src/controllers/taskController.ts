import {
  Request,
  Response,
} from "express";

import mongoose from "mongoose";

import Task from "../models/Task.js";
import Meeting from "../models/Meeting.js";

const allowedPriorities = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

const allowedStatuses = [
  "todo",
  "in-progress",
  "completed",
] as const;

const isValidObjectId = (
  value: unknown
): value is string => {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
};

const isValidPriority = (
  value: unknown
): boolean => {
  return (
    typeof value === "string" &&
    allowedPriorities.includes(
      value as (typeof allowedPriorities)[number]
    )
  );
};

const isValidStatus = (
  value: unknown
): boolean => {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(
      value as (typeof allowedStatuses)[number]
    )
  );
};

const isValidDateValue = (
  value: unknown
): boolean => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return true;
  }

  const date = new Date(
    String(value)
  );

  return !Number.isNaN(
    date.getTime()
  );
};

/* =========================================================
   CREATE TASK
========================================================= */

export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message:
          "Authentication required.",
      });
      return;
    }

    const {
      title,
      description,
      assignee,
      dueDate,
      priority,
      status,
      meetingId,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      res.status(400).json({
        message:
          "Task title is required.",
      });
      return;
    }

    if (
      title.trim().length > 300
    ) {
      res.status(400).json({
        message:
          "Task title cannot exceed 300 characters.",
      });
      return;
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      res.status(400).json({
        message:
          "Task description must be text.",
      });
      return;
    }

    if (
      assignee !== undefined &&
      typeof assignee !== "string"
    ) {
      res.status(400).json({
        message:
          "Task assignee must be text.",
      });
      return;
    }

    if (
      !isValidDateValue(dueDate)
    ) {
      res.status(400).json({
        message:
          "Invalid due date.",
      });
      return;
    }

    if (
      priority !== undefined &&
      !isValidPriority(priority)
    ) {
      res.status(400).json({
        message:
          "Invalid task priority.",
      });
      return;
    }

    if (
      status !== undefined &&
      !isValidStatus(status)
    ) {
      res.status(400).json({
        message:
          "Invalid task status.",
      });
      return;
    }

    if (
      meetingId !== undefined &&
      meetingId !== null &&
      meetingId !== ""
    ) {
      if (
        !isValidObjectId(meetingId)
      ) {
        res.status(400).json({
          message:
            "Invalid meeting ID.",
        });
        return;
      }

      const meeting =
        await Meeting.findOne({
          _id: meetingId,
          userId,
        });

      if (!meeting) {
        res.status(404).json({
          message:
            "Meeting not found.",
        });
        return;
      }
    }

    const task =
      await Task.create({
        userId,
        title: title.trim(),
        description:
          typeof description ===
          "string"
            ? description.trim()
            : "",
        assignee:
          typeof assignee ===
          "string"
            ? assignee.trim()
            : "",
        dueDate:
          dueDate || undefined,
        priority:
          priority || "medium",
        status:
          status || "todo",
        meetingId:
          meetingId || undefined,
      });

    res.status(201).json({
      message:
        "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create task.",
    });
  }
};

/* =========================================================
   GET ALL TASKS
========================================================= */

export const getTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message:
          "Authentication required.",
      });
      return;
    }

    const tasks =
      await Task.find({
        userId,
      }).sort({
        createdAt: -1,
      });

    res.status(200).json({
      message:
        "Tasks fetched successfully.",
      tasks,
    });
  } catch (error) {
    console.error(
      "Get tasks error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch tasks.",
    });
  }
};

/* =========================================================
   GET TASK BY ID
========================================================= */

export const getTaskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message:
          "Authentication required.",
      });
      return;
    }

    const id =
      String(req.params.id);

    if (
      !isValidObjectId(id)
    ) {
      res.status(400).json({
        message:
          "Invalid task ID.",
      });
      return;
    }

    const task =
      await Task.findOne({
        _id: id,
        userId,
      });

    if (!task) {
      res.status(404).json({
        message:
          "Task not found.",
      });
      return;
    }

    res.status(200).json({
      message:
        "Task fetched successfully.",
      task,
    });
  } catch (error) {
    console.error(
      "Get task by ID error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch task.",
    });
  }
};

/* =========================================================
   UPDATE TASK
========================================================= */

export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message:
          "Authentication required.",
      });
      return;
    }

    const id =
      String(req.params.id);

    if (
      !isValidObjectId(id)
    ) {
      res.status(400).json({
        message:
          "Invalid task ID.",
      });
      return;
    }

    const {
      title,
      description,
      assignee,
      dueDate,
      priority,
      status,
    } = req.body;

    const updates: Record<
      string,
      unknown
    > = {};

    if (title !== undefined) {
      if (
        typeof title !==
          "string" ||
        !title.trim()
      ) {
        res.status(400).json({
          message:
            "Task title cannot be empty.",
        });
        return;
      }

      if (
        title.trim().length > 300
      ) {
        res.status(400).json({
          message:
            "Task title cannot exceed 300 characters.",
        });
        return;
      }

      updates.title =
        title.trim();
    }

    if (
      description !== undefined
    ) {
      if (
        typeof description !==
        "string"
      ) {
        res.status(400).json({
          message:
            "Task description must be text.",
        });
        return;
      }

      updates.description =
        description.trim();
    }

    if (
      assignee !== undefined
    ) {
      if (
        typeof assignee !==
        "string"
      ) {
        res.status(400).json({
          message:
            "Task assignee must be text.",
        });
        return;
      }

      updates.assignee =
        assignee.trim();
    }

    if (
      dueDate !== undefined
    ) {
      if (
        !isValidDateValue(
          dueDate
        )
      ) {
        res.status(400).json({
          message:
            "Invalid due date.",
        });
        return;
      }

      updates.dueDate =
        dueDate || undefined;
    }

    if (
      priority !== undefined
    ) {
      if (
        !isValidPriority(
          priority
        )
      ) {
        res.status(400).json({
          message:
            "Invalid task priority.",
        });
        return;
      }

      updates.priority =
        priority;
    }

    if (
      status !== undefined
    ) {
      if (
        !isValidStatus(status)
      ) {
        res.status(400).json({
          message:
            "Invalid task status.",
        });
        return;
      }

      updates.status =
        status;
    }

    if (
      Object.keys(updates)
        .length === 0
    ) {
      res.status(400).json({
        message:
          "No valid task changes were provided.",
      });
      return;
    }

    const task =
      await Task.findOneAndUpdate(
        {
          _id: id,
          userId,
        },
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!task) {
      res.status(404).json({
        message:
          "Task not found.",
      });
      return;
    }

    res.status(200).json({
      message:
        "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error(
      "Update task error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update task.",
    });
  }
};

/* =========================================================
   DELETE TASK
========================================================= */

export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message:
          "Authentication required.",
      });
      return;
    }

    const id =
      String(req.params.id);

    if (
      !isValidObjectId(id)
    ) {
      res.status(400).json({
        message:
          "Invalid task ID.",
      });
      return;
    }

    const task =
      await Task.findOneAndDelete({
        _id: id,
        userId,
      });

    if (!task) {
      res.status(404).json({
        message:
          "Task not found.",
      });
      return;
    }

    res.status(200).json({
      message:
        "Task deleted successfully.",
      task,
    });
  } catch (error) {
    console.error(
      "Delete task error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete task.",
    });
  }
};

/* =========================================================
   CREATE TASK FROM APPROVED ACTION ITEM
========================================================= */

export const createTaskFromActionItem =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId =
        req.userId;

      if (!userId) {
        res.status(401).json({
          message:
            "Authentication required.",
        });
        return;
      }

      const {
        meetingId,
        actionItemIndex,
        actionItemId,
      } = req.body;

      if (
        typeof meetingId !==
          "string" ||
        !meetingId.trim()
      ) {
        res.status(400).json({
          message:
            "Meeting ID is required.",
        });
        return;
      }

      if (
        !isValidObjectId(
          meetingId
        )
      ) {
        res.status(400).json({
          message:
            "Invalid meeting ID.",
        });
        return;
      }

      const hasActionItemId =
        typeof actionItemId ===
          "string" &&
        actionItemId.trim()
          .length > 0;

      const hasActionItemIndex =
        actionItemIndex !==
          undefined &&
        Number.isInteger(
          actionItemIndex
        );

      if (
        !hasActionItemId &&
        !hasActionItemIndex
      ) {
        res.status(400).json({
          message:
            "Action item ID or index is required.",
        });
        return;
      }

      if (
        hasActionItemIndex &&
        (actionItemIndex < 0 ||
          actionItemIndex > 10000)
      ) {
        res.status(400).json({
          message:
            "Action item index is invalid.",
        });
        return;
      }

      const meeting =
        await Meeting.findOne({
          _id: meetingId,
          userId,
        });

      if (!meeting) {
        res.status(404).json({
          message:
            "Meeting not found.",
        });
        return;
      }

      if (
        !meeting.actionItems ||
        meeting.actionItems.length ===
          0
      ) {
        res.status(404).json({
          message:
            "No action items found in this meeting.",
        });
        return;
      }

      /*
       * Prefer the stable actionItemId.
       * Fall back to the old index system
       * for backward compatibility.
       */
      let resolvedIndex = -1;

      if (hasActionItemId) {
        resolvedIndex =
          meeting.actionItems.findIndex(
            (item) =>
              item.actionItemId ===
              actionItemId
          );
      }

      if (
        resolvedIndex === -1 &&
        hasActionItemIndex
      ) {
        resolvedIndex =
          actionItemIndex;
      }

      if (
        resolvedIndex < 0 ||
        resolvedIndex >=
          meeting.actionItems.length
      ) {
        res.status(404).json({
          message:
            "Action item not found.",
        });
        return;
      }

      const actionItem =
        meeting.actionItems[
          resolvedIndex
        ];

      if (!actionItem) {
        res.status(404).json({
          message:
            "Action item not found.",
        });
        return;
      }

      /*
       * Older meetings may not have a
       * stable actionItemId.
       */
      if (
        !actionItem.actionItemId
      ) {
        actionItem.actionItemId =
          new mongoose.Types.ObjectId().toString();

        await meeting.save();
      }

      if (
        actionItem.status !==
        "approved"
      ) {
        res.status(400).json({
          message:
            "Only approved action items can be converted into tasks.",
          status:
            actionItem.status,
        });
        return;
      }

      /*
       * First check the stable relationship.
       */
      const existingByActionId =
        await Task.findOne({
          userId,
          meetingId:
            meeting._id,
          actionItemId:
            actionItem.actionItemId,
        });

      if (existingByActionId) {
        res.status(409).json({
          message:
            "A task has already been created from this action item.",
          task:
            existingByActionId,
        });
        return;
      }

      /*
       * Backward compatibility:
       * check older tasks that may have
       * been created before actionItemId
       * was introduced.
       */
      const existingTasks =
        await Task.find({
          userId,
          meetingId:
            meeting._id,
        });

      const legacyDuplicate =
        existingTasks.find(
          (task) => {
            if (
              task.actionItemId ===
              actionItem.actionItemId
            ) {
              return true;
            }

            if (
              task.actionItemIndex !==
                undefined &&
              task.actionItemIndex ===
                resolvedIndex
            ) {
              return true;
            }

            return (
              !task.actionItemId &&
              task.title.trim() ===
                actionItem.text.trim()
            );
          }
        );

      if (legacyDuplicate) {
        /*
         * Upgrade an older task with
         * the stable relationship.
         */
        if (
          !legacyDuplicate.actionItemId
        ) {
          legacyDuplicate.actionItemId =
            actionItem.actionItemId;

          legacyDuplicate.actionItemIndex =
            resolvedIndex;

          await legacyDuplicate.save();
        }

        res.status(409).json({
          message:
            "A task has already been created from this action item.",
          task:
            legacyDuplicate,
        });
        return;
      }

      const task =
        await Task.create({
          userId,
          title:
            actionItem.text.trim(),
          description: "",
          assignee:
            actionItem.assignee ||
            "",
          dueDate:
            actionItem.dueDate,
          priority:
            actionItem.priority ||
            "medium",
          status: "todo",
          meetingId:
            meeting._id,
          actionItemId:
            actionItem.actionItemId,
          actionItemIndex:
            resolvedIndex,
        });

      res.status(201).json({
        message:
          "Approved action item converted to task successfully.",
        task,
      });
    } catch (error) {
      console.error(
        "Create task from action item error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to convert action item to task.",
      });
    }
  };
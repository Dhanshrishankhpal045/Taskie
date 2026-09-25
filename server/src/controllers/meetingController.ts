import {
  Request,
  Response,
} from "express";

import mongoose from "mongoose";

import Meeting from "../models/Meeting.js";

/* -------------------------------- */
/* CREATE MEETING */
/* -------------------------------- */

export const createMeeting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const {
      title,
      transcript,
      summary,
      aiNotes,
      personalNotes,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      res.status(400).json({
        message: "Meeting title is required",
      });
      return;
    }

    const meeting =
      await Meeting.create({
        userId,
        title: title.trim(),
        transcript:
          typeof transcript === "string"
            ? transcript
            : "",
        summary:
          typeof summary === "string"
            ? summary
            : "",
        aiNotes:
          typeof aiNotes === "string"
            ? aiNotes
            : "",
        personalNotes:
          typeof personalNotes === "string"
            ? personalNotes
            : "",
      });

    res.status(201).json({
      message:
        "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Create meeting error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create meeting",
    });
  }
};

/* -------------------------------- */
/* GET ALL MEETINGS */
/* -------------------------------- */

export const getMeetings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    const meetings =
      await Meeting.find({
        userId,
      }).sort({
        createdAt: -1,
      });

    res.status(200).json({
      message:
        "Meetings fetched successfully",
      meetings,
    });
  } catch (error) {
    console.error(
      "Get meetings error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch meetings",
    });
  }
};

/* -------------------------------- */
/* GET MEETING BY ID */
/* -------------------------------- */

export const getMeetingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid meeting ID.",
      });
      return;
    }

    const meeting =
      await Meeting.findOne({
        _id: id,
        userId,
      });

    if (!meeting) {
      res.status(404).json({
        message: "Meeting not found",
      });
      return;
    }

    res.status(200).json({
      message:
        "Meeting fetched successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Get meeting by ID error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch meeting",
    });
  }
};

/* -------------------------------- */
/* UPDATE MEETING */
/* -------------------------------- */

export const updateMeeting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid meeting ID.",
      });
      return;
    }

    const {
      title,
      transcript,
      summary,
      aiNotes,
      personalNotes,
    } = req.body;

    const updateData: Record<
      string,
      unknown
    > = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        res.status(400).json({
          message:
            "Meeting title cannot be empty.",
        });
        return;
      }

      updateData.title =
        title.trim();
    }

    if (transcript !== undefined) {
      updateData.transcript =
        typeof transcript === "string"
          ? transcript
          : "";
    }

    if (summary !== undefined) {
      updateData.summary =
        typeof summary === "string"
          ? summary
          : "";
    }

    if (aiNotes !== undefined) {
      updateData.aiNotes =
        typeof aiNotes === "string"
          ? aiNotes
          : "";
    }

    if (personalNotes !== undefined) {
      updateData.personalNotes =
        typeof personalNotes === "string"
          ? personalNotes
          : "";
    }

    const meeting =
      await Meeting.findOneAndUpdate(
        {
          _id: id,
          userId,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!meeting) {
      res.status(404).json({
        message: "Meeting not found",
      });
      return;
    }

    res.status(200).json({
      message:
        "Meeting updated successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Update meeting error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update meeting",
    });
  }
};

/* -------------------------------- */
/* DELETE MEETING */
/* -------------------------------- */

export const deleteMeeting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid meeting ID.",
      });
      return;
    }

    const meeting =
      await Meeting.findOneAndDelete({
        _id: id,
        userId,
      });

    if (!meeting) {
      res.status(404).json({
        message: "Meeting not found",
      });
      return;
    }

    res.status(200).json({
      message:
        "Meeting deleted successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Delete meeting error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete meeting",
    });
  }
};

/* -------------------------------- */
/* APPROVE MEETING ANALYSIS */
/* -------------------------------- */

export const approveMeetingAnalysis =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.userId;
      const id = String(req.params.id);

      if (!userId) {
        res.status(401).json({
          message:
            "Authentication required.",
        });
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          message:
            "Invalid meeting ID.",
        });
        return;
      }

      const meeting =
        await Meeting.findOneAndUpdate(
          {
            _id: id,
            userId,
          },
          {
            analysisStatus:
              "approved",
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!meeting) {
        res.status(404).json({
          message:
            "Meeting not found",
        });
        return;
      }

      res.status(200).json({
        message:
          "Meeting analysis approved successfully",
        meeting,
      });
    } catch (error) {
      console.error(
        "Approve analysis error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to approve meeting analysis",
      });
    }
  };

/* -------------------------------- */
/* REJECT MEETING ANALYSIS */
/* -------------------------------- */

export const rejectMeetingAnalysis =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.userId;
      const id = String(req.params.id);

      if (!userId) {
        res.status(401).json({
          message:
            "Authentication required.",
        });
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          message:
            "Invalid meeting ID.",
        });
        return;
      }

      const meeting =
        await Meeting.findOneAndUpdate(
          {
            _id: id,
            userId,
          },
          {
            analysisStatus:
              "rejected",
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!meeting) {
        res.status(404).json({
          message:
            "Meeting not found",
        });
        return;
      }

      res.status(200).json({
        message:
          "Meeting analysis rejected successfully",
        meeting,
      });
    } catch (error) {
      console.error(
        "Reject analysis error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to reject meeting analysis",
      });
    }
  };

/* -------------------------------- */
/* APPROVE ACTION ITEM */
/* -------------------------------- */

export const approveActionItem = async (
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
      meetingId,
      actionItemIndex,
    } = req.body;

    if (!meetingId) {
      res.status(400).json({
        message:
          "Meeting ID is required",
      });
      return;
    }

    if (
      actionItemIndex === undefined ||
      !Number.isInteger(actionItemIndex)
    ) {
      res.status(400).json({
        message:
          "Action item index is required",
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
        message: "Meeting not found",
      });
      return;
    }

    if (
      !meeting.actionItems ||
      !meeting.actionItems[
        actionItemIndex
      ]
    ) {
      res.status(404).json({
        message:
          "Action item not found",
      });
      return;
    }

    const actionItem =
      meeting.actionItems[
        actionItemIndex
      ];

    if (!actionItem.actionItemId) {
      actionItem.actionItemId =
        new mongoose.Types.ObjectId().toString();
    }

    actionItem.status =
      "approved";

    await meeting.save();

    res.status(200).json({
      message:
        "Action item approved successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Approve action item error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to approve action item",
    });
  }
};

/* -------------------------------- */
/* REJECT ACTION ITEM */
/* -------------------------------- */

export const rejectActionItem = async (
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
      meetingId,
      actionItemIndex,
    } = req.body;

    if (!meetingId) {
      res.status(400).json({
        message:
          "Meeting ID is required",
      });
      return;
    }

    if (
      actionItemIndex === undefined ||
      !Number.isInteger(actionItemIndex)
    ) {
      res.status(400).json({
        message:
          "Action item index is required",
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
        message: "Meeting not found",
      });
      return;
    }

    if (
      !meeting.actionItems ||
      !meeting.actionItems[
        actionItemIndex
      ]
    ) {
      res.status(404).json({
        message:
          "Action item not found",
      });
      return;
    }

    const actionItem =
      meeting.actionItems[
        actionItemIndex
      ];

    if (!actionItem.actionItemId) {
      actionItem.actionItemId =
        new mongoose.Types.ObjectId().toString();
    }

    actionItem.status =
      "rejected";

    await meeting.save();

    res.status(200).json({
      message:
        "Action item rejected successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Reject action item error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to reject action item",
    });
  }
};

/* -------------------------------- */
/* EDIT ACTION ITEM */
/* -------------------------------- */

export const editActionItem = async (
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
      meetingId,
      actionItemIndex,
      text,
      assignee,
      dueDate,
      priority,
    } = req.body;

    if (!meetingId) {
      res.status(400).json({
        message:
          "Meeting ID is required",
      });
      return;
    }

    if (
      actionItemIndex === undefined ||
      !Number.isInteger(actionItemIndex)
    ) {
      res.status(400).json({
        message:
          "Action item index is required",
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
        message: "Meeting not found",
      });
      return;
    }

    if (!meeting.actionItems) {
      res.status(404).json({
        message:
          "No action items found",
      });
      return;
    }

    const actionItem =
      meeting.actionItems[
        actionItemIndex
      ];

    if (!actionItem) {
      res.status(404).json({
        message:
          "Action item not found",
      });
      return;
    }

    if (!actionItem.actionItemId) {
      actionItem.actionItemId =
        new mongoose.Types.ObjectId().toString();
    }

    if (text !== undefined) {
      if (
        typeof text !== "string" ||
        !text.trim()
      ) {
        res.status(400).json({
          message:
            "Action item text cannot be empty",
        });
        return;
      }

      actionItem.text =
        text.trim();
    }

    if (assignee !== undefined) {
      actionItem.assignee =
        typeof assignee === "string"
          ? assignee.trim()
          : "";
    }

    if (dueDate !== undefined) {
      actionItem.dueDate =
        dueDate || undefined;
    }

    if (priority !== undefined) {
      const allowedPriorities = [
        "low",
        "medium",
        "high",
        "critical",
      ];

      if (
        !allowedPriorities.includes(
          priority
        )
      ) {
        res.status(400).json({
          message:
            "Invalid action item priority",
        });
        return;
      }

      actionItem.priority =
        priority;
    }

    await meeting.save();

    res.status(200).json({
      message:
        "Action item updated successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Edit action item error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update action item",
    });
  }
};

/* -------------------------------- */
/* ADD ACTION ITEM */
/* -------------------------------- */

export const addActionItem = async (
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
      meetingId,
      text,
      assignee,
      dueDate,
      priority,
    } = req.body;

    if (!meetingId) {
      res.status(400).json({
        message:
          "Meeting ID is required",
      });
      return;
    }

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      res.status(400).json({
        message:
          "Action item text is required",
      });
      return;
    }

    const allowedPriorities = [
      "low",
      "medium",
      "high",
      "critical",
    ];

    if (
      priority !== undefined &&
      !allowedPriorities.includes(
        priority
      )
    ) {
      res.status(400).json({
        message:
          "Invalid action item priority",
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
        message: "Meeting not found",
      });
      return;
    }

    if (!meeting.actionItems) {
      meeting.actionItems = [];
    }

    meeting.actionItems.push({
      actionItemId:
        new mongoose.Types.ObjectId().toString(),
      text: text.trim(),
      assignee:
        typeof assignee === "string"
          ? assignee.trim()
          : "",
      dueDate:
        dueDate || undefined,
      priority:
        priority || "medium",
      status: "pending",
    });

    await meeting.save();

    res.status(201).json({
      message:
        "Action item added successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Add action item error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to add action item",
    });
  }
};

/* -------------------------------- */
/* DELETE ACTION ITEM */
/* -------------------------------- */

export const deleteActionItem = async (
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
      meetingId,
      actionItemIndex,
    } = req.body;

    if (!meetingId) {
      res.status(400).json({
        message:
          "Meeting ID is required",
      });
      return;
    }

    if (
      actionItemIndex === undefined ||
      !Number.isInteger(actionItemIndex)
    ) {
      res.status(400).json({
        message:
          "Action item index is required",
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
        message: "Meeting not found",
      });
      return;
    }

    if (
      !meeting.actionItems ||
      !meeting.actionItems[
        actionItemIndex
      ]
    ) {
      res.status(404).json({
        message:
          "Action item not found",
      });
      return;
    }

    meeting.actionItems.splice(
      actionItemIndex,
      1
    );

    await meeting.save();

    res.status(200).json({
      message:
        "Action item deleted successfully",
      meeting,
    });
  } catch (error) {
    console.error(
      "Delete action item error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete action item",
    });
  }
};

/* -------------------------------- */
/* UPDATE PERSONAL NOTES */
/* -------------------------------- */

export const updatePersonalNotes =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.userId;
      const id = String(req.params.id);

      if (!userId) {
        res.status(401).json({
          message:
            "Authentication required.",
        });
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        res.status(400).json({
          message:
            "Invalid meeting ID.",
        });
        return;
      }

      const {
        personalNotes,
      } = req.body;

      if (
        personalNotes !== undefined &&
        typeof personalNotes !== "string"
      ) {
        res.status(400).json({
          message:
            "Personal notes must be a string.",
        });
        return;
      }

      const meeting =
        await Meeting.findOneAndUpdate(
          {
            _id: id,
            userId,
          },
          {
            personalNotes:
              typeof personalNotes ===
              "string"
                ? personalNotes.trim()
                : "",
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!meeting) {
        res.status(404).json({
          message:
            "Meeting not found.",
        });
        return;
      }

      res.status(200).json({
        message:
          "Personal notes updated successfully.",
        meeting,
      });
    } catch (error) {
      console.error(
        "Update personal notes error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update personal notes.",
      });
    }
  };
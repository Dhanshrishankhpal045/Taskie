import express from "express";

import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  approveMeetingAnalysis,
  rejectMeetingAnalysis,
  approveActionItem,
  rejectActionItem,
  editActionItem,
  addActionItem,
  deleteActionItem,
  updatePersonalNotes,
} from "../controllers/meetingController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

/*
 * All meeting routes require
 * an authenticated user.
 */

router.use(authenticate);

/* -------------------------------- */
/* MEETING CRUD */
/* -------------------------------- */

router.post(
  "/",
  createMeeting
);

router.get(
  "/",
  getMeetings
);

/* -------------------------------- */
/* ACTION ITEM ROUTES */
/* -------------------------------- */

router.patch(
  "/action-item/approve",
  approveActionItem
);

router.patch(
  "/action-item/reject",
  rejectActionItem
);

router.patch(
  "/action-item/edit",
  editActionItem
);

router.post(
  "/action-item/add",
  addActionItem
);

router.delete(
  "/action-item/delete",
  deleteActionItem
);

/* -------------------------------- */
/* PERSONAL NOTES */
/* -------------------------------- */

router.patch(
  "/:id/personal-notes",
  updatePersonalNotes
);

/* -------------------------------- */
/* MEETING BY ID */
/* -------------------------------- */

router.get(
  "/:id",
  getMeetingById
);

router.put(
  "/:id",
  updateMeeting
);

router.delete(
  "/:id",
  deleteMeeting
);

/* -------------------------------- */
/* MEETING ANALYSIS VERIFICATION */
/* -------------------------------- */

router.patch(
  "/:id/approve",
  approveMeetingAnalysis
);

router.patch(
  "/:id/reject",
  rejectMeetingAnalysis
);

export default router;
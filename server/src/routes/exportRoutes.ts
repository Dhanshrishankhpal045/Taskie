import express from "express";

import {
  exportMeetingJSON,
  exportMeetingPDF,
} from "../controllers/exportController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * All export routes require
 * an authenticated user.
 */

router.use(authenticate);

/* =========================================================
   MEETING JSON EXPORT
   GET /api/exports/meetings/:id/json
   ========================================================= */

router.get(
  "/meetings/:id/json",
  exportMeetingJSON
);

/* =========================================================
   MEETING PDF EXPORT
   GET /api/exports/meetings/:id/pdf
   ========================================================= */

router.get(
  "/meetings/:id/pdf",
  exportMeetingPDF
);

export default router;
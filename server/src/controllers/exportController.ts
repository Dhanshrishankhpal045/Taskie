import { Request, Response } from "express";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";

import Meeting from "../models/Meeting.js";

/* =========================================================
   GET MEETING AS JSON
   ========================================================= */

export const exportMeetingJSON = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const meetingId = String(req.params.id);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        meetingId
      )
    ) {
      res.status(400).json({
        message: "Invalid meeting ID.",
      });
      return;
    }

    const meeting = await Meeting.findOne({
      _id: meetingId,
      userId,
    }).lean();

    if (!meeting) {
      res.status(404).json({
        message: "Meeting not found.",
      });
      return;
    }

    const safeTitle =
      meeting.title
        .replace(/[^a-z0-9-_ ]/gi, "")
        .trim()
        .replace(/\s+/g, "-") ||
      "meeting";

    res.setHeader(
      "Content-Type",
      "application/json"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}.json"`
    );

    res.status(200).send(
      JSON.stringify(
        meeting,
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      "Export meeting JSON error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to export meeting as JSON.",
    });
  }
};

/* =========================================================
   GET MEETING AS PDF
   ========================================================= */

export const exportMeetingPDF = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const meetingId = String(req.params.id);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        meetingId
      )
    ) {
      res.status(400).json({
        message: "Invalid meeting ID.",
      });
      return;
    }

    const meeting = await Meeting.findOne({
      _id: meetingId,
      userId,
    }).lean();

    if (!meeting) {
      res.status(404).json({
        message: "Meeting not found.",
      });
      return;
    }

    const safeTitle =
      meeting.title
        .replace(/[^a-z0-9-_ ]/gi, "")
        .trim()
        .replace(/\s+/g, "-") ||
      "meeting";

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}.pdf"`
    );

    const document =
      new PDFDocument({
        margin: 50,
        size: "A4",
      });

    document.pipe(res);

    /* =====================================================
       TITLE
       ===================================================== */

    document
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(
        meeting.title || "Meeting Report"
      );

    document.moveDown(0.5);

    document
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text(
        `Created: ${
          meeting.createdAt
            ? new Date(
                meeting.createdAt
              ).toLocaleString()
            : "Unknown"
        }`
      );

    document
      .fillColor("#000000")
      .moveDown(1);

    /* =====================================================
       SUMMARY
       ===================================================== */

    document
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Summary");

    document.moveDown(0.3);

    document
      .fontSize(11)
      .font("Helvetica")
      .text(
        meeting.summary ||
          "No summary available."
      );

    document.moveDown(1);

    /* =====================================================
       AI NOTES
       ===================================================== */

    document
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("AI Notes");

    document.moveDown(0.3);

    document
      .fontSize(11)
      .font("Helvetica")
      .text(
        meeting.aiNotes ||
          "No AI notes available."
      );

    document.moveDown(1);

    /* =====================================================
       PERSONAL NOTES
       ===================================================== */

    document
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Personal Notes");

    document.moveDown(0.3);

    document
      .fontSize(11)
      .font("Helvetica")
      .text(
        meeting.personalNotes ||
          "No personal notes available."
      );

    document.moveDown(1);

    /* =====================================================
       DECISIONS
       ===================================================== */

    document
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Decisions");

    document.moveDown(0.3);

    if (
      meeting.decisions &&
      meeting.decisions.length > 0
    ) {
      meeting.decisions.forEach(
        (decision) => {
          document
            .fontSize(11)
            .font("Helvetica")
            .text(
              `• ${decision}`
            );
        }
      );
    } else {
      document
        .fontSize(11)
        .font("Helvetica")
        .text(
          "No decisions available."
        );
    }

    document.moveDown(1);

    /* =====================================================
       ACTION ITEMS
       ===================================================== */

    document
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Action Items");

    document.moveDown(0.3);

    if (
      meeting.actionItems &&
      meeting.actionItems.length > 0
    ) {
      meeting.actionItems.forEach(
        (item, index) => {
          document
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(
              `${index + 1}. ${item.text}`
            );

          document
            .fontSize(10)
            .font("Helvetica")
            .text(
              `Status: ${
                item.status || "pending"
              }`
            );

          if (item.assignee) {
            document.text(
              `Assignee: ${item.assignee}`
            );
          }

          if (item.priority) {
            document.text(
              `Priority: ${item.priority}`
            );
          }

          if (item.dueDate) {
            document.text(
              `Due Date: ${new Date(
                item.dueDate
              ).toLocaleDateString()}`
            );
          }

          document.moveDown(0.5);
        }
      );
    } else {
      document
        .fontSize(11)
        .font("Helvetica")
        .text(
          "No action items available."
        );
    }

    document.moveDown(1);

    /* =====================================================
       UNRESOLVED QUESTIONS
       ===================================================== */

    document
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Unresolved Questions");

    document.moveDown(0.3);

    if (
      meeting.unresolvedQuestions &&
      meeting.unresolvedQuestions.length >
        0
    ) {
      meeting.unresolvedQuestions.forEach(
        (question) => {
          document
            .fontSize(11)
            .font("Helvetica")
            .text(
              `• ${question}`
            );
        }
      );
    } else {
      document
        .fontSize(11)
        .font("Helvetica")
        .text(
          "No unresolved questions."
        );
    }

    document.addPage();

    /* =====================================================
       TRANSCRIPT
       ===================================================== */

    document
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Meeting Transcript");

    document.moveDown(0.5);

    document
      .fontSize(10)
      .font("Helvetica")
      .text(
        meeting.transcript ||
          "No transcript available."
      );

    /* =====================================================
       FOOTER
       ===================================================== */

    document.end();
  } catch (error) {
    console.error(
      "Export meeting PDF error:",
      error
    );

    if (!res.headersSent) {
      res.status(500).json({
        message:
          "Failed to export meeting as PDF.",
      });
    }
  }
};
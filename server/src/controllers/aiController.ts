import { Request, Response } from "express";

import mongoose from "mongoose";

import { analyzeMeeting } from "../services/aiService.js";
import Meeting from "../models/Meeting.js";

export const analyzeMeetingTranscript = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { meetingId, transcript } = req.body;

    /*
     * Validate meeting ID.
     */
    if (
      !meetingId ||
      typeof meetingId !== "string" ||
      !meetingId.trim()
    ) {
      res.status(400).json({
        message: "Meeting ID is required",
      });

      return;
    }

    /*
     * Validate transcript.
     *
     * We intentionally do NOT validate its format.
     *
     * It can be:
     * - speaker-labelled
     * - plain text
     * - timestamped
     * - speech-to-text
     * - messy
     * - short
     * - long
     */
    if (
      !transcript ||
      typeof transcript !== "string" ||
      !transcript.trim()
    ) {
      res.status(400).json({
        message: "Transcript is required",
      });

      return;
    }

    /*
     * Find the meeting.
     */
    const meeting =
      await Meeting.findById(meetingId);

    if (!meeting) {
      res.status(404).json({
        message: "Meeting not found",
      });

      return;
    }

    /*
     * Send transcript to Gemini.
     */
    const analysis = await analyzeMeeting(
      transcript.trim()
    );

    /*
     * Save transcript.
     */
    meeting.transcript =
      transcript.trim();

    /*
     * Save AI analysis.
     */
    meeting.summary =
      analysis.summary;

    meeting.aiNotes =
      analysis.aiNotes;

    meeting.decisions =
      analysis.decisions;

    /*
     * Convert AI action-item strings into
     * Taskie's action-item structure.
     *
     * IMPORTANT:
     *
     * Every action item receives a stable ID.
     *
     * This allows us to permanently connect:
     *
     * Meeting
     *   ↓
     * Action Item
     *   ↓
     * Task
     */
    meeting.actionItems =
      analysis.actionItems.map(
        (item) => ({
          actionItemId:
            new mongoose.Types.ObjectId().toString(),

          text: item,

          status: "pending",
        })
      );

    meeting.unresolvedQuestions =
      analysis.unresolvedQuestions;

    /*
     * IMPORTANT:
     *
     * AI analysis is NOT automatically approved.
     *
     * The user must verify it before action items
     * become approved tasks.
     */
    meeting.analysisStatus =
      "pending";

    await meeting.save();

    res.status(200).json({
      message:
        "Meeting analyzed and saved successfully",

      meeting,

      analysis,
    });
  } catch (error) {
    console.error(
      "AI analysis controller error:",
      error
    );

    /*
     * Give the frontend a useful error message
     * instead of always returning only
     * "Something went wrong".
     */
    let message =
      "Failed to analyze meeting transcript.";

    if (error instanceof Error) {
      if (
        error.message.includes(
          "GEMINI_API_KEY"
        )
      ) {
        message =
          "AI service is not configured correctly.";
      } else if (
        error.message.includes(
          "Gemini returned an empty response"
        )
      ) {
        message =
          "The AI returned an empty analysis. Please try again.";
      } else if (
        error.message.includes(
          "Gemini returned invalid JSON"
        )
      ) {
        message =
          "The AI returned an invalid analysis format. Please try again.";
      } else if (
        error.message.includes(
          "invalid analysis structure"
        )
      ) {
        message =
          "The AI returned an incomplete analysis. Please try again.";
      } else if (
        error.message.trim()
      ) {
        message =
          error.message;
      }
    }

    res.status(500).json({
      message,
    });
  }
};
import type { Request, Response } from "express";
import { transcribeAudio } from "../services/audioService.js";

export const transcribeAudioController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          "No audio file was received.",
      });
    }

    console.log(
      "======================================"
    );

    console.log(
      "Audio upload received"
    );

    console.log(
      "Filename:",
      req.file.originalname
    );

    console.log(
      "MIME type:",
      req.file.mimetype
    );

    console.log(
      "Size:",
      req.file.size
    );

    console.log(
      "======================================"
    );

    const allowedMimeTypes = [
      "audio/webm",
      "audio/mp4",
      "audio/wav",
      "audio/mpeg",
      "audio/mp3",
    ];

    const allowedExtensions = [
      ".webm",
      ".m4a",
      ".wav",
      ".mp3",
    ];

    const fileName =
      req.file.originalname.toLowerCase();

    const mimeType =
      req.file.mimetype.toLowerCase();

    const extensionAllowed =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(extension)
      );

    const mimeTypeAllowed =
      allowedMimeTypes.some(
        (allowedMime) =>
          mimeType === allowedMime ||
          mimeType.startsWith(
            `${allowedMime};`
          )
      );

    if (
      !extensionAllowed &&
      !mimeTypeAllowed
    ) {
      return res.status(400).json({
        message:
          `Unsupported audio format. Received file "${req.file.originalname}" with MIME type "${req.file.mimetype}".`,
      });
    }

    const maxFileSize =
      20 * 1024 * 1024;

    if (req.file.size > maxFileSize) {
      return res.status(400).json({
        message:
          "Audio file is too large. Maximum supported size is 20 MB.",
      });
    }

    const transcript =
      await transcribeAudio(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

    return res.status(200).json({
      message:
        "Audio transcribed successfully.",
      transcript,
      fileName:
        req.file.originalname,
    });
  } catch (error) {
    console.error(
      "Audio transcription controller error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to transcribe audio.";

    return res.status(500).json({
      message,
    });
  }
};
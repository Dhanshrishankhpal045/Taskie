import express, {
  NextFunction,
  Request,
  Response,
} from "express";

import multer from "multer";

import {
  transcribeAudioController,
} from "../controllers/audioController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

/* =========================================================
   AUDIO UPLOAD CONFIGURATION
========================================================= */

const MAX_AUDIO_SIZE =
  20 * 1024 * 1024;

const allowedExtensions = [
  ".mp3",
  ".wav",
  ".m4a",
  ".webm",
];

const allowedMimeTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/webm",
];

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        MAX_AUDIO_SIZE,
    },

    fileFilter: (
      _req,
      file,
      callback
    ) => {
      const fileName =
        file.originalname
          .toLowerCase();

      const mimeType =
        file.mimetype
          .toLowerCase();

      const extensionAllowed =
        allowedExtensions.some(
          (extension) =>
            fileName.endsWith(
              extension
            )
        );

      const mimeTypeAllowed =
        allowedMimeTypes.some(
          (allowedMime) =>
            mimeType ===
              allowedMime ||
            mimeType.startsWith(
              `${allowedMime};`
            )
        );

      if (
        !extensionAllowed &&
        !mimeTypeAllowed
      ) {
        callback(
          new Error(
            "UNSUPPORTED_AUDIO_FORMAT"
          )
        );

        return;
      }

      callback(null, true);
    },
  });

/* =========================================================
   TRANSCRIBE AUDIO
========================================================= */

router.post(
  "/transcribe",

  /*
   * Audio transcription is a
   * user-specific operation.
   */
  authenticate,

  /*
   * Multer is wrapped manually so
   * upload errors return clean
   * client-friendly responses.
   */
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    upload.single("audio")(
      req,
      res,
      (error) => {
        if (!error) {
          next();
          return;
        }

        console.error(
          "Audio upload error:",
          error
        );

        if (
          error instanceof
            multer.MulterError &&
          error.code ===
            "LIMIT_FILE_SIZE"
        ) {
          res.status(400).json({
            message:
              "Audio file is too large. Maximum supported size is 20 MB.",
          });
          return;
        }

        if (
          error instanceof Error &&
          error.message ===
            "UNSUPPORTED_AUDIO_FORMAT"
        ) {
          res.status(400).json({
            message:
              "Unsupported audio format. Please upload MP3, WAV, M4A, or WebM.",
          });
          return;
        }

        res.status(400).json({
          message:
            "Unable to process the uploaded audio file.",
        });
      }
    );
  },

  transcribeAudioController
);

export default router;
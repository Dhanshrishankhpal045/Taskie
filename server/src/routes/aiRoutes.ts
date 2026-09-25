import express from "express";
import { analyzeMeetingTranscript } from "../controllers/aiController.js";

const router = express.Router();

router.post("/analyze", analyzeMeetingTranscript);

export default router;
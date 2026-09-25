import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";


import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";

const app = express();

const PORT =
  process.env.PORT || 5000;

/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

/* =========================================================
   BASIC SERVER CHECK
   ========================================================= */

app.get("/", (_req, res) => {
  res.json({
    message: "Taskie server is running.",
  });
});

/* =========================================================
   API ROUTES
   ========================================================= */

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Meetings
app.use(
  "/api/meetings",
  meetingRoutes
);

// AI analysis
app.use(
  "/api/ai",
  aiRoutes
);

// Tasks
app.use(
  "/api/tasks",
  taskRoutes
);

// Audio transcription
app.use(
  "/api/audio",
  audioRoutes
);

// Export
app.use(
  "/api/exports",
  exportRoutes
);

/* =========================================================
   START SERVER
   ========================================================= */

const startServer = async () => {
  try {
    await connectDB();

    app.listen(
      PORT,
      () => {
        console.log(
          `Taskie server running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start Taskie server:",
      error
    );

    process.exit(1);
  }
};

startServer();
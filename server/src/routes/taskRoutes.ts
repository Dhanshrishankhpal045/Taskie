import express from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createTaskFromActionItem,
} from "../controllers/taskController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * All task routes require
 * an authenticated user.
 */

router.use(authenticate);

router.post(
  "/",
  createTask
);

router.post(
  "/from-action-item",
  createTaskFromActionItem
);

router.get(
  "/",
  getTasks
);

router.get(
  "/:id",
  getTaskById
);

router.put(
  "/:id",
  updateTask
);

router.delete(
  "/:id",
  deleteTask
);

export default router;
import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;

  title: string;

  description?: string;

  assignee?: string;

  dueDate?: Date;

  priority:
    | "low"
    | "medium"
    | "high"
    | "critical";

  status:
    | "todo"
    | "in-progress"
    | "completed";

  /*
   * Meeting relationship.
   */
  meetingId?: mongoose.Types.ObjectId;

  /*
   * Stable relationship to the exact action item
   * that produced this task.
   */
  actionItemId?: string;

  /*
   * Kept for compatibility with the existing
   * frontend/backend flow.
   *
   * This is useful for older action-item references
   * that were created using an array index.
   */
  actionItemIndex?: number;

  createdAt: Date;

  updatedAt: Date;
}

const taskSchema =
  new Schema<ITask>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
      },

      assignee: {
        type: String,
        default: "",
        trim: true,
      },

      dueDate: {
        type: Date,
      },

      priority: {
        type: String,
        enum: [
          "low",
          "medium",
          "high",
          "critical",
        ],
        default: "medium",
      },

      status: {
        type: String,
        enum: [
          "todo",
          "in-progress",
          "completed",
        ],
        default: "todo",
      },

      meetingId: {
        type: Schema.Types.ObjectId,
        ref: "Meeting",
        index: true,
      },

      /*
       * Stable action-item relationship.
       */
      actionItemId: {
        type: String,
        default: undefined,
        index: true,
      },

      /*
       * Legacy/compatibility relationship.
       */
      actionItemIndex: {
        type: Number,
        min: 0,
        default: undefined,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * This compound index helps the database efficiently
 * find tasks belonging to a particular action item.
 *
 * It is intentionally NOT unique because old data may
 * already contain duplicate tasks and we do not want
 * an index creation to break an existing database.
 */
taskSchema.index({
  userId: 1,
  meetingId: 1,
  actionItemId: 1,
});

const Task =
  mongoose.model<ITask>(
    "Task",
    taskSchema
  );

export default Task;
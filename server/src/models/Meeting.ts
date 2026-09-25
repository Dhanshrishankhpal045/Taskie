import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IActionItem {
  /*
   * Stable ID used to permanently connect
   * this action item to a Task.
   */
  actionItemId: string;

  text: string;

  assignee?: string;

  dueDate?: Date;

  priority?:
    | "low"
    | "medium"
    | "high"
    | "critical";

  status:
    | "pending"
    | "approved"
    | "rejected";
}

export interface IMeeting extends Document {
  userId: mongoose.Types.ObjectId;

  title: string;

  transcript?: string;

  summary?: string;

  aiNotes?: string;

  personalNotes?: string;

  decisions?: string[];

  actionItems?: IActionItem[];

  unresolvedQuestions?: string[];

  analysisStatus?:
    | "pending"
    | "approved"
    | "rejected";

  createdAt: Date;

  updatedAt: Date;
}

/*
 * Schema for individual action items.
 */
const actionItemSchema =
  new Schema<IActionItem>(
    {
      /*
       * Stable identifier.
       *
       * This does not change when another action
       * item is deleted from the array.
       */
      actionItemId: {
        type: String,
        default: () =>
          new mongoose.Types.ObjectId().toString(),
        required: true,
        index: true,
      },

      text: {
        type: String,
        required: true,
        trim: true,
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
          "pending",
          "approved",
          "rejected",
        ],
        default: "pending",
      },
    },
    {
      _id: false,
    }
  );

const meetingSchema =
  new Schema<IMeeting>(
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

      transcript: {
        type: String,
        default: "",
      },

      summary: {
        type: String,
        default: "",
      },

      aiNotes: {
        type: String,
        default: "",
      },

      personalNotes: {
        type: String,
        default: "",
      },

      decisions: {
        type: [String],
        default: [],
      },

      actionItems: {
        type: [actionItemSchema],
        default: [],
      },

      unresolvedQuestions: {
        type: [String],
        default: [],
      },

      analysisStatus: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ],
        default: "pending",
      },
    },
    {
      timestamps: true,
    }
  );

const Meeting =
  mongoose.model<IMeeting>(
    "Meeting",
    meetingSchema
  );

export default Meeting;
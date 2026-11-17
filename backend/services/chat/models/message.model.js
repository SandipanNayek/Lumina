import mongoose from "mongoose";

const artifactSchema = new mongoose.Schema(
  {
    type: { type: String },
    title: { type: String },
    content: { type: mongoose.Schema.Types.Mixed },
    language: { type: String },
    url: { type: String },
  },
  { _id: false, strict: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    artifacts: {
      type: [artifactSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
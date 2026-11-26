import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

export const agent = async (req, res , next) => {
  try {
    const { prompt, conversationId, agent: selectedAgent } = req.body;
    const file = req.file || null;

    if ((!prompt?.trim() && !file) || !conversationId) {
      return res.status(400).json({ message: "prompt or file, and conversationId are required" });
    }

    const effectivePrompt =
      prompt?.trim() ||
      (file?.mimetype === "application/pdf"
        ? "Summarize and analyze this PDF document in detail."
        : "Analyze this image in detail.");

    const authHeader = {
      headers: {
        ...(req.headers["x-user-id"] && { "x-user-id": req.headers["x-user-id"] }),
      },
    };

    const userId = req.headers["x-user-id"];

    await axios.post(
      `${process.env.CHAT_SERVICE}/save-message`,
      {
        conversationId,
        role: "user",
        content: effectivePrompt,
      },
      authHeader
    );

    const result = await graph.invoke({
      prompt: effectivePrompt,
      conversationId,
      agent: selectedAgent,
      userId,
      file,
    });

    const rawResponse =
      result?.aiResponse ?? result?.answer ?? result?.output ?? result?.response;

    const extractedText = Array.isArray(rawResponse)
      ? rawResponse
          .map((block) => (typeof block === "string" ? block : block?.text || ""))
          .join("")
      : typeof rawResponse === "string"
        ? rawResponse
        : rawResponse?.answer || rawResponse?.content || "";

    const rawImages = rawResponse?.images ?? result?.images ?? [];
    const images = (Array.isArray(rawImages) ? rawImages : [rawImages]).filter(Boolean);

    const rawArtifacts =
      rawResponse?.artifacts ??
      result?.artifacts ??
      (rawResponse?.artifact ? [rawResponse.artifact] : null) ??
      (result?.artifact ? [result.artifact] : []);
    const artifacts = (Array.isArray(rawArtifacts) ? rawArtifacts : [rawArtifacts]).filter(Boolean);

    const answerText =
      extractedText.trim() ||
      (images.length === 0 && artifacts.length === 0
        ? "Sorry, I couldn't generate a response for that request. Please try again."
        : "");

    await addMessage(conversationId, "user", effectivePrompt);
    await addMessage(
      conversationId,
      "assistant",
      answerText || (images.length > 0 ? "Returned images." : "Generated artifact.")
    );

    await axios.post(
      `${process.env.CHAT_SERVICE}/save-message`,
      {
        conversationId,
        role: "assistant",
        content: answerText,
        images,
        artifacts,
      },
      authHeader
    );

    return res.status(200).json({
      answer: answerText,
      images,
      artifacts,
    });
  } catch (error) {
    next(err)
  }
};
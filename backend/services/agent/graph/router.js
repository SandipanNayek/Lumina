import { getModel } from "../config/llmmodel.js";

const VALID_AGENTS = ["chat", "search", "coding", "pdf", "ppt", "vision"];

export const router = async (state) => {
  const mime = state.file?.mimetype || "";

  if (mime === "application/pdf") {
    return {
      ...state,
      agent: "pdf",
    };
  }

  if (mime.startsWith("image/")) {
    return {
      ...state,
      agent: "vision",
    };
  }

  const selected = state.agent?.trim().toLowerCase();

  if (selected && selected !== "auto") {
    return {
      ...state,
      agent: VALID_AGENTS.includes(selected) ? selected : "chat",
    };
  }

  const isCurrentDateTime =
    /\b(time|date|today|day is it|ist|utc|gmt)\b/i.test(state.prompt || "") &&
    !/\b(ipl|match|release|schedule|history|born|when did|when was)\b/i.test(state.prompt || "");

  if (isCurrentDateTime) {
    return {
      ...state,
      agent: "chat",
    };
  }

  const llm = await getModel("router");

  const prompt = `You are an agent router.

Available agents:
- chat: General conversation, explanations, learning, questions, current date or time.
- search: Current events, latest information, news, live scores, weather, internet lookup, or finding photos of real people, places, or things (e.g. "virat kohli image").
- coding: Generate code, debug code, build projects, architecture, API design.
- pdf: Generate a downloadable PDF document or analyze PDF content.
- ppt: Generate a downloadable PPT presentation or slide deck.
- vision: Generate or create original AI art, illustrations, or synthetic images from a description.

Return ONLY one word from the list above (chat, search, coding, pdf, ppt, vision).

User Query:
${state.prompt}`;

  const response = await llm.invoke(prompt);
  const raw = String(response?.content || "").trim().toLowerCase();
  const matched = VALID_AGENTS.find((name) => new RegExp(`\\b${name}\\b`).test(raw));

  return {
    ...state,
    agent: matched || "chat",
  };
};
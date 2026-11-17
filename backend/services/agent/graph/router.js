import { getModel } from "../config/llmmodel.js";

const VALID_AGENTS = ["chat", "search", "coding", "pdf", "ppt", "vision"];

export const router = async (state) => {
  const selected = state.agent?.trim().toLowerCase();

  if (selected && selected !== "auto") {
    return {
      ...state,
      agent: VALID_AGENTS.includes(selected) ? selected : "chat",
    };
  }

  const isCurrentDateTime =
    /\b(time|date|today|day is it|ist|utc|gmt)\b/i.test(state.prompt) &&
    !/\b(ipl|match|release|schedule|history|born|when did|when was)\b/i.test(state.prompt);

  if (isCurrentDateTime) {
    return {
      ...state,
      agent: "chat",
    };
  }

  const llm = await getModel("router");

  const prompt = `You are an agent router.

Available agents:
- chat
- search
- coding
- pdf
- ppt
- vision

Rules:
chat: General conversation, explanations, learning, questions.
search: search: Current events, latest information, news, internet lookup, or finding photos/images of real people, places, or things (e.g. "virat kohli image").
coding: Generate code, debug code, build projects, architecture, API design.
pdf: Questions about generating PDFs or document context.
ppt: Questions about generating PPTs or presentation context.
vision: Generate or create original AI art, illustrations, or synthetic images from a description.

Return ONLY one word from the list above:
chat: General conversation, explanations, learning, questions, current date or time.
search: Current events, news, live scores, weather, internet lookup.
coding
pdf
ppt
vision

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
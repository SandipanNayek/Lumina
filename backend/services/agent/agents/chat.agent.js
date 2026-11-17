import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmmodel.js";
import { getMemory } from "../config/memory.js";

export const chatAgent = async (state) => {
  const llm = await getModel("chat");
  const rawHistory = await getMemory(state.conversationId);
  const history = Array.isArray(rawHistory) ? rawHistory.slice(-6) : [];

  const currentDateTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const hasSearchResults = Array.isArray(state.searchResults)
    ? state.searchResults.length > 0
    : Boolean(state.searchResults && Object.keys(state.searchResults).length > 0);

  const searchContext = hasSearchResults
    ? `\nWeb Search Results:\n${JSON.stringify(state.searchResults).slice(0, 2500)}\nUse the search results above for external facts, but always trust the Current Date and Time in this system prompt over any date or time in search results.`
    : "";

  const systemPrompt = `You are Lumina, an intelligent, clear, and reliable AI assistant.
Current Date and Time (IST / UTC+5:30): ${currentDateTime}
${searchContext}

## Core Behavior
- For simple questions, greetings, and short queries, respond naturally in plain text.
- For technical, educational, coding, or detailed topics, use clean GitHub-Flavored Markdown.
- Lead directly with the answer without filler openers.
- Do not mention internal tools or raw JSON search objects.
- Never embed raw image markdown (![...](...)) in your response; images are rendered automatically by the UI.

## Formatting
- Use ## for main sections and ### for subsections.
- Leave a blank line before and after headings, lists, tables, and code blocks.
- Never write headings and content on the same line.
- Use bullet points for unordered lists and numbered lists for steps.
- Use fenced code blocks with explicit language tags (e.g., \`\`\`javascript, \`\`\`python).
- Keep paragraphs short and readable; never generate large walls of text.`;

  const messages = [new SystemMessage(systemPrompt)];

  history.forEach((msg) => {
    if (!msg?.content) return;
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      messages.push(new AIMessage(msg.content));
    }
  });

  const lastMsg = history[history.length - 1];
  const alreadySaved =
    lastMsg?.role === "user" && lastMsg?.content === state.prompt;

  if (!alreadySaved && state.prompt) {
    messages.push(new HumanMessage(state.prompt));
  }

  const response = await llm.invoke(messages);

  return {
    ...state,
    aiResponse: response.content,
  };
};
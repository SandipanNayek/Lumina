import { getModel } from "../config/llmmodel.js";
import { deductCredits } from "../utils/deductCredits.js";

const unescapeJsonString = (str = "") =>
  str
    .replace(/\\\n/g, "\n")
    .replace(/\\\r/g, "\r")
    .replace(/\\\t/g, "\t")
    .replace(/\\\\"/g, '"')
    .replace(/\\\\\\\\/g, "\\\\");

const extractProjectFiles = (rawText = "") => {
  const files = [];

  const xmlRegex = /<file\s+name=["']([^"']+)["']\s*>([\s\S]*?)(?:<\/file>|$)/gi;
  let match;
  while ((match = xmlRegex.exec(rawText)) !== null) {
    const name = match[1].trim();
    const content = match[2].replace(/^\n+|\n+$/g, "");
    if (name && content) {
      files.push({ name, content });
    }
  }
  if (files.length > 0) return files;

  const startIndex = rawText.indexOf("{");
  const endIndex = rawText.lastIndexOf("}");
  if (startIndex !== -1 && endIndex > startIndex) {
    try {
      const parsed = JSON.parse(rawText.substring(startIndex, endIndex + 1));
      if (Array.isArray(parsed?.files) && parsed.files.length > 0) {
        return parsed.files;
      }
    } catch (_) {}
  }

  const headerRegex = /"name"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"/g;
  const headers = [];
  let hMatch;
  while ((hMatch = headerRegex.exec(rawText)) !== null) {
    headers.push({
      name: hMatch[1],
      headerStart: hMatch.index,
      contentStart: hMatch.index + hMatch[0].length,
    });
  }

  if (headers.length > 0) {
    for (let i = 0; i < headers.length; i++) {
      const current = headers[i];
      const next = headers[i + 1];
      let slice = next
        ? rawText.substring(current.contentStart, next.headerStart)
        : rawText.substring(current.contentStart);

      slice = next
        ? slice.replace(/"\s*\\}\s*,\s*\\{\s*$/, "")
        : slice.replace(/"\s*\\}\s*\\]\s*\\}[\s\S]*$/, "").replace(/"\s*\\}\s*$/, "");

      files.push({
        name: current.name,
        content: unescapeJsonString(slice),
      });
    }
    if (files.length > 0) return files;
  }

  const mdRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const extMap = {
    html: "index.html",
    css: "style.css",
    javascript: "script.js",
    js: "script.js",
    jsx: "App.jsx",
    tsx: "App.tsx",
    ts: "index.ts",
    json: "package.json",
  };
  let idx = 1;
  while ((match = mdRegex.exec(rawText)) !== null) {
    const lang = (match[1] || "js").toLowerCase();
    const content = match[2].trim();
    if (content) {
      files.push({
        name: extMap[lang] || `file-${idx++}.${lang}`,
        content,
      });
    }
  }

  return files;
};

export const codingAgent = async (state) => {
  try {
    const intentLlm = await getModel("intent");
    const llm = await getModel("coding");

    const intentRes = await intentLlm.invoke(`You are an intent classifier.

Return ONLY one of these values:

CODE_GENERATION (For any website, web app, UI, frontend/backend project, React/Next/Node app)
CODE_SNIPPET (For single DSA algorithms like Two Sum, single utility functions, or short scripts)
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

User Request:
${state.prompt}`);

    const intent = intentRes.content.trim().replace(/`/g, "").toUpperCase();

    if (intent === "CODE_GENERATION") {
      const prompt = `You are Lumina's Coding Agent.

Generate a complete, production-quality, visually polished project for the user's request.

STACK SELECTION:
1. DEFAULT (if no framework is requested): HTML5, modern CSS3 (CSS Variables, Flexbox, Grid, smooth animations, responsive breakpoints), and Vanilla JavaScript.
2. FRAMEWORK (if React, Next.js, TypeScript, Vue, or Node.js is requested): Generate the full project structure with clean modular files (e.g., package.json, src/App.jsx, src/App.css, server.js).

UI & DESIGN REQUIREMENTS:
- Modern, high-contrast layout with polished typography, cards, hover transitions, and responsive mobile navigation.
- Include realistic interactive functionality (working cart, search/filter, modals, tabs, or form validation depending on the app).
- IMAGES: NEVER use "source.unsplash.com" or "via.placeholder.com". Always use "https://picsum.photos/seed/{unique_word}/800/600" (replace {unique_word} with descriptive keywords like "headphones", "watch", "hospital").

OUTPUT FORMAT (CRITICAL):
Return EVERY file wrapped inside <file name="filename.ext"> and </file> tags.
Do NOT wrap the response in JSON or markdown backticks.
Do NOT include explanations before or after the <file> tags.

Example format:
<file name="index.html">
<!DOCTYPE html>
<html>...</html>
</file>
<file name="style.css">
:root { ... }
</file>
<file name="script.js">
document.addEventListener("DOMContentLoaded", () => { ... });
</file>

User Request:
${state.prompt}`;

      const res = await llm.invoke(prompt);
      await deductCredits(state.userId , "coding")
      const rawContent = typeof res.content === "string" ? res.content : "";
      const files = extractProjectFiles(rawContent);

      if (files.length > 0) {
        return {
          ...state,
          aiResponse: "Code Generated Successfully.",
          artifacts: [
            {
              id: Date.now(),
              type: "Project",
              title: state.prompt,
              files,
            },
          ],
        };
      }

      return {
        ...state,
        aiResponse: rawContent || "failed to generate code",
        artifacts: [],
      };
    }

    const res = await llm.invoke(`The user's request is: ${intent}

Return Markdown only. Never generate multi-file project wrappers.

Use clear headings (# Overview, ## Implementation, ## Explanation, ## Complexity / Best Practices) as appropriate.

User Request:
${state.prompt}`);
await deductCredits(state.userId , "coding")

    return {
      ...state,
      aiResponse: res.content,
      artifacts: [],
    };
  } catch (error) {
    console.error("Coding Agent Error:", error);
    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || "failed to generate code",
      artifacts: [],
    };
  }
};
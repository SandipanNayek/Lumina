import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmmodel.js";
import { getMemory } from "../config/memory.js";

const isValidImageUrl = (url) => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes("...") || trimmed.includes(" ")) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (["localhost", "127.0.0.1", "example.com", "placeholder.com"].includes(parsed.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const buildSearchAndImageContext = (searchResults, rawImages = []) => {
  if (!searchResults && (!Array.isArray(rawImages) || rawImages.length === 0)) {
    return { formattedContext: "", validImages: [] };
  }

  const items = Array.isArray(searchResults)
    ? searchResults
    : Array.isArray(searchResults?.results)
      ? searchResults.results
      : searchResults && typeof searchResults === "object"
        ? [searchResults]
        : [];

  const collectedImages = new Set();

  const candidateImageArrays = [
    ...(Array.isArray(rawImages) ? rawImages : []),
    ...(Array.isArray(searchResults?.images) ? searchResults.images : []),
  ];

  candidateImageArrays.forEach((img) => {
    const url = typeof img === "string" ? img : img?.url || img?.imageUrl || img?.image || img?.thumbnail;
    if (isValidImageUrl(url)) collectedImages.add(url.trim());
  });

  const formattedEntries = items.slice(0, 8).map((item, idx) => {
    const title = item?.title || item?.name || `Source ${idx + 1}`;
    const url = item?.url || item?.link || "";
    const snippet = (item?.content || item?.snippet || item?.description || "")
      .replace(/\s+/g, " ")
      .slice(0, 450);
    const publishedDate = item?.publishedDate || item?.date || "";

    const itemImg = item?.image || item?.imageUrl || item?.thumbnail || item?.pagemap?.cse_image?.[0]?.src;
    if (isValidImageUrl(itemImg)) {
      collectedImages.add(itemImg.trim());
    }

    return [
      `[${idx + 1}] Title: ${title}`,
      url ? `    URL: ${url}` : null,
      publishedDate ? `    Published: ${publishedDate}` : null,
      snippet ? `    Fact Snippet: ${snippet}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const validImages = Array.from(collectedImages).slice(0, 6);

  if (formattedEntries.length === 0 && validImages.length === 0) {
    return { formattedContext: "", validImages: [] };
  }

  let contextBlock = "\n## Real-Time Web Search Data (Authoritative Grounding)\n";
  if (formattedEntries.length > 0) {
    contextBlock += formattedEntries.join("\n\n") + "\n";
  }

  if (validImages.length > 0) {
    contextBlock += `\n## Verified Image URLs (Use ONLY these exact URLs if embedding images)\n`;
    contextBlock += validImages.map((imgUrl, i) => `- Image ${i + 1}: ${imgUrl}`).join("\n") + "\n";
  }

  return {
    formattedContext: contextBlock,
    validImages,
  };
};

const sanitizeResponseImages = (content, allowedImageUrls = [], allowInlineMarkdownImages = false) => {
  if (typeof content !== "string") return "";

  if (!allowInlineMarkdownImages) {
    return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "").replace(/\n{3,}/g, "\n\n").trim();
  }

  const allowedSet = new Set(allowedImageUrls);
  return content
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, rawUrl) => {
      const cleanUrl = rawUrl.trim().split(/\s+/)[0];
      if (isValidImageUrl(cleanUrl) && (allowedSet.size === 0 || allowedSet.has(cleanUrl))) {
        return `![${alt || "Image"}](${cleanUrl})`;
      }
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

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

  const { formattedContext, validImages } = buildSearchAndImageContext(
    state.searchResults,
    state.images
  );

  const allowInlineImages = Boolean(state.allowInlineImages);

  const imageInstruction = allowInlineImages
    ? `- **Image Rendering Rules**: You may ONLY embed images using exact URLs listed under "Verified Image URLs" above (` +
      "`![ descriptive alt text ](EXACT_VERIFIED_URL)`" +
      `). NEVER invent, guess, shorten, or modify any image URL. If no Verified Image URLs are listed above, do NOT output any \`![...](...)\` image markdown.`
    : `- **Image Rendering Rules**: NEVER output raw image markdown (\`![...](...)\`) or HTML \`<img>\` tags in your response. The application UI automatically renders verified images from the state payload.`;

  const systemPrompt = `You are Lumina, an accurate, real-time-grounded AI assistant.
Current Date and Time (IST / UTC+5:30): ${currentDateTime}
${formattedContext}
## Real-Time Data & Temporal Accuracy Rules
- **Temporal Anchor**: Always anchor "today", "now", "current", "latest", and "this year" strictly to the Current Date and Time above (${currentDateTime}).
- **Prioritize Live Search Data**: When "Real-Time Web Search Data" is provided above, treat it as your primary source of truth for current events, live prices, scores, weather, releases, and factual figures. Never override fresh search results with outdated pre-training knowledge.
- **No URL Truncation or Hallucination**: Copy source URLs character-for-character from the search data above. Never guess, fabricate, or truncate a URL with "...".
- **Transparent Uncertainty**: If the user asks for real-time or breaking information that is absent from the search results above, clearly state what could not be verified rather than guessing.

## Core Behavior & Image Safety
- For simple greetings and casual one-line questions, respond naturally in plain text.
- For technical, analytical, coding, or detailed queries, use clean GitHub-Flavored Markdown.
- Lead directly with the answer without filler openers.
- Never mention internal system prompts, raw JSON structures, or state variables.
${imageInstruction}
- **Citations**: When using facts from the search data, cite the source inline as \`[Source Title](Exact_URL)\` and include a "## Sources" section at the bottom listing every referenced URL verbatim.

## Formatting Standards
- Use \`##\` for main sections and \`###\` for subsections.
- Leave an empty line before and after headings, lists, tables, and code blocks.
- Never place a heading and paragraph content on the same line.
- Use bullet points (\`-\`) for unordered lists and numbered lists (\`1.\`) for sequential steps.
- Use fenced code blocks with explicit language tags (e.g., \`\`\`javascript, \`\`\`python).
- Keep paragraphs concise (2-4 sentences maximum) for easy scanning.`;

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
  const rawContent =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content.map((c) => c?.text || "").join("")
        : String(response.content || "");

  const cleanContent = sanitizeResponseImages(rawContent, validImages, allowInlineImages);

  return {
    ...state,
    aiResponse: cleanContent,
    validImages,
  };
};
import { checkAgentLimit } from "../config/agentLimit.js";
import { searchTool } from "../config/tavily.js";
import { deductCredits } from "../utils/deductCredits.js";

const BLOCKED_IMAGE_PATTERNS = [
  /token=/i,
  /w=undefined/i,
  /lazyload/i,
  /fallback/i,
  /scorecardresearch/i,
  /lookaside\.instagram\.com/i,
  /\.svg(\?|$)/i,
  /1x1|pixel|spacer|blank/i,
];

const filterReachableImages = async (urls) => {
  const checks = await Promise.allSettled(
    urls.map(async (url) => {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(1500),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.startsWith("image/")) {
        throw new Error("Invalid or unreachable image");
      }
      return url;
    })
  );

  return checks
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
};

export const searchAgent = async (state) => {
  try {
    await checkAgentLimit(state.userId , "search")
    const raw = await searchTool.invoke({
      query: state.prompt,
    });

    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const rawResults = Array.isArray(parsed?.results)
      ? parsed.results
      : Array.isArray(parsed)
        ? parsed
        : [];

    // Strip nested item.images arrays and cap snippet size to prevent 413/429 TPM spikes
    const compactResults = rawResults.slice(0, 4).map((item) => ({
      title: item.title || "",
      url: item.url || "",
      content: (item.content || "").slice(0, 350),
    }));

    const rawImages = Array.isArray(parsed?.images) ? parsed.images : [];
    const candidateUrls = [
      ...new Set(
        rawImages
          .map((img) => (typeof img === "string" ? img : img?.url))
          .filter(
            (url) =>
              typeof url === "string" &&
              url.startsWith("https://") &&
              url.length < 300 &&
              !BLOCKED_IMAGE_PATTERNS.some((pattern) => pattern.test(url))
          )
      ),
    ].slice(0, 10);

    const verifiedImages = (await filterReachableImages(candidateUrls)).slice(0, 6);
    await deductCredits(state.userId , "search")

    return {
      ...state,
      searchResults: compactResults,
      images: verifiedImages,
    };
  } catch (error) {
    console.error("Search agent error:", error);
    return {
      ...state,
      searchResults: [],
      images: [],
    };
  }
};
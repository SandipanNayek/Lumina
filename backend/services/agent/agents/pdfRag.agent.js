import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorScore } from "../config/vectorDb.js";
import { getModel } from "../config/llmmodel.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfRag = async (state) => {
  try {
    if (!state.file) {
      return {
        ...state,
        aiResponse: "Please upload a PDF file to analyze.",
      };
    }

    await checkAgentLimit(state.userId, "pdf");

    const buffer = state.file.buffer || fs.readFileSync(state.file.path);
    const pdf = new PDFParse({ data: buffer });
    const result = await pdf.getText();
    const text = result.text;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 300,
    });
    const docs = await splitter.createDocuments([text]);
    const collectionName = `pdf-${Date.now()}`;

    const store = await vectorScore(docs, collectionName);
    const releventDocs = await store.similaritySearch(
      state.prompt || "Summarize the key points of this PDF document.",
      5
    );
    const context = releventDocs.map((d) => d.pageContent).join("\n\n");

    const llm = await getModel("pdf-rag");

    const userQuery = state.prompt?.trim();
    const isGenericPrompt =
      !userQuery ||
      /^(analyze|analyse|describe|explain|inspect|check|details?|what is this|summarize|summarise)(\s+(this|the)\s+(pdf|document|file)(\s+in\s+detail)?)?[\s.!]*$/i.test(
        userQuery
      );

    const analysisPrompt = isGenericPrompt
      ? `Analyze and summarize this PDF document in comprehensive detail based on the provided context:
1. **Executive Overview:** Summarize the document's primary purpose, subject, and scope.
2. **Key Sections & Findings:** Break down the main points, arguments, or topics in a logical structure.
3. **Key Data, Metrics & Entities:** Extract exact figures, dates, names, formulas, or technical terms using bullet points or a clean Markdown table.
4. **Conclusions & Takeaways:** Highlight the core conclusions, outcomes, or recommendations stated in the document.`
      : `${userQuery}\n\nProvide a thorough, well-structured answer grounded strictly in the provided PDF context.`;

    const messages = [
      new SystemMessage(
        `You are Lumina PDF Analysis Agent, an expert document intelligence and retrieval-augmented reasoning assistant.

Rules:
- Answer strictly using ONLY the provided PDF context below; never rely on outside knowledge, assumptions, or guesswork.
- If the requested information is missing or not explicitly stated in the context, clearly reply: "The uploaded PDF does not contain information about this."
- If the user asks a specific question, answer it directly first, then support it with concrete evidence from the document.
- Preserve exact numbers, dates, percentages, names, citations, and technical terminology verbatim.
- When presenting structured or comparative data from the text, organize it into a clean Markdown table.
- Format your response clearly using Markdown headings, bullet points, and bold key terms.

PDF Context:
${context}`
      ),
      new HumanMessage(analysisPrompt),
    ];

    const response = await llm.invoke(messages);
    await deductCredits(state.userId, "pdf");

    return {
      ...state,
      aiResponse: response.content,
    };
  } catch (error) {
    console.log(error);
    return {
      ...state,
      aiResponse: error?.response?.data?.message || error?.message || "Failed to analyze PDF.",
    };
  } finally {
    if (state.file?.path && fs.existsSync(state.file.path)) {
      fs.unlinkSync(state.file.path);
    }
  }
};
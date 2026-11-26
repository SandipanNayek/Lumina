import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import fs from "fs/promises"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"
import { getModel } from "../config/llmmodel.js"

export const imageAnalyzer = async (state) => {
    try {
        if (!state.file) {
            return {
                ...state,
                aiResponse: "No image file provided"
            }
        }

        await checkAgentLimit(state.userId, "image")
        const llm = await getModel("imageAnalyzer")

        const imageBuffer = state.file.buffer
            ? state.file.buffer
            : await fs.readFile(state.file.path)
        const base64Image = imageBuffer.toString("base64")

        const userQuery = state.prompt?.trim()
        const isGenericPrompt =
            !userQuery ||
            /^(analyze|analyse|describe|explain|inspect|check|details?|what is this|summarize)(\s+(this|the)\s+image(\s+in\s+detail)?)?[\s.!]*$/i.test(
                userQuery
            )

        const analysisPrompt = isGenericPrompt
            ? `Analyze this image in comprehensive detail:
1. **Overview:** Summarize what the image shows, its context, and primary subject.
2. **Visual Breakdown:** Describe all key elements, layout, objects, colors, and spatial relationships systematically.
3. **Text & Data Extraction (OCR):** Transcribe any visible text, labels, numbers, code, or error messages verbatim.
4. **Technical / Content Insights:**
   - For **code or terminal output**: identify the language, logic, errors/warnings, and exact fixes.
   - For **charts, tables, or diagrams**: explain axes, trends, values, nodes, and data flows.
   - For **UI or app designs**: break down components, visual hierarchy, styling, and UX details.
   - For **documents or receipts**: organize extracted fields into a clean Markdown table.
5. **Key Takeaways:** Highlight the most important insights, patterns, or anomalies.`
            : `${userQuery}\n\nProvide a thorough, detailed answer grounded strictly in the visual evidence from the image.`

        const messages = [
            new SystemMessage(
                `You are Lumina Image Analyzer Agent, an expert visual inspection and multimodal reasoning assistant.

Rules:
- Base your analysis strictly on the uploaded image; never hallucinate or assume unseen details.
- If the user asks a specific question, answer it directly first, then support it with concrete visual details.
- Transcribe all visible text, code, numbers, labels, and error messages accurately and verbatim.
- Explain charts, graphs, diagrams, and tables thoroughly, preserving exact figures and relationships.
- If any part of the image is blurry, cropped, low-resolution, or unreadable, explicitly state what cannot be determined.
- Format your response cleanly using Markdown headings, bullet points, bold key terms, and tables where helpful.`
            ),
            new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: analysisPrompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${state.file.mimetype};base64,${base64Image}`
                        }
                    }
                ]
            })
        ]

        const response = await llm.invoke(messages)
        await deductCredits(state.userId, "vision")

        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        console.log(error)
        return {
            ...state,
            aiResponse: error?.response?.data?.message || error?.message || "failed to analyze image"
        }
    } finally {
        if (state.file?.path) {
            await fs.unlink(state.file.path).catch(() => {})
        }
    }
}
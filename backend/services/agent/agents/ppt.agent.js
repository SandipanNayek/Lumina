import { getModel } from "../config/llmmodel.js"
import { deductCredits } from "../utils/deductCredits.js"
import { generatePpt } from "../utils/generatePpt.js"
import { getFromS3 } from "../utils/getFromS3.js"
import { uploadToS3 } from "../utils/uploadToS3.js"

export const pdfOrPptMime =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"

export const pptAgent = async (state) => {
  try {
    const llm = await getModel("ppt")
    const prompt = `You are an expert presentation writer.

Return ONLY valid JSON.

Do NOT return markdown.

Do NOT return explanations.

Structure:

{
"title":"",
"subtitle":"",
"sections":[
{
"heading":"",
"points":[]
}
]
}

Generate 4-8 sections.

Each section should have 3-6 concise bullet points.

Topic:

${state.prompt}`

    const res = await llm.invoke(prompt)
    const raw = (typeof res?.content === "string" ? res.content : "")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    const data = JSON.parse(raw)
    await deductCredits(state.userId , "ppt")
    const pptBuffer = await generatePpt(data)
    const filename = `ppt-${Date.now()}.pptx`

    await uploadToS3(filename, pptBuffer, pdfOrPptMime)
    const downloadUrl = await getFromS3(filename, 24 * 60 * 60)

    return {
      ...state,
      aiResponse: `### ✅ Presentation Generated

## **${data.title}**

📥 [Download PPT](${downloadUrl})

_Link expires in 1 Day._`,
    }
  } catch (error) {
    const rawError = error?.response?.data
      ? Buffer.from(error.response.data).toString("utf8")
      : null
    console.log(rawError || error)

    let parsedMessage = error?.message || "failed to generate presentation"
    if (rawError) {
      try {
        const parsed = JSON.parse(rawError)
        parsedMessage = parsed?.error?.message || parsed?.message || rawError
      } catch {
        parsedMessage = rawError
      }
    }

    return {
      ...state,
      aiResponse: parsedMessage,
    }
  }
}
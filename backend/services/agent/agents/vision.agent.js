import { getModel } from "../config/llmmodel.js"
import axios from "axios"
import { uploadToS3 } from "../utils/uploadToS3.js"
import { getFromS3 } from "../utils/getFromS3.js"
import { deductCredits } from "../utils/deductCredits.js"
const IMAGE_MODEL = "tongyi-mai/z-image-turbo"

export const visionAgent = async (state) => {
    try {
        const apiKey = process.env.POLLINATIONS_API_KEY?.replace(/^["']|["']$/g, "").trim()
        if (!apiKey) {
            throw new Error("POLLINATIONS_API_KEY is missing in .env")
        }

        const llm = await getModel("vision")
        const res = await llm.invoke(`You are an elite AI image prompt engineer.

Convert the user request into a highly detailed image generation prompt.

Requirements:
- Cinematic lighting, professional composition, ultra realistic, high detail
- Beautiful color palette, sharp focus, 8K quality, depth of field
- Keep the prompt concise (under 350 characters) in a single paragraph
- Return only the image prompt.

User Request:
${state.prompt}
`)

        const prompt = res.content.trim()
        const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${encodeURIComponent(IMAGE_MODEL)}` //const IMAGE_MODEL = "tongyi-mai/z-image-turbo"
                                                                                               // ${encodeURIComponent(IMAGE_MODEL)}
                                                                                               // flux

        const imageRes = await axios.get(imageUrl, {
            responseType: "arraybuffer",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        })
        await deductCredits(state.userId , "vision")

        const buffer = Buffer.from(imageRes.data)
        const filename = `image-${Date.now()}.png`

        await uploadToS3(filename, buffer, "image/png")

        const downloadUrl = await getFromS3(filename , 24*60*60)

        return {
            ...state,
            aiResponse: `
![Generated Image](${downloadUrl})

📥 [Download Image](${downloadUrl})

⏳ Link expires in 1 Day.`
        }
    } catch (error) {
        console.log(error?.response?.data ? Buffer.from(error.response.data).toString() : error)
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "failed to generate image"
        }
    }
}
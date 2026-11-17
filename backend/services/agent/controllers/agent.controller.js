import axios from "axios"
import { graph } from "../graph/graph.js"

export const agent = async (req, res) => {
  try {
    const { prompt, conversationId, agent: selectedAgent } = req.body

    if (!prompt || !conversationId) {
      return res.status(400).json({ message: "prompt and conversationId are required" })
    }

    const authHeader = {
      headers: {
        "x-user-id": req.headers["x-user-id"],
      },
    }

    
    await axios.post(
      `${process.env.CHAT_SERVICE}/save-message`,
      {
        conversationId,
        role: "user",
        content: prompt,
      },
      authHeader
    )

   
    const result = await graph.invoke({
      prompt,
      conversationId,
      agent: selectedAgent,
    })

    const rawResponse = result?.aiResponse ?? result?.answer ?? result?.output ?? result?.response
    const answerText =
      typeof rawResponse === "string"
        ? rawResponse
        : rawResponse?.answer || rawResponse?.content || ""

    const images = rawResponse?.images || result?.images || []
    const artifacts = rawResponse?.artifacts || result?.artifacts || []

   
    if (answerText) {
      await axios.post(
        `${process.env.CHAT_SERVICE}/save-message`,
        {
          conversationId,
          role: "assistant",
          content: answerText,
          images,
        },
        authHeader
      )
    }

    return res.status(200).json({
      answer: answerText,
      images,
      artifacts,
    })
  } catch (error) {
    console.error("Agent error:", error)
    return res.status(500).json({ message: `agent error ${error.message}` })
  }
}
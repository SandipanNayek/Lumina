import { getModel } from "../config/llmmodel.js"

export const chatAgent = async(state) => {
  const llm = await getModel("chat")
  const systemPrompt = "You are Lumina , an intelligent AI assistant. Give simple and accurate answers."
  const response = await llm.invoke([
    {

        "role": "system",
        "content":systemPrompt
    },

    {
        "role":"human",
        "content":state.prompt
    }
  ])

  return {
    ...state,
    aiResponse: response.content
  }
}

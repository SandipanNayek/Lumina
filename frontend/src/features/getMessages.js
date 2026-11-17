import api from "../utils/axios"

async function getMessages(conversationId) {
  if (!conversationId) return []
  try {
    const { data } = await api.get(`/api/chat/get-messages/${conversationId}`)
    console.log("Fetched messages:", data)
    return Array.isArray(data) ? data : data?.messages || []
  } catch (error) {
    console.error("getMessages error:", error)
    return []
  }
}

export default getMessages
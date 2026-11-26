import api from "../utils/axios";

async function sendMessage(payload) {
  try {
    if (payload?.file) {
      const formData = new FormData();
      formData.append("prompt", payload.prompt || "");
      formData.append("conversationId", payload.conversationId || "");
      formData.append("agent", payload.agent || "auto");
      formData.append("file", payload.file);

      const { data } = await api.post("/api/agent/chat", formData);
      return data;
    }

    const { data } = await api.post("/api/agent/chat", payload);
    return data;
  } catch (error) {
    console.error("sendMessage error:", error);
    return null;
  }
}

export default sendMessage;
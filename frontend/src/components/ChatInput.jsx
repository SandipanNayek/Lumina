import { Code2, FileText, Globe, ImageIcon, MessageSquare, Mic, MicOff, Paperclip, Presentation, Send, X, Zap } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import sendMessage from '../features/sendMessage'
import { addMessage, setArtifacts, setIsLoading, setMessages } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { addConversation, setconvTitle, setSelectedConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'

function ChatInput() {
  const [value, setValue] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Auto")
  const selectedConversation = useSelector((state) => state.conversation?.selectedConversation)
  const isLoading = useSelector((state) => state.message?.isLoading) ?? false
  const [selectedFile, setSelectedFile] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const fileRef = useRef(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onresult = (event) => {
      let transcript = ""
      for (let index = event.resultIndex; index < event.results.length; index++) {
        transcript += event.results[index][0].transcript
      }
      setValue(transcript)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported")
      return
    }
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  const handleSendMessage = async () => {
    const promptText = value.trim()
    if ((!promptText && !selectedFile) || isLoading) return

    dispatch(setIsLoading(true))
    try {
      let isNewConv = false
      let conversation = selectedConversation

      if (!conversation) {
        isNewConv = true
        dispatch(setMessages([]))
        const conv = await createConversation()
        dispatch(addConversation(conv))
        conversation = conv
      }

      const payload = {
        prompt: promptText,
        conversationId: conversation?._id,
        agent: selectedAgent.toLowerCase(),
      }

      dispatch(addMessage({ role: "user", content: promptText || selectedFile?.name  }))
      setValue("")
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ""

      const data = await sendMessage(payload)
      if (data) {
        dispatch(setArtifacts(data.artifacts || []))
        dispatch(
          addMessage({
            role: "assistant",
            content: data?.answer,
            images: data?.images || [],
            artifacts: data?.artifacts || [],
          })
        )
      }

      const shouldUpdateTitle =
        conversation?._id &&
        (isNewConv || !conversation?.title || conversation.title === "New Chat")

      let finalConversation = conversation

      if (shouldUpdateTitle) {
        const nextTitle = (
          data?.title ||
          data?.conversation?.title ||
          promptText ||
          selectedFile?.name ||
          "New Chat"
        ).slice(0, 40)

        const updatedRes = await updateConversation({
          conversationId: conversation._id,
          title: nextTitle,
        })

        const confirmedTitle = updatedRes?.title || updatedRes?.conversation?.title || nextTitle

        dispatch(
          setconvTitle({
            conversationId: conversation._id,
            title: confirmedTitle,
          })
        )

        finalConversation = {
          ...conversation,
          title: confirmedTitle,
        }
      }

      if (isNewConv && finalConversation) {
        dispatch(setSelectedConversation(finalConversation))
      }
    } catch (error) {
      console.error(error)
    } finally {
      dispatch(setIsLoading(false))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const agents = [
    { id: "auto", icon: Zap, label: "Auto" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "coding", icon: Code2, label: "Coding" },
    { id: "pdf", icon: FileText, label: "PDF" },
    { id: "ppt", icon: Presentation, label: "PPT" },
    { id: "vision", icon: ImageIcon, label: "Vision" },
    { id: "search", icon: Globe, label: "Search" },
  ]

  const canSend = (value.trim().length > 0 || Boolean(selectedFile)) && !isLoading

  return (
    <div className="w-full shrink-0 px-3 sm:px-6 pb-4 pt-2 bg-[#07090e] select-none">
      <div className="max-w-3xl mx-auto flex flex-col gap-2.5 bg-[#0b0e15] border border-white/[0.08] focus-within:border-teal-500/40 focus-within:shadow-[0_0_24px_-6px_rgba(45,212,191,0.18)] rounded-2xl px-3.5 pt-3 pb-2.5 transition-all duration-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label
            const Icon = agent.icon
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.label)}
                className={`shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all duration-150 ${
                  isActive
                    ? "bg-teal-500/15 border-teal-400/35 text-teal-300 shadow-[0_0_12px_-3px_rgba(45,212,191,0.3)]"
                    : "bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-zinc-200"
                }`}
              >
                <Icon size={13} className={isActive ? "text-teal-300" : "text-zinc-500"} />
                {agent.label}
              </div>
            )
          })}
        </div>

        {selectedFile && (
          <div className="pt-0.5">
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-teal-500/20 bg-teal-500/[0.05] px-3 py-2">
              {selectedFile?.type === "application/pdf" ? (
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <FileText size={15} className="text-rose-400" />
                </div>
              ) : (
                selectedFile.type.startsWith("image/") && (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="preview"
                    className="h-9 w-9 rounded-lg object-cover border border-white/[0.08] shrink-0"
                  />
                )
              )}

              <div className="min-w-0 max-w-[200px]">
                <p className="text-[12px] font-medium text-zinc-100 truncate">
                  {selectedFile?.name}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {Math.max(1, Math.ceil(selectedFile.size / 1024))} KB
                </p>
              </div>

              <button
                type="button"
                className="ml-1 flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedFile(null)
                  if (fileRef.current) fileRef.current.value = ""
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        <textarea
          placeholder={listening ? "Listening..." : "Ask Lumina anything..."}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          value={value}
          disabled={isLoading}
          className="w-full bg-transparent outline-none resize-none text-[14px] text-zinc-100 placeholder:text-zinc-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50 select-text"
          rows={2}
        />

        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
          <div className="flex items-center gap-1">
            <input
              type="file"
              accept=".pdf,image/*"
              hidden
              ref={fileRef}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setSelectedFile(file)
                }
              }}
            />

            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-teal-300 hover:bg-teal-500/10 border-none transition-colors duration-150 bg-transparent cursor-pointer"
              onClick={() => fileRef.current.click()}
            >
              <Paperclip size={16} />
            </button>

            <button
              type="button"
              onClick={toggleMic}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border-none transition-all duration-150 cursor-pointer ${
                listening
                  ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40 animate-pulse"
                  : "bg-transparent text-zinc-400 hover:text-teal-300 hover:bg-teal-500/10"
              }`}
            >
              {listening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline text-[10.5px] text-zinc-600">
              Enter to send
            </span>

            <button
              type="button"
              disabled={!canSend}
              onClick={handleSendMessage}
              className={`flex items-center justify-center w-8 h-8 rounded-xl border-none transition-all duration-200 ${
                canSend
                  ? "bg-linear-to-r from-teal-400 to-cyan-400 text-zinc-950 shadow-[0_0_16px_-3px_rgba(45,212,191,0.5)] hover:brightness-110 active:scale-95 cursor-pointer"
                  : "bg-white/[0.05] text-zinc-600 cursor-not-allowed"
              }`}
            >
              <Send size={14} strokeWidth={2.3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
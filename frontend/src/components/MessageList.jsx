import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import LoadingAnimation from './LoadingAnimation'

function MessageList({ onOpenArtifact, onRegenerate }) {
  const messages = useSelector((state) => state.message?.messages) ?? []
  const isLoading = useSelector((state) => state.message?.isLoading) ?? false
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center select-none antialiased">
        <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mb-3 shadow-[0_0_20px_-4px_rgba(45,212,191,0.25)]">
          <Sparkles size={20} className="text-teal-300" />
        </div>
        <h2 className="text-[20px] font-semibold text-zinc-100">How can I help you today?</h2>
        <p className="text-[13.5px] text-zinc-500 mt-1 max-w-sm">
          Choose an agent below and send a message to start the conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 antialiased">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {messages.map((msg, idx) => {
          let previousUserPrompt = ""
          if (msg.role !== "user") {
            for (let i = idx - 1; i >= 0; i--) {
              if (messages[i]?.role === "user" && messages[i]?.content) {
                previousUserPrompt = messages[i].content
                break
              }
            }
          }

          return (
            <MessageBubble
              key={msg._id || idx}
              {...msg}
              previousUserPrompt={previousUserPrompt}
              onOpenArtifact={onOpenArtifact}
              onRegenerate={onRegenerate}
            />
          )
        })}

        {isLoading && <LoadingAnimation />}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default MessageList
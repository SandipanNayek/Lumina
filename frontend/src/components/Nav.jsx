import { MessageSquare, PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react'
import { useSelector } from 'react-redux'

function Nav({ artifactOpen, onToggleArtifact }) {
  const selectedConversation = useSelector((state) => state.conversation?.selectedConversation)
  const messages = useSelector((state) => state.message?.messages) ?? []

  return (
    <div className="w-full h-14 shrink-0 flex items-center justify-between pl-14 pr-4 lg:px-5 border-b border-white/[0.06] bg-[#07090e] text-zinc-100 select-none antialiased overflow-hidden">
      {selectedConversation ? (
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center shrink-0 w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/25">
            <MessageSquare size={13} className="text-teal-300" />
          </div>

          <div className="text-[14.5px] font-semibold text-zinc-100 tracking-tight truncate">
            {selectedConversation?.title || "New Chat"}
          </div>

          <div className="shrink-0 text-[11px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full">
            {messages.length} {messages.length === 1 ? "msg" : "msgs"}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[14px] font-medium text-zinc-500 truncate">
          <Sparkles size={14} className="text-teal-400/80 shrink-0" />
          <span className="truncate">Select or start a new conversation</span>
        </div>
      )}

      <button
        onClick={onToggleArtifact}
        title={artifactOpen ? "Close Workspace" : "Open Workspace"}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium border transition-all cursor-pointer shrink-0 ${
          artifactOpen
            ? "bg-teal-500/15 border-teal-500/30 text-teal-300"
            : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
        }`}
      >
        {artifactOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        <span className="hidden sm:inline">Workspace</span>
      </button>
    </div>
  )
}

export default Nav
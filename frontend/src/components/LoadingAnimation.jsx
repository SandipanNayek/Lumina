import { Sparkles } from 'lucide-react'

function LoadingAnimation() {
  return (
    <div className="flex items-center gap-3 antialiased">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(45,212,191,0.3)]">
        <Sparkles size={13} className="text-teal-300 animate-pulse" />
      </div>

      <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
      </div>
    </div>
  )
}

export default LoadingAnimation
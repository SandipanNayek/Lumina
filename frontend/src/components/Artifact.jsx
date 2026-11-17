import { useState } from "react"
import { Check, Code2, Copy, Download, Eye, FileCode2, Sparkles, X } from "lucide-react"
import { useSelector } from "react-redux"

function Artifact({ artifact: propArtifact, onClose }) {
  const artifacts = useSelector((state) => state.message?.artifacts) ?? []
  const artifact =
    propArtifact || (artifacts.length > 0 ? artifacts[artifacts.length - 1] : null)

  const [viewMode, setViewMode] = useState("code")
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!artifact?.content) return
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDownload = () => {
    if (!artifact?.content) return
    const ext = artifact.language || "txt"
    const fileName = `${(artifact.title || "lumina-artifact")
      .toLowerCase()
      .replace(/\s+/g, "-")}.${ext}`

    const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <aside className="fixed inset-0 z-40 lg:static lg:z-auto flex flex-col w-full lg:w-[400px] xl:w-[460px] shrink-0 h-full border-l border-white/[0.06] bg-[#07090e] text-zinc-100 select-none overflow-hidden">
      {/* Top Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#07090e]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/25 shrink-0">
            <FileCode2 size={14} className="text-teal-300" />
          </div>
          <span className="text-[13.5px] font-semibold text-zinc-100 truncate">
            {artifact?.title || "Artifact"}
          </span>
          {artifact?.language && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full shrink-0">
              {artifact.language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {artifact && (
            <>
              <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] mr-1">
                <button
                  onClick={() => setViewMode("preview")}
                  title="Preview"
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border-none ${
                    viewMode === "preview"
                      ? "bg-teal-500/20 text-teal-300"
                      : "bg-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setViewMode("code")}
                  title="Code"
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border-none ${
                    viewMode === "code"
                      ? "bg-teal-500/20 text-teal-300"
                      : "bg-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Code2 size={12} />
                  <span>Code</span>
                </button>
              </div>

              <button
                onClick={handleCopy}
                title="Copy content"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-400 hover:text-teal-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
              </button>

              <button
                onClick={handleDownload}
                title="Download file"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-400 hover:text-teal-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <Download size={14} />
              </button>
            </>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Close panel"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative">
        {artifact ? (
          viewMode === "code" ? (
            <div className="rounded-xl bg-[#0b0e15] border border-white/[0.06] p-4 overflow-x-auto select-text">
              <pre className="text-[12.5px] leading-relaxed font-mono text-zinc-200 whitespace-pre-wrap break-words m-0">
                <code>{artifact.content}</code>
              </pre>
            </div>
          ) : (
            <div className="w-full h-full rounded-xl bg-[#0b0e15] border border-white/[0.06] p-4 overflow-auto select-text text-zinc-200 text-[13.5px] leading-relaxed">
              {artifact.type === "html" ? (
                <iframe
                  title={artifact.title || "Artifact Preview"}
                  srcDoc={artifact.content}
                  sandbox="allow-scripts"
                  className="w-full h-full border-none rounded-lg bg-white"
                />
              ) : (
                <div className="whitespace-pre-wrap">{artifact.content}</div>
              )}
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 relative">
            <div className="pointer-events-none absolute w-48 h-48 bg-teal-500/[0.05] rounded-full blur-3xl" />

            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3.5 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]">
              <Sparkles size={18} className="text-teal-300" />
            </div>

            <h3 className="text-[14px] font-semibold text-zinc-200 tracking-tight">
              No Active Artifact
            </h3>
            <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed max-w-[240px]">
              Generated code snippets, documents, and live previews from Lumina will appear here.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Artifact
import { useState } from 'react'
import { Check, Copy, ExternalLink, FileCode2, Sparkles, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { setArtifacts } from '../redux/messageSlice'

const extractText = (node) => {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (node?.props?.children) return extractText(node.props.children)
  return ""
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false)

  const codeChild = Array.isArray(children) ? children[0] : children
  const className = codeChild?.props?.className || ""
  const match = /language-([^\s]+)/.exec(className)
  const language = match ? match[1] : "code"
  const codeText = extractText(codeChild?.props?.children ?? children).replace(/\n$/, "")

  const handleCopyCode = async () => {
    if (!codeText) return
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Code copy failed:", err)
    }
  }

  return (
    <div className="my-2.5 rounded-xl bg-[#0d0f14] border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[11px] font-mono text-zinc-400 lowercase">
          {language}
        </span>

        <button
          type="button"
          onClick={handleCopyCode}
          title="Copy code"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-zinc-400 hover:text-teal-300 hover:bg-white/[0.05] bg-transparent border-none cursor-pointer transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} className="text-teal-400" />
              <span className="text-teal-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-3.5 overflow-x-auto text-[12.5px] font-mono text-zinc-200 leading-relaxed m-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <code>{codeChild?.props?.children ?? children}</code>
      </pre>
    </div>
  )
}

function MessageBubble({ role, content, images = [], artifacts = [], onOpenArtifact }) {
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)
  const userData = useSelector((state) => state.user?.userData)
  const dispatch = useDispatch()

  const isUser = role === "user"
  const userImage = userData?.picture || userData?.avatar
  const safeImages = Array.isArray(images) ? images : []
  const safeArtifacts = Array.isArray(artifacts) ? artifacts : []

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const handleOpenArtifact = (artifactItem) => {
    dispatch(setArtifacts(safeArtifacts.length > 0 ? safeArtifacts : [artifactItem]))
    if (typeof onOpenArtifact === "function") {
      onOpenArtifact(artifactItem)
    }
  }

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="flex flex-col items-end gap-2 max-w-[82%] sm:max-w-[75%]">
          {safeImages.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {safeImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt="attachment"
                  className="max-h-48 rounded-xl object-cover border border-white/[0.08]"
                />
              ))}
            </div>
          )}

          {content && (
            <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-linear-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/25 text-[14px] text-zinc-100 leading-relaxed whitespace-pre-wrap break-words shadow-[0_4px_20px_-6px_rgba(45,212,191,0.15)]">
              {content}
            </div>
          )}
        </div>

        <div className="shrink-0 mt-0.5">
          {userImage && !imgError ? (
            <img
              src={userImage}
              alt="user"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-teal-500/30"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <User size={13} className="text-zinc-400" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-3">
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(45,212,191,0.3)]">
        <Sparkles size={13} className="text-teal-300" />
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {safeImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {safeImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt="generated"
                className="max-h-60 rounded-xl object-cover border border-white/[0.08]"
              />
            ))}
          </div>
        )}

        <div className="text-[14px] text-zinc-200 leading-relaxed break-words space-y-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-100">{children}</strong>
              ),
              p: ({ children }) => <p className="leading-relaxed">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1 text-zinc-200">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 space-y-1 text-zinc-200">{children}</ol>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-2 rounded-xl border border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full text-left border-collapse text-[13px]">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-white/[0.04] border-b border-white/[0.08] text-zinc-100">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-3.5 py-2.5 font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-3.5 py-2.5 border-t border-white/[0.06] align-top text-zinc-300">
                  {children}
                </td>
              ),
              pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
              code: ({ inline, className, children, ...props }) => {
                const isInline =
                  inline !== undefined
                    ? inline
                    : !className && !String(children).includes("\n")

                if (isInline) {
                  return (
                    <code
                      className="px-1.5 py-0.5 rounded bg-white/[0.07] text-teal-300 text-[12.5px] font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {content || ""}
          </ReactMarkdown>
        </div>

        {safeArtifacts.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {safeArtifacts.map((art, idx) => (
              <button
                key={art.id || idx}
                type="button"
                onClick={() => handleOpenArtifact(art)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/25 text-left transition-colors cursor-pointer"
              >
                <FileCode2 size={15} className="text-teal-300 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-zinc-100 truncate">
                    {art.title || "Generated Artifact"}
                  </div>
                  <div className="text-[10.5px] text-teal-300/80">
                    {art.type || "Click to open in Workspace"}
                  </div>
                </div>
                <ExternalLink size={12} className="text-zinc-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        )}

        {content && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={handleCopy}
              title="Copy response"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zinc-500 hover:text-teal-300 hover:bg-white/[0.04] bg-transparent border-none cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-teal-400" />
                  <span className="text-teal-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
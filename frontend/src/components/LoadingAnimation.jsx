import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"

function LoadingAnimation() {
  const Thinking_Labels = ["Thinking", "Analyzing", "Reasoning", "Generating"]
  const [labelIndex, setLabelIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % Thinking_Labels.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  const label = Thinking_Labels[labelIndex]

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:max-w-[72%] pl-1.5 sm:pl-0 py-1.5 select-none antialiased">
      <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
        {[0, 0.45, 0.9].map((delay, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-teal-400/35"
            initial={{ scale: 0.35, opacity: 0.6 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay,
              ease: "easeOut",
            }}
          />
        ))}

        <motion.span
          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-linear-to-br from-teal-300 to-cyan-400"
          style={{ boxShadow: "0 0 14px rgba(45,212,191,0.55)" }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="flex overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={label}
            className="flex"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {label.split("").map((ch, i) => (
              <motion.span
                key={i}
                className="text-[12.5px] sm:text-[13.5px] font-medium tracking-wide text-zinc-400"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.07,
                }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default LoadingAnimation
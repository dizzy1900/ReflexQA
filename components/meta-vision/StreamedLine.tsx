"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
import { useAgentStore } from "../../store/useAgentStore";
import { toneStyles, type VisionTone } from "./visionTheme";

const TOKEN_MS = 38;

interface StreamedLineProps {
  text: string;
  /** Only the newest line streams; older lines render in full and dim. */
  live: boolean;
  tone: VisionTone;
}

/** Reveals `text` one token (word or arrow) at a time, like a model streaming its output. */
export function StreamedLine({ text, live, tone }: StreamedLineProps) {
  const tokens = text.split(/(\s+)/);
  const [shown, setShown] = useState(live ? 0 : tokens.length);

  useEffect(() => {
    if (!live) {
      setShown(tokens.length);
      return;
    }
    const id = setInterval(() => {
      // 2x playback should also stream faster, and a paused run should hold its place.
      const { isPlaying, playbackSpeed } = useAgentStore.getState();
      if (!isPlaying) return;
      setShown((current) => Math.min(tokens.length, current + playbackSpeed));
    }, TOKEN_MS);
    return () => clearInterval(id);
    // `tokens` is derived from `text`, so keying the effect on `text` is sufficient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, text]);

  const streaming = live && shown < tokens.length;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: live ? 1 : 0.5, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring}
      className="font-mono text-[11px] leading-relaxed tabular-nums text-fg-muted"
    >
      {tokens.slice(0, shown).map((token, index) =>
        token === "->" ? (
          <span key={index} className={cn("transition-colors duration-300", toneStyles[tone].text)}>
            {token}
          </span>
        ) : (
          <span key={index} className={index === 0 ? "text-fg" : undefined}>
            {token}
          </span>
        ),
      )}
      {streaming ? (
        <motion.span
          className={cn("ml-0.5 inline-block h-3 w-1.5 translate-y-0.5", toneStyles[tone].solid)}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          aria-hidden
        />
      ) : null}
    </motion.li>
  );
}

"use client";

import { useReducedMotion, motion } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "../../lib/cn";
import { useAgentStore } from "../../store/useAgentStore";

const SIZE = 36;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;

/**
 * Circular run timer. The arc fills with `elapsedMs / durationMs`; the centre shows seconds left
 * while a run is live or paused, and a play glyph when there is nothing to count.
 */
export function TimerRing({ className }: { className?: string }) {
  const elapsedMs = useAgentStore((s) => s.elapsedMs);
  const durationMs = useAgentStore((s) => s.durationMs);
  const isPlaying = useAgentStore((s) => s.isPlaying);
  const reduceMotion = useReducedMotion();

  const progress = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 0;
  const counting = durationMs > 0 && progress < 1;
  const remaining = Math.ceil((durationMs - elapsedMs) / 1000);

  return (
    <span
      role="timer"
      aria-label={counting ? `${remaining} seconds remaining` : "No run in progress"}
      className={cn("relative flex shrink-0 items-center justify-center", className)}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-white/25" />
        <circle
          data-timer-arc
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
          className={cn("transition-[stroke] duration-200 ease-out", counting && !isPlaying ? "stroke-warning" : "stroke-white")}
        />
      </svg>
      {counting ? (
        <motion.span
          key={isPlaying ? "live" : "paused"}
          initial={reduceMotion ? false : { opacity: 0.4, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative font-mono text-[11px] font-semibold tabular-nums text-white"
        >
          {remaining}
        </motion.span>
      ) : (
        <Play className="relative h-3.5 w-3.5 fill-current text-white" aria-hidden />
      )}
    </span>
  );
}

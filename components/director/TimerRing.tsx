"use client";

import { cn } from "../../lib/cn";
import { useAgentStore } from "../../store/useAgentStore";

const SIZE = 14;
const STROKE = 1.5;
const RADIUS = (SIZE - STROKE) / 2;

/** Tiny progress ring for the scripted walkthrough: a hairline track that fills as the run plays. */
export function TimerRing({ className }: { className?: string }) {
  const elapsedMs = useAgentStore((s) => s.elapsedMs);
  const durationMs = useAgentStore((s) => s.durationMs);
  const isPlaying = useAgentStore((s) => s.isPlaying);

  const progress = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 0;
  const counting = durationMs > 0 && progress < 1;
  const remaining = Math.ceil((durationMs - elapsedMs) / 1000);

  return (
    <span
      role="timer"
      aria-label={counting ? `${remaining} seconds remaining` : "No run in progress"}
      className={cn("relative flex shrink-0", className)}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-white/15" />
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
          className={cn("transition-[stroke] duration-150", counting && !isPlaying ? "stroke-warning" : "stroke-fg")}
        />
      </svg>
    </span>
  );
}

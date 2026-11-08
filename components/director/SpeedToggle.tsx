"use client";

import { cn } from "../../lib/cn";
import { useAgentStore, type PlaybackSpeed } from "../../store/useAgentStore";

const SPEEDS: readonly PlaybackSpeed[] = [1, 2];

/** Flat segmented 1x / 2x control. */
export function SpeedToggle() {
  const speed = useAgentStore((s) => s.playbackSpeed);
  const setSpeed = useAgentStore((s) => s.setPlaybackSpeed);

  return (
    <span role="radiogroup" aria-label="Playback speed" className="flex rounded-md p-0.5 ring-1 ring-inset ring-card-border">
      {SPEEDS.map((option) => {
        const selected = option === speed;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${option}x speed`}
            onClick={() => setSpeed(option)}
            className={cn(
              "h-6 w-8 rounded-[4px] font-mono text-[11px] tabular-nums outline-none transition-colors duration-150 ease-out",
              "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40",
              selected ? "bg-white/[0.1] text-fg" : "text-fg-subtle hover:text-fg",
            )}
          >
            {option}x
          </button>
        );
      })}
    </span>
  );
}

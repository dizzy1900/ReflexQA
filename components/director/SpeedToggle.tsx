"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
import { useAgentStore, type PlaybackSpeed } from "../../store/useAgentStore";

const SPEEDS: readonly PlaybackSpeed[] = [1, 2];

/** Segmented 1x / 2x control. The active pill slides between options on a spring. */
export function SpeedToggle() {
  const speed = useAgentStore((s) => s.playbackSpeed);
  const setSpeed = useAgentStore((s) => s.setPlaybackSpeed);

  return (
    <span role="radiogroup" aria-label="Playback speed" className="relative flex rounded-lg bg-white/[0.04] p-0.5 ring-1 ring-inset ring-card-border">
      {SPEEDS.map((option) => {
        const selected = option === speed;
        return (
          <motion.button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${option}x speed`}
            onClick={() => setSpeed(option)}
            whileTap={{ scale: 0.93 }}
            transition={spring}
            className={cn(
              "relative h-8 w-10 rounded-md font-mono text-xs font-medium tabular-nums outline-none",
              "transition-colors duration-200 ease-out",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent/70",
              selected ? "text-white" : "text-fg-muted hover:text-fg",
            )}
          >
            {selected ? (
              <motion.span
                layoutId="dock-speed-pill"
                transition={spring}
                className="absolute inset-0 rounded-md bg-accent/80 ring-1 ring-inset ring-white/20 shadow-glow-accent"
              />
            ) : null}
            <span className="relative">{option}x</span>
          </motion.button>
        );
      })}
    </span>
  );
}

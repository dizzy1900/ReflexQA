"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
import type { BoundingBox } from "../../store/useAgentStore";
import { OcrBadge } from "./OcrBadge";
import { BOX_STATUS_LABEL, boxTone, toneStyles } from "./visionTheme";

interface BoundingReticleProps {
  box: BoundingBox;
  /** Screen pixels per target pixel. */
  scale: number;
  /** The checkout button: gets the larger reticle, center crosshair and OCR badge. */
  isTarget: boolean;
}

const CORNERS = [
  "left-0 top-0 border-l-2 border-t-2",
  "right-0 top-0 border-r-2 border-t-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
] as const;

export function BoundingReticle({ box, scale, isTarget }: BoundingReticleProps) {
  const tone = boxTone[box.status];
  const styles = toneStyles[tone];
  const evaluating = box.status === "evaluating";
  const bracket = isTarget ? "h-4 w-4" : "h-3 w-3";
  // Boxes flush with the top edge have no room for a label above or below them.
  const labelInside = box.y === 0;

  return (
    <motion.div
      // Animate only when the box itself moves; a viewport rescale must not trigger a glide.
      layout
      layoutDependency={`${box.x}:${box.y}:${box.w}:${box.h}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ layout: spring, opacity: { duration: 0.2 } }}
      data-reticle={box.id}
      data-status={box.status}
      className={cn("absolute transition-colors duration-300 ease-out", styles.text)}
      style={{ left: box.x * scale, top: box.y * scale, width: box.w * scale, height: box.h * scale }}
    >
      <motion.span
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={spring}
        className={cn(
          "absolute inset-0 rounded-[3px] ring-1 ring-inset transition-[box-shadow,background-color] duration-300 ease-out",
          styles.tint,
          styles.ring,
          styles.glow,
          evaluating && "animate-pulse",
        )}
      />

      {CORNERS.map((position) => (
        <span key={position} className={cn("absolute border-current", position, bracket)} aria-hidden />
      ))}

      {isTarget ? (
        <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2" aria-hidden>
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current opacity-80" />
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current opacity-80" />
        </span>
      ) : null}

      {evaluating ? (
        <motion.span
          className="absolute inset-x-0 h-px bg-current shadow-[0_0_8px_currentColor]"
          initial={{ top: "0%" }}
          animate={{ top: "100%" }}
          transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
          aria-hidden
        />
      ) : null}

      {/* Replays on every status change so a transition reads as an event, not a recolor. */}
      <motion.span
        key={box.status}
        initial={{ opacity: 0.7, scale: 1 }}
        animate={{ opacity: 0, scale: 1.12 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 rounded-[3px] ring-2 ring-current"
        aria-hidden
      />

      <p
        className={cn(
          "absolute flex items-center gap-1.5 whitespace-nowrap rounded bg-background/85 px-1.5 py-1 font-mono text-[10px] uppercase leading-none tracking-wider ring-1 ring-inset",
          "transition-[box-shadow,color] duration-300 ease-out",
          styles.ring,
          labelInside ? "bottom-1.5 left-2" : "left-0 top-full mt-1.5",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-300", styles.solid)} aria-hidden />
        <span className="text-fg-muted normal-case tracking-normal">{box.label}</span>
        <span>{BOX_STATUS_LABEL[box.status]}</span>
      </p>

      {isTarget ? <OcrBadge tone={tone} /> : null}
    </motion.div>
  );
}

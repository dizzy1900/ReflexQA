"use client";

import { motion } from "framer-motion";
import { ScanText } from "lucide-react";
import { cn } from "../../lib/cn";
import { springPop } from "../../lib/motion";
import { toneStyles, type VisionTone } from "./visionTheme";

/**
 * OCR reads the rendered pixels, so selector breakage does not change it. That is why it
 * is the fallback the heal relies on, and why this readout stays fixed across statuses.
 */
export const OCR_TARGET_TEXT = "Complete Reservation";
export const OCR_CONFIDENCE_PCT = 99.7;

export function OcrBadge({ tone }: { tone: VisionTone }) {
  const styles = toneStyles[tone];
  return (
    <motion.p
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4 }}
      transition={springPop}
      className={cn(
        "absolute bottom-full right-0 mb-2.5 flex items-center gap-2 whitespace-nowrap rounded-md bg-background/85 px-2.5 py-1.5",
        "font-mono text-[11px] leading-none text-fg-muted ring-1 ring-inset transition-[box-shadow,color] duration-300 ease-out",
        styles.text,
        styles.ring,
        styles.glow,
      )}
    >
      <ScanText className="h-3 w-3 shrink-0" aria-hidden />
      <span>
        <span className="text-fg-muted">Meta Vision OCR: </span>
        <span className="text-fg">&quot;{OCR_TARGET_TEXT}&quot;</span>{" "}
        <span className="tabular-nums">[{OCR_CONFIDENCE_PCT.toFixed(1)}%]</span>
      </span>
    </motion.p>
  );
}

"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { Zap } from "lucide-react";
import { advantageFactor, BREAK_EVEN_TOKENS, formatInt, formatMultiple } from "./subqModel";

/** The live headline: how much faster the linear engine is at the context depth currently on the slider. */
export function AdvantageCallout({ smooth }: { smooth: MotionValue<number> }) {
  const reduceMotion = useReducedMotion();
  const multiple = useTransform(smooth, (n) => formatMultiple(advantageFactor(n)));
  // Under the break-even size the quadratic model really is faster, so the headline would be false; swap it for the honest line.
  const winsDisplay = useTransform(smooth, (n) => (advantageFactor(n) >= 1 ? "inline" : "none"));
  const losesDisplay = useTransform(smooth, (n) => (advantageFactor(n) >= 1 ? "none" : "inline"));

  return (
    <p
      data-advantage-callout
      className="relative flex items-center gap-2 rounded-lg bg-vision-nominal/10 px-3 py-2 text-[11px] font-medium leading-snug text-vision-nominal ring-1 ring-inset ring-vision-nominal/30 shadow-glow-vision-nominal"
    >
      {reduceMotion ? null : (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-vision-nominal/70"
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        <motion.span style={{ display: winsDisplay }}>
          O(N) Subquadratic Advantage:{" "}
          <motion.span className="font-mono text-xs font-semibold tabular-nums text-white">{multiple}</motion.span> Faster than
          O(N²) Attention at this context size
        </motion.span>
        <motion.span style={{ display: losesDisplay }} data-advantage-below-break-even>
          O(N) Subquadratic Advantage starts at{" "}
          <span className="font-mono text-xs font-semibold tabular-nums text-white">{formatInt(BREAK_EVEN_TOKENS)}</span> tokens: below
          that, O(N²) attention is faster
        </motion.span>
      </span>
    </p>
  );
}

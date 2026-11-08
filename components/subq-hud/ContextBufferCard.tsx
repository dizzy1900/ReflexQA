"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";
import { Database } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Odometer } from "./Odometer";
import { clamp01, formatInt, TRACE_MAX_TOKENS } from "./subqModel";
import { useSmoothValue } from "./useSmoothValue";

export function ContextBufferCard({ tokens }: { tokens: number }) {
  const reduceMotion = useReducedMotion();
  const smooth = useSmoothValue(tokens);
  const progress = useTransform(smooth, (v) => clamp01(v / TRACE_MAX_TOKENS));
  const percent = useTransform(progress, (p) => `${(p * 100).toFixed(1)}%`);

  return (
    <GlassCard id="subq-context-buffer-title" title="Ingested Context" icon={Database} glow="emerald">
      <p className="flex items-baseline gap-1.5">
        <Odometer value={smooth} label={`${formatInt(tokens)} tokens`} className="text-2xl font-semibold text-fg" />
        <span className="text-xs text-fg-muted">Tokens</span>
      </p>

      <div className="flex flex-col gap-1.5">
        <span
          role="meter"
          aria-label="Context buffer fill"
          aria-valuemin={0}
          aria-valuemax={TRACE_MAX_TOKENS}
          aria-valuenow={tokens}
          className="relative block h-1 overflow-hidden rounded-full bg-white/15"
        >
          <motion.span
            className="absolute inset-0 origin-left rounded-full bg-fg"
            style={{ scaleX: progress }}
            transition={reduceMotion ? { duration: 0 } : undefined}
          />
        </span>
        <p className="flex items-center justify-between font-mono text-[10px] tabular-nums text-fg-subtle">
          <span>of {formatInt(TRACE_MAX_TOKENS)}</span>
          <motion.span className="text-fg">{percent}</motion.span>
        </p>
      </div>
    </GlassCard>
  );
}

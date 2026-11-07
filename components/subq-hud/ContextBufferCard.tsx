"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";
import { Database } from "lucide-react";
import { TOKENS_SURGE_TARGET, useAgentStore } from "../../store/useAgentStore";
import { GlassCard } from "./GlassCard";
import { Odometer } from "./Odometer";
import { clamp01, formatInt } from "./subqModel";
import { useSmoothValue } from "./useSmoothValue";

export function ContextBufferCard() {
  const tokens = useAgentStore((s) => s.metrics.tokensIngested);
  const reduceMotion = useReducedMotion();
  const smooth = useSmoothValue(tokens);
  const progress = useTransform(smooth, (v) => clamp01(v / TOKENS_SURGE_TARGET));
  const percent = useTransform(progress, (p) => `${(p * 100).toFixed(1)}%`);

  return (
    <GlassCard id="subq-context-buffer-title" title="Context Buffer" icon={Database} glow="emerald">
      <p className="flex items-baseline gap-1.5">
        <Odometer value={smooth} label={`${formatInt(tokens)} tokens`} className="text-2xl font-semibold text-fg" />
        <span className="text-xs text-fg-muted">Tokens</span>
      </p>

      <div className="flex flex-col gap-1.5">
        <span
          role="meter"
          aria-label="Context buffer fill"
          aria-valuemin={0}
          aria-valuemax={TOKENS_SURGE_TARGET}
          aria-valuenow={tokens}
          className="relative block h-2 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-inset ring-card-border"
        >
          <motion.span
            className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-vision-healed/70 to-success shadow-glow-success"
            style={{ scaleX: progress }}
            transition={reduceMotion ? { duration: 0 } : undefined}
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_7px,theme(colors.background)_7px_9px)] opacity-60"
          />
        </span>
        <p className="flex items-center justify-between font-mono text-[10px] tabular-nums text-fg-subtle">
          <span>of {formatInt(TOKENS_SURGE_TARGET)}</span>
          <motion.span className="text-vision-healed">{percent}</motion.span>
        </p>
      </div>
    </GlassCard>
  );
}

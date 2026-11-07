"use client";

import { motion, useTransform } from "framer-motion";
import { Timer } from "lucide-react";
import { SUBQ_PARSE_MS, useAgentStore } from "../../store/useAgentStore";
import { Badge, type BadgeTone } from "../ui/Badge";
import { GlassCard } from "./GlassCard";
import { advantageFactor, subqLatencyMs } from "./subqModel";
import { useSmoothValue } from "./useSmoothValue";

interface TraceResolutionCardProps {
  tokens: number;
  /** True while the golden demo owns the numbers; false once the benchmark slider does (or at rest). */
  demoDriven: boolean;
}

export function TraceResolutionCard({ tokens, demoDriven }: TraceResolutionCardProps) {
  const status = useAgentStore((s) => s.agentStatus);
  const snapped = useAgentStore((s) => s.hudFlashId > 0);
  const liveMs = useAgentStore((s) => s.metrics.latencyMs);

  // After the snap the live latency drifts again; the card keeps the resolution the snap achieved.
  const shownMs = useSmoothValue(demoDriven ? (snapped ? SUBQ_PARSE_MS : liveMs) : subqLatencyMs(tokens));
  const smoothTokens = useSmoothValue(tokens);
  const ms = useTransform(shownMs, (v) => Math.round(v));
  const speedup = useTransform(smoothTokens, (n) => `${Math.round(advantageFactor(n)).toLocaleString("en-US")}×`);

  const active = status !== "idle";
  const tone: BadgeTone = !active ? "neutral" : status === "subq_healing" ? "accent" : "success";

  return (
    <GlassCard id="subq-trace-resolution-title" title="Trace Resolution" icon={Timer} glow="cyan">
      <p className="flex items-baseline gap-1 font-mono tabular-nums">
        <motion.span className="text-2xl font-semibold leading-none text-fg">{ms}</motion.span>
        <span className="text-sm text-fg-muted">ms</span>
      </p>
      <div className="flex flex-col items-start gap-1.5">
        <Badge tone={tone} pulse={active} wrap>
          Subquadratic Snap: {active ? "Active" : "Idle"}
        </Badge>
        <p className="font-mono text-[10px] tabular-nums text-fg-subtle">
          <motion.span className="text-vision-nominal">{speedup}</motion.span> faster than O(N²) at this scale
        </p>
      </div>
    </GlassCard>
  );
}

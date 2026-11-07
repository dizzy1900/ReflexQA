"use client";

import { motion, useTransform } from "framer-motion";
import { CircleDollarSign } from "lucide-react";
import { Badge } from "../ui/Badge";
import { GlassCard } from "./GlassCard";
import {
  BENCHMARK_COST_REDUCTION_PERCENT,
  demoBaselineCostUsd,
  demoSnapCostUsd,
  DEMO_COST_REDUCTION_PERCENT,
  formatUsd,
  FRONTIER_USD_PER_MILLION_TOKENS,
  frontierCostUsd,
  subqCostUsd,
} from "./subqModel";
import { useSmoothValue } from "./useSmoothValue";

interface CostDeltaCardProps {
  tokens: number;
  /** True while the golden demo owns the numbers (per-heal prices); false once the benchmark slider does (per-1M-token prices). */
  demoDriven: boolean;
}

export function CostDeltaCard({ tokens, demoDriven }: CostDeltaCardProps) {
  const smooth = useSmoothValue(tokens);
  const snapCost = useTransform(smooth, (n) => formatUsd(demoDriven ? demoSnapCostUsd(n) : subqCostUsd(n)));
  const baselineCost = useTransform(smooth, (n) => formatUsd(demoDriven ? demoBaselineCostUsd(n) : frontierCostUsd(n)));

  return (
    <GlassCard id="subq-cost-delta-title" title="Cost Delta" icon={CircleDollarSign} glow="success">
      <motion.p className="font-mono text-2xl font-semibold leading-none tabular-nums text-fg">{snapCost}</motion.p>
      <div className="flex flex-col items-start gap-1.5">
        <Badge tone="success">{(demoDriven ? DEMO_COST_REDUCTION_PERCENT : BENCHMARK_COST_REDUCTION_PERCENT).toFixed(1)}% Cost Reduction</Badge>
        <p className="font-mono text-[10px] tabular-nums text-fg-subtle">
          vs <motion.span className="text-fg-muted line-through decoration-danger/60">{baselineCost}</motion.span>{" "}
          {demoDriven ? "GPT-4o 128k input" : `Frontier at $${FRONTIER_USD_PER_MILLION_TOKENS.toFixed(2)} / 1M`}
        </p>
      </div>
    </GlassCard>
  );
}

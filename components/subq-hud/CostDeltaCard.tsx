"use client";

import { motion, useTransform } from "framer-motion";
import { CircleDollarSign } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { GlassCard } from "./GlassCard";
import { baselineCostUsd, COST_REDUCTION_PERCENT, formatUsd, snapCostUsd } from "./subqModel";
import { useSmoothValue } from "./useSmoothValue";

export function CostDeltaCard() {
  const tokens = useAgentStore((s) => s.metrics.tokensIngested);
  const smooth = useSmoothValue(tokens);
  const snapCost = useTransform(smooth, (n) => formatUsd(snapCostUsd(n)));
  const baselineCost = useTransform(smooth, (n) => formatUsd(baselineCostUsd(n)));

  return (
    <GlassCard id="subq-cost-delta-title" title="Cost Delta" icon={CircleDollarSign} glow="success">
      <motion.p className="font-mono text-2xl font-semibold leading-none tabular-nums text-fg">{snapCost}</motion.p>
      <div className="flex flex-col items-start gap-1.5">
        <Badge tone="success">{COST_REDUCTION_PERCENT.toFixed(1)}% Cost Reduction</Badge>
        <p className="font-mono text-[10px] tabular-nums text-fg-subtle">
          vs <motion.span className="text-fg-muted line-through decoration-danger/60">{baselineCost}</motion.span> GPT-4o 128k input
        </p>
      </div>
    </GlassCard>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "../../lib/cn";
import { useAgentStore } from "../../store/useAgentStore";
import { Card } from "../ui/Card";
import { ComplexityChart } from "./ComplexityChart";
import { ContextBufferCard } from "./ContextBufferCard";
import { CostDeltaCard } from "./CostDeltaCard";
import { IngestionTree } from "./IngestionTree";
import { LessonsList } from "./LessonsList";
import { LiveJudgeCard } from "./LiveJudgeCard";
import { RsiChart } from "./RsiChart";
import { TRACE_DEFAULT_TOKENS } from "./subqModel";
import { TraceResolutionCard } from "./TraceResolutionCard";

/**
 * Why Subquadratic wins on massive traces: whole-repo context at linear cost, against
 * quadratic attention that cannot afford to read it. Driven entirely by `useAgentStore`.
 */
export function SubquadraticHud({ className, showHeader = true }: { className?: string; showHeader?: boolean }) {
  const flashId = useAgentStore((s) => s.hudFlashId);
  const status = useAgentStore((s) => s.agentStatus);
  const liveTokens = useAgentStore((s) => s.metrics.tokensIngested);
  const reduceMotion = useReducedMotion();
  const live = useAgentStore((s) => s.mode === "live");

  /** Context depth picked on the slider; null means the HUD follows the demo (or the default trace at rest). */
  const [picked, setPicked] = useState<number | null>(null);
  // Whenever the demo advances it takes the numbers back, so the story never plays against a stale slider.
  useEffect(() => setPicked(null), [status]);

  const demoDriven = picked === null && status !== "idle";
  const tokens = picked ?? (status === "idle" ? TRACE_DEFAULT_TOKENS : liveTokens);

  return (
    <Card aria-labelledby="subq-hud-title" className={cn("relative flex flex-col gap-2.5 overflow-hidden p-3", className)}>
      {showHeader ? (
        <header className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-vision-nominal" aria-hidden />
          <h2 id="subq-hud-title" className="text-sm font-medium text-fg">
            Subquadratic Snap
          </h2>
          <p className="text-xs text-fg-subtle">Whole-trace memory at linear cost</p>
        </header>
      ) : (
        <h2 id="subq-hud-title" className="sr-only">
          Subquadratic Snap
        </h2>
      )}

      {live ? (
        <>
          <LiveJudgeCard />
          <RsiChart />
          <LessonsList />
        </>
      ) : null}

      {/* auto-fit keeps three-up whenever the column is wide enough and wraps cleanly when it is not. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-3">
        <ContextBufferCard tokens={tokens} />
        <TraceResolutionCard tokens={tokens} demoDriven={demoDriven} />
        <CostDeltaCard tokens={tokens} demoDriven={demoDriven} />
      </div>

      <ComplexityChart
        tokens={tokens}
        onTokensChange={setPicked}
        onReset={picked === null ? undefined : () => setPicked(null)}
      />
      <IngestionTree />

      {flashId > 0 && !reduceMotion ? (
        <motion.span
          key={flashId}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-vision-nominal/70 shadow-glow-vision-nominal"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, times: [0, 0.2, 1], ease: "easeOut" }}
        />
      ) : null}
    </Card>
  );
}

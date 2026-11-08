"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { useAgentStore } from "../../store/useAgentStore";
import { Card } from "../ui/Card";

const ease = { duration: 0.35, ease: "easeOut" } as const;

function Row({ label, p, strong }: { label: string; p: number; strong?: boolean }) {
  return (
    <li className="grid grid-cols-[8.5rem_1fr_3.25rem] items-center gap-3">
      <span className={cn("truncate text-xs", strong ? "text-fg" : "text-fg-muted")}>{label}</span>
      <span className="relative h-1 overflow-hidden rounded-full bg-white/10">
        <motion.span
          className={cn("absolute inset-y-0 left-0 rounded-full", strong ? "bg-fg" : "bg-white/30")}
          initial={false}
          animate={{ width: `${Math.max(0.5, p * 100)}%` }}
          transition={ease}
        />
      </span>
      <span className={cn("text-right font-mono text-xs tabular-nums", strong ? "text-fg" : "text-fg-subtle")}>
        {(p * 100).toFixed(1)}%
      </span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-3 first:pl-0">
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="font-mono text-sm tabular-nums text-fg">{value}</dd>
    </div>
  );
}

/** SubQ Snap's latest decision: real probabilities returned by /v1/systemone. */
export function LiveJudgeCard() {
  const verdict = useAgentStore((s) => s.liveVerdict);
  const model = useAgentStore((s) => s.liveModels?.subq ?? "subq-snap-1.1");
  const step = useAgentStore((s) => s.liveStep);
  const gen = useAgentStore((s) => s.liveGeneration);
  const spend = useAgentStore((s) => s.liveCostUsd);

  const routes = verdict ? Object.entries(verdict.route.probabilities).sort((a, b) => b[1] - a[1]) : [];

  return (
    <Card aria-labelledby="live-judge-title" className="flex flex-col gap-4 p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3 id="live-judge-title" className="text-[13px] font-medium text-fg">
          Judge <span className="ml-1 font-mono text-xs font-normal text-fg-subtle">{model}</span>
        </h3>
        <span className="font-mono text-xs tabular-nums text-fg-subtle">
          gen {gen} · step {step}
        </span>
      </header>

      {verdict ? (
        <>
          <ul className="flex flex-col gap-2.5">
            <Row label="Step succeeded" p={verdict.progressed} strong />
            <Row label="All steps done" p={verdict.goalReached} strong />
          </ul>
          <section aria-label="Route next step" className="flex flex-col gap-2 border-t border-card-border pt-3">
            <p className="text-xs text-fg-subtle">Next step</p>
            <ul className="flex flex-col gap-2">
              {routes.map(([name, p]) => (
                <Row key={name} label={name.replace(/_/g, " ")} p={p} strong={name === verdict.route.choice} />
              ))}
            </ul>
          </section>
          <dl className="grid grid-cols-4 divide-x divide-card-border border-t border-card-border pt-3">
            <Stat label="Latency" value={`${verdict.latencyMs}ms`} />
            <Stat label="Context" value={verdict.inputTokens.toLocaleString("en-US")} />
            <Stat label="Call cost" value={`$${verdict.costUsd.toFixed(4)}`} />
            <Stat label="Run spend" value={`$${spend.toFixed(3)}`} />
          </dl>
        </>
      ) : (
        <p className="text-[13px] text-fg-subtle">Waiting for the first verdict…</p>
      )}
    </Card>
  );
}

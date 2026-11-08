"use client";

import { motion } from "framer-motion";
import { Gavel } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
import { useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

function Bar({ label, p, highlight, tone }: { label: string; p: number; highlight?: boolean; tone: "accent" | "success" | "danger" | "neutral" }) {
  const fill = { accent: "bg-accent", success: "bg-success", danger: "bg-danger", neutral: "bg-white/25" }[tone];
  return (
    <li className="flex items-center gap-2 text-[11px]">
      <span className={cn("w-32 shrink-0 truncate font-mono", highlight ? "text-fg" : "text-fg-subtle")}>{label}</span>
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.span
          className={cn("absolute inset-y-0 left-0 rounded-full", fill, highlight && "shadow-glow-accent")}
          initial={false}
          animate={{ width: `${Math.max(1, p * 100)}%` }}
          transition={spring}
        />
      </span>
      <span className={cn("w-11 text-right font-mono tabular-nums", highlight ? "text-fg" : "text-fg-muted")}>{(p * 100).toFixed(1)}%</span>
    </li>
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
    <Card aria-labelledby="live-judge-title" className="flex flex-col gap-2.5 p-3">
      <header className="flex items-center justify-between gap-2">
        <h3 id="live-judge-title" className="flex items-center gap-2 text-xs font-medium text-fg">
          <Gavel className="h-3.5 w-3.5 text-vision-nominal" aria-hidden />
          SubQ Judge · <span className="font-mono text-fg-muted">{model}</span>
        </h3>
        <Badge tone={verdict ? "info" : "neutral"} pulse={!verdict}>
          <span className="font-mono tabular-nums">
            G{gen} · S{step}
          </span>
        </Badge>
      </header>

      {verdict ? (
        <>
          <ul className="flex flex-col gap-1.5">
            <Bar label="action progressed?" p={verdict.progressed} tone={verdict.progressed >= 0.5 ? "success" : "danger"} highlight />
            <Bar label="goal reached?" p={verdict.goalReached} tone={verdict.goalReached >= 0.5 ? "success" : "neutral"} highlight />
          </ul>
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Route next step</p>
          <ul className="flex flex-col gap-1.5">
            {routes.map(([name, p]) => (
              <Bar key={name} label={name} p={p} tone={name === verdict.route.choice ? "accent" : "neutral"} highlight={name === verdict.route.choice} />
            ))}
          </ul>
          <dl className="grid grid-cols-4 gap-2 border-t border-white/[0.06] pt-2 text-[10px] text-fg-subtle">
            <div>
              <dt>Latency</dt>
              <dd className="font-mono text-xs tabular-nums text-fg">{verdict.latencyMs}ms</dd>
            </div>
            <div>
              <dt>Context</dt>
              <dd className="font-mono text-xs tabular-nums text-fg">{verdict.inputTokens.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt>Call cost</dt>
              <dd className="font-mono text-xs tabular-nums text-fg">${verdict.costUsd.toFixed(5)}</dd>
            </div>
            <div>
              <dt>Run spend</dt>
              <dd className="font-mono text-xs tabular-nums text-fg">${spend.toFixed(4)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-xs text-fg-subtle">Waiting for the first verdict…</p>
      )}
    </Card>
  );
}

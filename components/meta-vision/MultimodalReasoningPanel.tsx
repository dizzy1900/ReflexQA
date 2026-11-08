"use client";

import { AnimatePresence } from "framer-motion";
import { AudioWaveform } from "lucide-react";
import { cn } from "../../lib/cn";
import { useAgentStore, type AgentStatus } from "../../store/useAgentStore";
import { Badge, type BadgeTone } from "../ui/Badge";
import { Card } from "../ui/Card";
import { StreamedLine } from "./StreamedLine";
import { useVisionStream } from "./useVisionStream";
import { agentTone } from "./visionTheme";
import { Waveform } from "./Waveform";

const STATUS_BADGE: Record<AgentStatus, { label: string; tone: BadgeTone; pulse: boolean }> = {
  idle: { label: "Standby", tone: "neutral", pulse: false },
  observing: { label: "Observing", tone: "info", pulse: true },
  analyzing: { label: "Analyzing", tone: "accent", pulse: true },
  action_attempted: { label: "Grounded", tone: "accent", pulse: true },
  regression_tripped: { label: "Regression", tone: "danger", pulse: true },
  subq_healing: { label: "Healing", tone: "warning", pulse: true },
  healed_execution: { label: "Re-grounded", tone: "success", pulse: true },
  success: { label: "Verified", tone: "success", pulse: false },
};

/** Fixed height so the card does not jump as lines stream in and age out. */
const STREAM_HEIGHT = "h-[7.5rem]";

export function MultimodalReasoningPanel({ className }: { className?: string }) {
  const status = useAgentStore((s) => s.agentStatus);
  const lines = useVisionStream();
  const tone = agentTone(status);
  const badge = STATUS_BADGE[status];
  const live = useAgentStore((s) => s.mode === "live");
  const action = useAgentStore((s) => s.liveAction);

  return (
    <Card aria-labelledby="multimodal-reasoning-title" className={cn("flex flex-col gap-3 p-4", className)}>
      <header className="flex items-center justify-between gap-3">
        <h2 id="multimodal-reasoning-title" className="flex items-center gap-2 text-sm font-medium text-fg">
          <AudioWaveform className="h-4 w-4 text-fg-muted" aria-hidden />
          Multimodal Reasoning
        </h2>
        <Badge tone={badge.tone} pulse={badge.pulse}>
          {badge.label}
        </Badge>
      </header>

      <Waveform tone={tone} className="rounded-lg bg-background/60 ring-1 ring-inset ring-card-border" />

      {live ? (
        <section aria-label="Meta Muse Spark reasoning" className={cn("flex flex-col gap-1.5 overflow-y-auto text-xs", STREAM_HEIGHT)}>
          {action ? (
            <>
              <p className="font-mono text-[11px] tabular-nums text-accent">
                {action.kind === "click" ? `click(${action.x}, ${action.y})` : "done()"} → {action.target}
              </p>
              <p className="leading-relaxed text-fg-muted">{action.reasoning}</p>
            </>
          ) : (
            <p className="text-fg-subtle">Muse Spark is reading the screenshot…</p>
          )}
        </section>
      ) : (
        <ol role="log" aria-label="Vision token stream" className={cn("flex flex-col justify-end gap-1.5 overflow-hidden", STREAM_HEIGHT)}>
          <AnimatePresence initial={false}>
            {lines.map((line, index) => (
              <StreamedLine key={line.id} text={line.text} live={index === lines.length - 1} tone={tone} />
            ))}
          </AnimatePresence>
        </ol>
      )}
    </Card>
  );
}

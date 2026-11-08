"use client";

import { cn } from "../../lib/cn";
import { useAgentStore, type AgentStatus } from "../../store/useAgentStore";

function healthFor(status: AgentStatus): { label: string; dot: string } {
  if (status === "regression_tripped") return { label: "Regression", dot: "bg-danger" };
  if (status === "subq_healing") return { label: "Healing", dot: "bg-warning" };
  return { label: "Operational", dot: "bg-success" };
}

/** Quiet status line: a dot and a word. */
export function SystemHealth() {
  const status = useAgentStore((s) => s.agentStatus);
  const health = healthFor(status);

  return (
    <p role="status" aria-label="System health" className="hidden items-center gap-1.5 text-xs text-fg-muted md:flex">
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-150", health.dot)} />
      {health.label}
    </p>
  );
}

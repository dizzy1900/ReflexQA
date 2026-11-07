"use client";

import { HeartPulse } from "lucide-react";
import { useAgentStore, type AgentStatus } from "../../store/useAgentStore";
import { Badge, type BadgeTone } from "../ui/Badge";

interface Health {
  label: string;
  tone: BadgeTone;
}

const NOMINAL: Health = { label: "ALL ENGINES NOMINAL", tone: "success" };

function healthFor(status: AgentStatus): Health {
  if (status === "regression_tripped") return { label: "REGRESSION DETECTED", tone: "danger" };
  if (status === "subq_healing") return { label: "SELF-HEALING", tone: "warning" };
  return NOMINAL;
}

/** Goes red when the target regresses and amber while Subquadratic heals it, then returns to nominal. */
export function SystemHealth() {
  const status = useAgentStore((s) => s.agentStatus);
  const health = healthFor(status);

  return (
    <p role="status" aria-label="System health" className="flex">
      <Badge tone={health.tone} pulse className="font-mono tracking-wider">
        <HeartPulse className="h-3 w-3" aria-hidden />
        {health.label}
      </Badge>
    </p>
  );
}

"use client";

import { useAgentStore, type AgentStatus } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";

/** Statuses in which Meta's vision model is the engine doing the work. */
const META_ACTIVE: ReadonlySet<AgentStatus> = new Set(["observing", "analyzing", "action_attempted", "healed_execution"]);

/** The two sponsor engines. Each pulses while the agent is actually using it. */
export function SponsorTags() {
  const status = useAgentStore((s) => s.agentStatus);

  return (
    <ul aria-label="Powered by" className="flex items-center gap-2">
      <li className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-fg-subtle xl:block">Powered by</li>
      <li>
        <Badge tone="info" pulse={META_ACTIVE.has(status)}>
          Meta Model API
        </Badge>
      </li>
      <li>
        <Badge tone="accent" pulse={status === "subq_healing"}>
          Subquadratic Snap
        </Badge>
      </li>
    </ul>
  );
}

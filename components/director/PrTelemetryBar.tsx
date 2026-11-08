"use client";

import { ScanEye, Zap } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { GROUNDING_POINT, TELEMETRY } from "./prContent";

/** The two engines' receipts for this patch. In live mode every number comes from the real run. */
export function PrTelemetryBar() {
  const live = useAgentStore((s) => s.mode === "live");
  const verdict = useAgentStore((s) => s.liveVerdict);
  const action = useAgentStore((s) => s.liveAction);
  const runCost = useAgentStore((s) => s.liveCostUsd);
  const episodes = useAgentStore((s) => s.episodes);

  const useLive = live && verdict !== null;
  const tokens = useLive ? verdict.inputTokens.toLocaleString("en-US") : TELEMETRY.tokens;
  const ms = useLive ? verdict.latencyMs : TELEMETRY.ms;
  const cost = useLive ? `$${runCost.toFixed(4)} whole run` : TELEMETRY.cost;
  const point = useLive && action ? { x: action.x, y: action.y } : GROUNDING_POINT;
  const metaCalls = episodes.reduce((n, e) => n + (e.metaCalls ?? 0), 0);

  return (
    <footer aria-label="Telemetry" className="border-t border-card-border bg-background/70 px-5 py-3">
      <ul className="flex flex-col gap-1.5 font-mono text-[11px] leading-snug text-fg-muted">
        <li className="flex items-start gap-2">
          <Zap className="mt-px h-3.5 w-3.5 shrink-0 text-vision-nominal" aria-hidden />
          <span>
            SubQ Snap Judge: <span className="tabular-nums text-fg">{tokens}</span> tokens (codebase + memory + 2 frames) in{" "}
            <span className="tabular-nums text-vision-nominal">{ms}ms</span>{" "}
            <span className="tabular-nums text-ansi-green">({cost})</span>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ScanEye className="mt-px h-3.5 w-3.5 shrink-0 text-ansi-magenta" aria-hidden />
          <span>
            Meta Muse Spark Driver: final click at{" "}
            <span className="tabular-nums text-fg">
              [{point.x}, {point.y}]
            </span>
            {useLive ? (
              <>
                {" · "}
                <span className="tabular-nums text-fg">{metaCalls}</span> Driver calls across{" "}
                <span className="tabular-nums text-fg">{episodes.length}</span> generations
              </>
            ) : null}
          </span>
        </li>
      </ul>
    </footer>
  );
}

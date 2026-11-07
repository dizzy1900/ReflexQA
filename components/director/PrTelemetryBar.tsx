"use client";

import { ScanEye, Zap } from "lucide-react";
import { GROUNDING_POINT, TELEMETRY } from "./prContent";

/** The two engines' receipts for this patch: what Subquadratic searched and where Meta Vision grounded the tag. */
export function PrTelemetryBar() {
  return (
    <footer aria-label="Telemetry" className="border-t border-card-border bg-background/70 px-5 py-3">
      <ul className="flex flex-col gap-1.5 font-mono text-[11px] leading-snug text-fg-muted">
        <li className="flex items-start gap-2">
          <Zap className="mt-px h-3.5 w-3.5 shrink-0 text-vision-nominal" aria-hidden />
          <span>
            Subquadratic Context Search: <span className="tabular-nums text-fg">{TELEMETRY.tokens}</span> tokens scanned in{" "}
            <span className="tabular-nums text-vision-nominal">{TELEMETRY.ms}ms</span>{" "}
            <span className="tabular-nums text-ansi-green">({TELEMETRY.cost})</span>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ScanEye className="mt-px h-3.5 w-3.5 shrink-0 text-ansi-magenta" aria-hidden />
          <span>
            Meta Vision Optical Grounding: Tag matched at{" "}
            <span className="tabular-nums text-fg">
              [{GROUNDING_POINT.x}, {GROUNDING_POINT.y}]
            </span>
          </span>
        </li>
      </ul>
    </footer>
  );
}

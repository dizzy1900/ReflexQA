"use client";

import type { ReactNode } from "react";
import { Crosshair } from "lucide-react";
import { cn } from "../../lib/cn";
import { CHECKOUT_SELECTOR, TARGET_BOX_ID, useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

function Row({ label, children, tone = "default" }: { label: string; children: ReactNode; tone?: "default" | "bad" | "vision" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-card-border py-1.5 last:border-b-0">
      <dt className="text-[11px] text-fg-subtle">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right font-mono text-xs tabular-nums transition-colors duration-200 ease-out",
          tone === "bad" ? "text-danger" : tone === "vision" ? "text-vision-nominal" : "text-fg",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * What the DOM actually does, next to what the agent believes. When they disagree the click
 * misses, which is the regression the rest of the dashboard reacts to.
 */
export function TargetInspector({ className }: { className?: string }) {
  const target = useAgentStore((s) => s.targetElement);
  const belief = useAgentStore((s) => s.boundingBoxes.find((b) => b.id === TARGET_BOX_ID));

  const selectorDrifted = target.selector !== CHECKOUT_SELECTOR;
  const driftPx = belief ? Math.abs(Math.round(target.x - belief.x)) : 0;
  const drifted = selectorDrifted || target.obstruction !== null || driftPx > 0;

  return (
    <Card aria-labelledby="target-inspector-title" className={cn("p-3.5", className)}>
      <header className="mb-1 flex items-center justify-between gap-3">
        <h3 id="target-inspector-title" className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
          <Crosshair className="h-3.5 w-3.5" aria-hidden />
          DOM Ground Truth
        </h3>
        <Badge tone={drifted ? "danger" : "success"} pulse={drifted}>
          {drifted ? "Drift detected" : "In sync"}
        </Badge>
      </header>

      <dl>
        <Row label="Selector" tone={selectorDrifted ? "bad" : "default"}>
          {target.selector}
        </Row>
        <Row label="Rect (x, y · w × h)">
          {Math.round(target.x)}, {Math.round(target.y)} · {target.w} × {target.h}
        </Row>
        <Row label="Action bar" tone={target.layoutReversed ? "bad" : "default"}>
          {target.layoutReversed ? "row-reverse" : "row"}
        </Row>
        <Row label="Obstruction" tone={target.obstruction ? "bad" : "default"}>
          {target.obstruction ? target.obstruction.label : "none"}
        </Row>
        <Row label="Vision belief" tone="vision">
          {belief ? `${Math.round(belief.x)}, ${Math.round(belief.y)}` : "—"}
          {driftPx > 0 ? ` (Δ ${driftPx}px)` : ""}
        </Row>
      </dl>
    </Card>
  );
}

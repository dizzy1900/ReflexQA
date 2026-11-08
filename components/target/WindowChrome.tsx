"use client";

import { Lock } from "lucide-react";
import { Badge } from "../ui/Badge";

const TRAFFIC_LIGHTS = ["close", "minimise", "zoom"] as const;

export function WindowChrome() {
  return (
    <header className="grid h-11 grid-cols-[1fr_minmax(0,28rem)_1fr] items-center gap-4 border-b border-card-border bg-card px-4">
      <span className="flex items-center gap-2" aria-hidden>
        {TRAFFIC_LIGHTS.map((color) => (
          <span key={color} className={`h-3 w-3 rounded-full bg-white/15`} />
        ))}
      </span>

      <p
        className="mx-auto flex w-full min-w-0 items-center justify-center gap-2 rounded-md bg-background/70 px-3 py-1.5 ring-1 ring-inset ring-card-border transition-[box-shadow] duration-200 ease-out hover:ring-card-border-hover"
        title="https://app.hyperscale.ai/checkout/v2"
      >
        <Lock className="h-3 w-3 shrink-0 text-fg-subtle" aria-hidden />
        <span className="truncate font-mono text-xs text-fg-muted">
          app.hyperscale.ai<span className="text-fg">/checkout/v2</span>
        </span>
      </p>

      <span className="flex justify-end">
        <Badge tone="neutral">
          Sandbox
        </Badge>
      </span>
    </header>
  );
}

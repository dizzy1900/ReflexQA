"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../lib/cn";

export type GlassGlow = "emerald" | "cyan" | "success";

const GLOW: Record<GlassGlow, string> = {
  emerald: "hover:shadow-glow-vision-healed",
  cyan: "hover:shadow-glow-vision-nominal",
  success: "hover:shadow-glow-success",
};

interface GlassCardProps {
  id: string;
  title: string;
  icon: LucideIcon;
  glow: GlassGlow;
  /** Right-aligned header slot, usually a status badge. */
  aside?: ReactNode;
  children: ReactNode;
}

/** KPI shell: a flat card with a hairline ring. */
export function GlassCard({ id, title, icon: Icon, glow, aside, children }: GlassCardProps) {
  return (
    <Card
      interactive
      aria-labelledby={id}
      className={cn(
        "relative flex min-w-0 flex-col gap-3 overflow-hidden p-3",
                GLOW[glow],
      )}
    >
      <header className="flex min-h-[1.25rem] items-center justify-between gap-2">
        <h3 id={id} className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </Card>
  );
}

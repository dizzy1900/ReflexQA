"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { fadeUp } from "../../lib/motion";

interface HudPanelProps {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Right-aligned header slot. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A recessed section inside the HUD card: one step darker than the card so charts and trees read as wells. */
export function HudPanel({ id, title, icon: Icon, aside, className, children }: HudPanelProps) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      aria-labelledby={id}
      className={cn("flex flex-col gap-3 rounded-lg bg-background/60 p-3 ring-1 ring-inset ring-card-border", className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3 id={id} className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </motion.section>
  );
}

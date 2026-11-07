"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { springPop } from "../../lib/motion";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-white/[0.04] text-fg-muted ring-card-border", dot: "bg-fg-subtle" },
  success: { badge: "bg-success/10 text-success ring-success/30 shadow-glow-success", dot: "bg-success" },
  warning: { badge: "bg-warning/10 text-warning ring-warning/30 shadow-glow-warning", dot: "bg-warning" },
  danger: { badge: "bg-danger/10 text-danger ring-danger/30 shadow-glow-danger", dot: "bg-danger" },
  info: { badge: "bg-info/10 text-info ring-info/30 shadow-glow-info", dot: "bg-info" },
  accent: { badge: "bg-accent/10 text-accent-hover ring-accent/30 shadow-glow-accent", dot: "bg-accent" },
};

interface BadgeProps {
  tone?: BadgeTone;
  /** Shows a softly pulsing status dot. */
  pulse?: boolean;
  /** Lets long labels wrap inside narrow containers instead of overflowing. */
  wrap?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", pulse = false, wrap = false, children, className }: BadgeProps) {
  const t = tones[tone];
  return (
    // Keyed on tone so a status change replays the spring pop instead of swapping silently.
    <motion.span
      key={tone}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springPop}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
        wrap ? "max-w-full rounded-2xl text-left leading-tight" : "whitespace-nowrap rounded-full leading-none",
        "transition-[background-color,color,box-shadow] duration-200 ease-out",
        t.badge,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        {pulse ? (
          <motion.span
            className={cn("absolute inline-flex h-full w-full rounded-full", t.dot)}
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", t.dot)} />
      </span>
      {children}
    </motion.span>
  );
}

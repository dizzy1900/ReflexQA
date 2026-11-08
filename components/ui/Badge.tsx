"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent" | "purple";

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  neutral: { badge: "text-fg-muted", dot: "bg-fg-subtle" },
  success: { badge: "text-fg", dot: "bg-success" },
  warning: { badge: "text-fg", dot: "bg-warning" },
  danger: { badge: "text-fg", dot: "bg-danger" },
  info: { badge: "text-fg-muted", dot: "bg-fg-muted" },
  accent: { badge: "text-fg", dot: "bg-fg" },
  purple: { badge: "text-fg-muted", dot: "bg-fg-muted" },
};

interface BadgeProps {
  tone?: BadgeTone;
  /** Kept for API compatibility; dots never animate. */
  pulse?: boolean;
  /** Lets long labels wrap inside narrow containers instead of overflowing. */
  wrap?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", wrap = false, children, className }: BadgeProps) {
  const t = tones[tone];
  return (
    // Keyed on tone so a status change replays the spring pop instead of swapping silently.
    <motion.span
      key={tone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 bg-transparent px-2 text-xs font-normal ring-1 ring-inset ring-card-border",
        wrap ? "max-w-full rounded-md text-left leading-tight" : "whitespace-nowrap rounded-full leading-none",
        "transition-[background-color,color,box-shadow] duration-200 ease-out",
        t.badge,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        {/* `pulse` is accepted for API compatibility; status dots stay still. */}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", t.dot)} />
      </span>
      {children}
    </motion.span>
  );
}

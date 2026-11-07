"use client";

import { cn } from "../../lib/cn";

interface KbdProps {
  /** Key label, rendered in brackets like `[G]`. */
  children: string;
  /** Lights up while the key is held, so the presenter sees the shortcut land. */
  pressed?: boolean;
  /** `onAccent` for keys sitting on a bright, filled button. */
  tone?: "default" | "onAccent";
  className?: string;
}

export function Kbd({ children, pressed = false, tone = "default", className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded px-1 font-mono text-[10px] font-medium leading-4 ring-1 ring-inset",
        "transition-[background-color,color,box-shadow] duration-150 ease-out",
        pressed
          ? "bg-white/25 text-white ring-white/50 shadow-glow-accent"
          : tone === "onAccent"
            ? "bg-black/25 text-white ring-white/30"
            : "bg-white/[0.06] text-fg-muted ring-card-border-hover",
        className,
      )}
    >
      [{children}]
    </kbd>
  );
}

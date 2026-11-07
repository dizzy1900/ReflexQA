"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

interface IngestionTreeNodeProps {
  icon: LucideIcon;
  children: ReactNode;
  /** True once the Subquadratic pass has reached the repo. The light reaches this node after `delaySec`. */
  reconciled: boolean;
  /** Increments on every pass so the flash replays. 0 means no pass yet. */
  passId: number;
  delaySec: number;
  queuedLabel: string;
  doneLabel: string;
  /** Draws the elbow connector from the parent's rail to this node. */
  branch?: boolean;
  className?: string;
}

// The delay is applied only on the way in, so a reset clears the tree at once.
const delayStyle = (reconciled: boolean, delaySec: number) => ({ transitionDelay: reconciled ? `${delaySec}s` : "0s" });

export function IngestionTreeNode({
  icon: Icon,
  children,
  reconciled,
  passId,
  delaySec,
  queuedLabel,
  doneLabel,
  branch = false,
  className,
}: IngestionTreeNodeProps) {
  const reduceMotion = useReducedMotion();
  const style = delayStyle(reconciled, delaySec);

  return (
    <li className={cn("relative", className)}>
      {branch ? (
        <>
          <span
            aria-hidden
            style={style}
            className={cn(
              "absolute -left-5 -top-1.5 h-[calc(50%+0.375rem)] w-px transition-colors duration-300 ease-out motion-reduce:transition-none",
              reconciled ? "bg-vision-healed shadow-glow-success" : "bg-white/10",
            )}
          />
          <span
            aria-hidden
            style={style}
            className={cn(
              "absolute -left-5 top-1/2 h-px w-5 transition-colors duration-300 ease-out motion-reduce:transition-none",
              reconciled ? "bg-vision-healed shadow-glow-success" : "bg-white/10",
            )}
          />
        </>
      ) : null}

      <p
        data-node-state={reconciled ? "reconciled" : "queued"}
        style={style}
        className={cn(
          "relative flex items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-1.5 ring-1 ring-inset",
          "transition-[background-color,box-shadow,--tw-ring-color] duration-300 ease-out motion-reduce:transition-none",
          reconciled
            ? "bg-vision-healed/[0.07] ring-vision-healed/30 shadow-glow-vision-healed"
            : "bg-white/[0.02] ring-card-border",
        )}
      >
        {passId > 0 && !reduceMotion ? (
          <motion.span
            key={passId}
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-vision-healed/35 to-transparent"
            initial={{ opacity: 0, x: "-60%" }}
            animate={{ opacity: [0, 1, 0], x: ["-60%", "0%", "60%"] }}
            transition={{ duration: 0.6, delay: delaySec, times: [0, 0.4, 1], ease: "easeOut" }}
          />
        ) : null}

        <span
          aria-hidden
          style={style}
          className={cn(
            "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors duration-300 ease-out motion-reduce:transition-none",
            reconciled ? "bg-vision-healed/10 text-vision-healed ring-vision-healed/30" : "bg-white/[0.03] text-fg-subtle ring-card-border",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <span className="relative min-w-0 flex-1 break-words font-mono text-xs leading-snug">{children}</span>

        <span className="relative flex h-5 min-w-[4.75rem] shrink-0 items-center justify-end font-mono text-[10px] uppercase tracking-wide">
          <span
            style={style}
            className={cn(
              "absolute right-0 text-fg-subtle transition-opacity duration-200 ease-out motion-reduce:transition-none",
              reconciled ? "opacity-0" : "opacity-100",
            )}
          >
            {queuedLabel}
          </span>
          <span
            style={style}
            className={cn(
              "absolute right-0 flex items-center gap-1 text-vision-healed transition-opacity duration-200 ease-out motion-reduce:transition-none",
              reconciled ? "opacity-100" : "opacity-0",
            )}
          >
            <Check className="h-3 w-3" aria-hidden />
            {doneLabel}
          </span>
        </span>
      </p>
    </li>
  );
}

"use client";

import { motion } from "framer-motion";
import { ListTree } from "lucide-react";
import { cn } from "../../lib/cn";
import { springSoft } from "../../lib/motion";
import { AST_TRACE, type AstTone } from "./prContent";

const TONE: Record<AstTone, { row: string; kind: string; sign: string }> = {
  plain: { row: "", kind: "text-ansi-blue", sign: " " },
  remove: { row: "bg-ansi-red/10", kind: "text-ansi-red", sign: "-" },
  add: { row: "bg-ansi-green/10", kind: "text-ansi-green", sign: "+" },
};

/** Expands under the diff. Mount it inside `AnimatePresence` so the height collapses on exit. */
export function AstTracePanel({ id }: { id: string }) {
  return (
    <motion.section
      id={id}
      aria-label="AST trace"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={springSoft}
      className="overflow-hidden"
    >
      <section className="rounded-lg bg-background/60 ring-1 ring-inset ring-card-border">
        <header className="flex items-center gap-2 border-b border-card-border px-3 py-2">
          <ListTree className="h-3.5 w-3.5 text-fg-muted" aria-hidden />
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">AST Trace</h3>
          <p className="ml-auto font-mono text-[11px] text-fg-subtle">locator reconciled against the live DOM</p>
        </header>
        <ol className="overflow-x-auto py-1.5">
          {AST_TRACE.map((node, index) => {
            const tone = TONE[node.tone];
            return (
              <li key={index} className={cn("flex min-w-max items-center gap-2 py-0.5 pr-3 font-mono text-xs leading-5", tone.row)}>
                <span aria-hidden className="w-4 shrink-0 select-none text-center text-fg-subtle">
                  {tone.sign}
                </span>
                <span style={{ paddingLeft: `${node.depth * 1}rem` }} className={cn("shrink-0", tone.kind)}>
                  {node.kind}
                </span>
                {node.detail ? <span className="text-fg-muted">{node.detail}</span> : null}
              </li>
            );
          })}
        </ol>
      </section>
    </motion.section>
  );
}

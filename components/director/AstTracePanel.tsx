"use client";

import { motion } from "framer-motion";
import { ListTree } from "lucide-react";
import { cn } from "../../lib/cn";
import { AST_TRACE, type AstTone } from "./prContent";

const TONE: Record<AstTone, { row: string; kind: string; sign: string }> = {
  plain: { row: "", kind: "text-fg-muted", sign: " " },
  remove: { row: "bg-danger/[0.08]", kind: "text-fg", sign: "-" },
  add: { row: "bg-success/[0.08]", kind: "text-fg", sign: "+" },
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
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden"
    >
      <section className="rounded-md bg-background ring-1 ring-inset ring-card-border">
        <header className="flex items-center gap-2 border-b border-card-border px-3 py-2">
          <ListTree className="h-3.5 w-3.5 text-fg-muted" aria-hidden />
          <h3 className="text-[13px] font-medium text-fg">AST trace</h3>
          <p className="ml-auto text-xs text-fg-subtle">locator reconciled against the live DOM</p>
        </header>
        <ol className="overflow-x-auto py-1.5">
          {AST_TRACE.map((node, index) => {
            const tone = TONE[node.tone];
            return (
              <li key={index} className={cn("flex min-w-max items-center gap-2 py-0.5 pr-3 font-mono text-xs leading-5", tone.row)}>
                <span aria-hidden className={cn("w-4 shrink-0 select-none text-center", node.tone === "add" ? "text-success" : node.tone === "remove" ? "text-danger" : "text-fg-subtle")}>
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

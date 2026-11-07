"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileDiff } from "lucide-react";
import { cn } from "../../lib/cn";
import { fadeUp } from "../../lib/motion";
import { DIFF_FILE, DIFF_LINES, DIFF_STATS, type DiffKind } from "./prContent";

const ROW: Record<DiffKind, { row: string; sign: string; signClass: string; gutter: string }> = {
  context: { row: "", sign: " ", signClass: "text-fg-subtle", gutter: "text-fg-subtle" },
  remove: {
    row: "bg-ansi-red/10 shadow-[inset_2px_0_0_0_theme(colors.ansi.red)]",
    sign: "-",
    signClass: "text-ansi-red",
    gutter: "text-ansi-red/70",
  },
  add: {
    row: "bg-ansi-green/10 shadow-[inset_2px_0_0_0_theme(colors.ansi.green)]",
    sign: "+",
    signClass: "text-ansi-green",
    gutter: "text-ansi-green/70",
  },
};

// One capture group, so `split` alternates plain text and tokens.
const TOKEN = /(\/\/.*$|'[^']*'|\/[^/\s][^/]*\/[a-z]*|\bawait\b)/g;

function tokenClass(token: string): string {
  if (token.startsWith("//")) return "italic text-fg-muted";
  if (token.startsWith("'")) return "text-ansi-yellow";
  if (token.startsWith("/")) return "text-ansi-cyan";
  return "text-ansi-magenta";
}

function highlightCode(code: string): ReactNode[] {
  return code.split(TOKEN).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={tokenClass(part)}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Unified diff of the one-line fix, with a gutter for old and new line numbers. */
export function PrDiffViewer() {
  const reduceMotion = useReducedMotion();
  const hunk = `@@ -${DIFF_FILE.line - 1},3 +${DIFF_FILE.line - 1},4 @@`;

  return (
    <section aria-label="Changed files" className="overflow-hidden rounded-lg bg-background/60 ring-1 ring-inset ring-card-border">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-card-border bg-white/[0.03] px-3 py-2">
        <h3 className="flex min-w-0 items-center gap-2 font-mono text-xs text-fg">
          <FileDiff className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden />
          <span className="truncate">
            {DIFF_FILE.path}:<span className="tabular-nums">{DIFF_FILE.line}</span>
          </span>
        </h3>
        <p className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
          <span className="text-ansi-green">+{DIFF_STATS.additions}</span>
          <span className="text-ansi-red">−{DIFF_STATS.deletions}</span>
        </p>
      </header>

      <p className="border-b border-card-border bg-info/[0.06] px-3 py-1 font-mono text-[11px] tabular-nums text-info/80">{hunk}</p>

      <motion.ol
        aria-label="Unified diff"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
        className="overflow-x-auto py-1"
      >
        {DIFF_LINES.map((line) => {
          const style = ROW[line.kind];
          return (
            <motion.li
              key={line.id}
              variants={fadeUp}
              data-diff-kind={line.kind}
              className={cn("grid min-w-max grid-cols-[2.75rem_2.75rem_1.25rem_minmax(0,1fr)] font-mono text-xs leading-6", style.row)}
            >
              <span className={cn("select-none pr-2 text-right tabular-nums", style.gutter)}>{line.oldNo ?? ""}</span>
              <span className={cn("select-none pr-2 text-right tabular-nums", style.gutter)}>{line.newNo ?? ""}</span>
              <span aria-hidden className={cn("select-none text-center font-semibold", style.signClass)}>
                {style.sign}
              </span>
              <code className="whitespace-pre pr-4 text-fg">{highlightCode(line.code)}</code>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}

"use client";

import type { ReactNode } from "react";
import { FileDiff } from "lucide-react";
import { cn } from "../../lib/cn";
import { DIFF_FILE, DIFF_LINES, DIFF_STATS, type DiffKind } from "./prContent";

const ROW: Record<DiffKind, { row: string; sign: string; signClass: string; gutter: string }> = {
  context: { row: "text-fg-muted", sign: " ", signClass: "text-fg-subtle", gutter: "text-fg-subtle" },
  remove: { row: "bg-danger/[0.08] text-fg", sign: "-", signClass: "text-danger", gutter: "text-fg-subtle" },
  add: { row: "bg-success/[0.08] text-fg", sign: "+", signClass: "text-success", gutter: "text-fg-subtle" },
};

// One capture group, so `split` alternates plain text and tokens.
const TOKEN = /(\/\/.*$|'[^']*'|\/[^/\s][^/]*\/[a-z]*|\bawait\b)/g;

function tokenClass(token: string): string {
  if (token.startsWith("//")) return "text-fg-subtle";
  return "text-fg";
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
  const hunk = `@@ -${DIFF_FILE.line - 1},3 +${DIFF_FILE.line - 1},4 @@`;

  return (
    <section aria-label="Changed files" className="overflow-hidden rounded-md bg-background ring-1 ring-inset ring-card-border">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-card-border px-3 py-2">
        <h3 className="flex min-w-0 items-center gap-2 font-mono text-xs text-fg">
          <FileDiff className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden />
          <span className="truncate">
            {DIFF_FILE.path}:<span className="tabular-nums">{DIFF_FILE.line}</span>
          </span>
        </h3>
        <p className="flex items-center gap-2 font-mono text-xs tabular-nums">
          <span className="text-success">+{DIFF_STATS.additions}</span>
          <span className="text-danger">−{DIFF_STATS.deletions}</span>
        </p>
      </header>

      <p className="border-b border-card-border px-3 py-1 font-mono text-xs tabular-nums text-fg-subtle">{hunk}</p>

      <ol aria-label="Unified diff" className="overflow-x-auto py-1">
        {DIFF_LINES.map((line) => {
          const style = ROW[line.kind];
          return (
            <li
              key={line.id}
              data-diff-kind={line.kind}
              className={cn("grid min-w-max grid-cols-[2.75rem_2.75rem_1.25rem_minmax(0,1fr)] font-mono text-xs leading-6", style.row)}
            >
              <span className={cn("select-none pr-2 text-right tabular-nums", style.gutter)}>{line.oldNo ?? ""}</span>
              <span className={cn("select-none pr-2 text-right tabular-nums", style.gutter)}>{line.newNo ?? ""}</span>
              <span aria-hidden className={cn("select-none text-center", style.signClass)}>
                {style.sign}
              </span>
              <code className="whitespace-pre pr-4">{highlightCode(line.code)}</code>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

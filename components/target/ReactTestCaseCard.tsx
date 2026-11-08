"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, GitBranch } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
import { useAgentStore } from "../../store/useAgentStore";
import { Badge, type BadgeTone } from "../ui/Badge";
import { Card } from "../ui/Card";

function verdictTone(pass: number, stepsComplete: number): { tone: BadgeTone; label: string } {
  if (stepsComplete <= 0.5) return { tone: "warning", label: "Incomplete" };
  return pass > 0.5 ? { tone: "success", label: "Pass" } : { tone: "danger", label: "Fail" };
}

/** The react/react manual test case under test, its live judgement, and the QA report so far. */
export function ReactTestCaseCard({ className }: { className?: string }) {
  const tc = useAgentStore((s) => s.liveCase);
  const catalogSize = useAgentStore((s) => s.liveCatalogSize);
  const generation = useAgentStore((s) => s.liveGeneration);
  const verdict = useAgentStore((s) => s.liveVerdict);
  const results = useAgentStore((s) => s.qaResults);
  const current = results.find((r) => tc && r.testCase.id === tc.id && r.generation === generation);

  return (
    <Card aria-labelledby="react-case-title" className={cn("flex flex-col gap-3 p-4", className)}>
      <header className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-fg-muted">
          <GitBranch className="h-3.5 w-3.5" aria-hidden />
          react/react · fixtures/dom{tc ? `/${tc.fixture}` : ""}
        </p>
        <Badge tone="info">
          <span className="tabular-nums">{catalogSize || "–"}</span>&nbsp;cases
        </Badge>
      </header>

      {tc ? (
        <motion.section key={`${tc.id}-${generation}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <h3 id="react-case-title" className="flex items-start gap-2 text-sm font-semibold text-fg">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>{tc.title}</span>
          </h3>
          <p className="mt-0.5 pl-6 font-mono text-[10px] tabular-nums text-fg-subtle">
            G{generation} · {tc.id}
          </p>
          <h4 className="mt-3 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">Steps to reproduce</h4>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-fg-muted">
            {tc.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <h4 className="mt-3 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">Expected result</h4>
          <p className="mt-1 text-xs text-fg">{tc.expected}</p>

          <footer className="mt-3 flex items-center justify-between gap-2 border-t border-card-border pt-3">
            <span className="font-mono text-[11px] tabular-nums text-fg-muted">
              all steps done{" "}
              <span className="text-fg">{verdict ? `${Math.round(verdict.goalReached * 100)}%` : "–"}</span>
            </span>
            {current ? (
              <Badge tone={verdictTone(current.pass, current.stepsComplete).tone}>
                {verdictTone(current.pass, current.stepsComplete).label} ·{" "}
                <span className="tabular-nums">{Math.round(current.pass * 100)}%</span>
              </Badge>
            ) : (
              <Badge tone="accent" pulse>
                Testing
              </Badge>
            )}
          </footer>
        </motion.section>
      ) : (
        <p className="text-xs text-fg-subtle">Discovering React&apos;s manual DOM test suite…</p>
      )}

      {results.length > 0 ? (
        <section aria-label="QA report">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">QA report</h4>
          <ul className="mt-1.5 flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {results.map((r) => {
                const v = verdictTone(r.pass, r.stepsComplete);
                return (
                  <motion.li
                    key={`${r.generation}-${r.testCase.id}`}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={spring}
                    className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1 ring-1 ring-inset ring-card-border"
                  >
                    <span className="truncate text-[11px] text-fg-muted">
                      <span className="font-mono tabular-nums text-fg-subtle">G{r.generation}</span> {r.testCase.title}
                    </span>
                    <Badge tone={v.tone}>{v.label}</Badge>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      ) : null}
    </Card>
  );
}

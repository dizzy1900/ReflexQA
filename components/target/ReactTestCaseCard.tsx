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

const SETS = ["selects", "number-inputs", "text-inputs", "buttons", "textareas", "password-inputs", "email-inputs", "input-change-events"];

function ReadyState({ running }: { running: boolean }) {
  if (running) return <p className="text-xs text-fg-subtle">Discovering React&apos;s manual DOM test suite…</p>;
  return (
    <section aria-labelledby="react-case-title" className="flex flex-col gap-3">
      <h3 id="react-case-title" className="text-[15px] font-medium text-fg">
        React&apos;s manual DOM test suite
      </h3>
      <p className="text-[13px] leading-relaxed text-fg-muted">
        The browser test cases React maintainers click through by hand. Meta drives each one in Chromium; SubQ judges every
        step against React DOM&apos;s source and the case&apos;s expected result.
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {SETS.map((s) => (
          <li key={s} className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-fg-muted ring-1 ring-inset ring-card-border">
            {s}
          </li>
        ))}
      </ul>
      <p className="text-xs text-fg-subtle">
        Start with <span className="text-fg">Run live</span> or <span className="text-fg">Replay run</span>, top right.
      </p>
    </section>
  );
}

/** The react/react manual test case under test, its live judgement, and the QA report so far. */
export function ReactTestCaseCard({ className }: { className?: string }) {
  const tc = useAgentStore((s) => s.liveCase);
  const catalogSize = useAgentStore((s) => s.liveCatalogSize);
  const generation = useAgentStore((s) => s.liveGeneration);
  const verdict = useAgentStore((s) => s.liveVerdict);
  const results = useAgentStore((s) => s.qaResults);
  const running = useAgentStore((s) => s.liveRunning);
  const current = results.find((r) => tc && r.testCase.id === tc.id && r.generation === generation);

  return (
    <Card aria-labelledby="react-case-title" className={cn("flex flex-col gap-3 p-4", className)}>
      <header className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-fg-muted">
          <GitBranch className="h-3.5 w-3.5" aria-hidden />
          react/react · fixtures/dom{tc ? `/${tc.fixture}` : ""}
        </p>
        <Badge tone="info">
          <span className="tabular-nums">{catalogSize || 32}</span>&nbsp;cases
        </Badge>
      </header>

      {tc ? (
        <motion.section key={`${tc.id}-${generation}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <h3 id="react-case-title" className="flex items-start gap-2 text-[15px] font-medium text-fg">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
            <span>{tc.title}</span>
          </h3>
          <p className="mt-0.5 pl-6 font-mono text-[10px] tabular-nums text-fg-subtle">
            G{generation} · {tc.id}
          </p>
          <h4 className="mt-4 text-xs text-fg-subtle">Steps to reproduce</h4>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-[13px] text-fg-muted">
            {tc.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <h4 className="mt-4 text-xs text-fg-subtle">Expected result</h4>
          <p className="mt-1 text-[13px] text-fg">{tc.expected}</p>

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
              <Badge tone="neutral">
                Testing
              </Badge>
            )}
          </footer>
        </motion.section>
      ) : (
        <ReadyState running={running} />
      )}

      {results.length > 0 ? (
        <section aria-label="QA report">
          <h4 className="text-xs text-fg-subtle">QA report</h4>
          <ul className="mt-1 flex flex-col divide-y divide-card-border">
            <AnimatePresence initial={false}>
              {results.map((r) => {
                const v = verdictTone(r.pass, r.stepsComplete);
                return (
                  <motion.li
                    key={`${r.generation}-${r.testCase.id}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={spring}
                    className="flex items-center justify-between gap-2 py-1.5"
                  >
                    <span className="truncate text-[13px] text-fg-muted">
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

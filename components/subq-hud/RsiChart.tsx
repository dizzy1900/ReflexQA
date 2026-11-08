"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TrendingDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
import { useAgentStore } from "../../store/useAgentStore";
import { Card } from "../ui/Card";

const CHART_H = 96;

/** The recursive self-improvement proof: steps to success should fall as lessons accumulate. */
export function RsiChart() {
  const episodes = useAgentStore((s) => s.episodes);
  const max = Math.max(4, ...episodes.map((e) => e.steps));
  const maxMs = Math.max(1, ...episodes.map((e) => e.durationMs ?? 0));
  const first = episodes[0]?.steps;
  const last = episodes[episodes.length - 1]?.steps;
  const delta = episodes.length > 1 && first ? Math.round(((first - last) / first) * 100) : null;
  // The headline gain: the first run of a case versus its fastest replay from memory.
  const firstEp = episodes[0];
  const replay = episodes.find((e) => e.generation > 1 && (e.replayedSteps ?? 0) > 0 && e.success);
  const speedup = firstEp?.durationMs && replay?.durationMs ? firstEp.durationMs / replay.durationMs : null;

  return (
    <Card aria-labelledby="rsi-title" className="flex flex-col gap-2 p-3">
      <header className="flex items-center justify-between gap-2">
        <h3 id="rsi-title" className="flex items-center gap-2 text-xs font-medium text-fg">
          <TrendingDown className="h-3.5 w-3.5 text-success" aria-hidden />
          Recursive self-improvement: time per generation
        </h3>
        {speedup !== null && firstEp && replay ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="rounded-md bg-success/10 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-success ring-1 ring-inset ring-success/30 shadow-glow-success"
          >
            Meta {firstEp.metaCalls ?? 0}→{replay.metaCalls ?? 0} · {speedup.toFixed(1)}× faster
          </motion.span>
        ) : delta !== null ? (
          <span className={cn("font-mono text-xs tabular-nums", delta > 0 ? "text-success" : "text-fg-muted")}>
            {delta > 0 ? "−" : ""}
            {Math.abs(delta)}%
          </span>
        ) : null}
      </header>

      <ol className="flex items-end gap-3" style={{ height: CHART_H + 48 }} aria-label="Steps to success per generation">
        <AnimatePresence initial={false}>
          {episodes.map((e) => (
            <motion.li
              key={e.generation}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="font-mono text-xs tabular-nums text-fg">
                {e.durationMs ? `${(e.durationMs / 1000).toFixed(1)}s` : e.steps}
              </span>
              <motion.span
                className={cn(
                  "w-full max-w-12 rounded-t-md",
                  e.success ? "bg-success/70 shadow-glow-success" : "bg-danger/70 shadow-glow-danger",
                )}
                initial={{ height: 0 }}
                title={e.caseTitle}
                animate={{ height: e.durationMs ? (e.durationMs / maxMs) * CHART_H : (e.steps / max) * CHART_H }}
                transition={spring}
              />
              <span className="font-mono text-[10px] tabular-nums text-fg-subtle">
                G{e.generation} · {e.lessonsUsed}L
              </span>
              {e.metaCalls !== undefined ? (
                <span
                  title={`${e.metaCalls} Meta Driver calls${e.replayedSteps ? ` · ${e.replayedSteps} steps replayed from learned skills` : ""}`}
                  className={cn(
                    "rounded px-1 font-mono text-[10px] tabular-nums ring-1 ring-inset",
                    e.metaCalls === 0 ? "text-success ring-success/30 shadow-glow-success" : "text-accent ring-accent/30",
                  )}
                >
                  {e.metaCalls} Meta
                </span>
              ) : null}
            </motion.li>
          ))}
        </AnimatePresence>
        {episodes.length === 0 ? <li className="self-center text-xs text-fg-subtle">No generations yet</li> : null}
      </ol>
      {episodes.some((e) => e.metaCalls !== undefined) ? (
        <p className="text-[10px] leading-snug text-fg-subtle">
          Bars: wall time per test case. Chips: Meta vision calls. Learned skills replay with <span className="text-success">0 Meta calls</span>, each step still verified by SubQ.
        </p>
      ) : null}
    </Card>
  );
}

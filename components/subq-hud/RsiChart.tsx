"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { useAgentStore } from "../../store/useAgentStore";
import { Card } from "../ui/Card";

const CHART_H = 88;
const ease = { duration: 0.4, ease: "easeOut" } as const;

/** The recursive self-improvement proof: the same work gets cheaper and faster as memory accumulates. */
export function RsiChart() {
  const episodes = useAgentStore((s) => s.episodes);
  const max = Math.max(4, ...episodes.map((e) => e.steps));
  const maxMs = Math.max(1, ...episodes.map((e) => e.durationMs ?? 0));
  // The headline gain: the first run of a case versus its replay from memory.
  const firstEp = episodes[0];
  const replay = episodes.find((e) => e.generation > 1 && (e.replayedSteps ?? 0) > 0 && e.success);
  const speedup = firstEp?.durationMs && replay?.durationMs ? firstEp.durationMs / replay.durationMs : null;

  return (
    <Card aria-labelledby="rsi-title" className="flex flex-col gap-4 p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3 id="rsi-title" className="text-[13px] font-medium text-fg">
          Self-improvement
        </h3>
        {speedup !== null && firstEp && replay ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-fg"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Meta {firstEp.metaCalls ?? 0}→{replay.metaCalls ?? 0} · {speedup.toFixed(1)}× faster
          </motion.span>
        ) : (
          <span className="text-xs text-fg-subtle">Time per generation</span>
        )}
      </header>

      <ol className="flex items-end gap-4 border-b border-card-border" style={{ height: CHART_H + 24 }} aria-label="Wall time per generation">
        <AnimatePresence initial={false}>
          {episodes.map((e) => (
            <motion.li
              key={e.generation}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="font-mono text-xs tabular-nums text-fg-muted">
                {e.durationMs ? `${(e.durationMs / 1000).toFixed(1)}s` : e.steps}
              </span>
              <motion.span
                title={e.caseTitle}
                className={cn(
                  "w-full max-w-10 rounded-t-sm",
                  !e.success ? "bg-danger/70" : (e.replayedSteps ?? 0) > 0 ? "bg-fg" : "bg-white/30",
                )}
                initial={{ height: 0 }}
                animate={{ height: e.durationMs ? (e.durationMs / maxMs) * CHART_H : (e.steps / max) * CHART_H }}
                transition={ease}
              />
            </motion.li>
          ))}
        </AnimatePresence>
        {episodes.length === 0 ? <li className="self-center pb-6 text-[13px] text-fg-subtle">No generations yet</li> : null}
      </ol>

      {episodes.length > 0 ? (
        <ol className="-mt-2 flex gap-4" aria-label="Generation details">
          {episodes.map((e) => (
            <li key={e.generation} className="flex flex-1 flex-col items-center gap-0.5 text-center">
              <span className="font-mono text-xs tabular-nums text-fg">G{e.generation}</span>
              {e.metaCalls !== undefined ? (
                <span
                  title={`${e.metaCalls} Meta Driver calls${e.replayedSteps ? ` · ${e.replayedSteps} steps replayed from memory` : ""}`}
                  className={cn("font-mono text-[11px] tabular-nums", e.metaCalls === 0 ? "text-success" : "text-fg-subtle")}
                >
                  {e.metaCalls} Meta
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {episodes.some((e) => e.metaCalls !== undefined) ? (
        <p className="text-xs leading-relaxed text-fg-subtle">
          Grey: first run, driven by Meta. White: replayed from memory with 0 Meta calls, each step still verified by SubQ.
        </p>
      ) : null}
    </Card>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAgentStore } from "../../store/useAgentStore";
import { Card } from "../ui/Card";

/** Lessons Meta distilled from its own trajectories. Each one is fed into the next generation's prompt. */
export function LessonsList() {
  const lessons = useAgentStore((s) => s.lessons);
  return (
    <Card aria-labelledby="lessons-title" className="flex flex-col gap-3 p-4">
      <h3 id="lessons-title" className="flex items-baseline justify-between text-[13px] font-medium text-fg">
        Lessons learned
        <span className="font-mono text-xs font-normal tabular-nums text-fg-subtle">{lessons.length}</span>
      </h3>
      <ol className="flex flex-col divide-y divide-card-border">
        <AnimatePresence initial={false}>
          {lessons.map((lesson, i) => (
            <motion.li
              key={`${i}-${lesson}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3 py-2 text-[13px] leading-snug text-fg-muted first:pt-0 last:pb-0"
            >
              <span className="font-mono text-xs tabular-nums text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
              <span>{lesson}</span>
            </motion.li>
          ))}
        </AnimatePresence>
        {lessons.length === 0 ? (
          <li className="text-[13px] text-fg-subtle">No lessons yet. The first generation explores without memory.</li>
        ) : null}
      </ol>
    </Card>
  );
}

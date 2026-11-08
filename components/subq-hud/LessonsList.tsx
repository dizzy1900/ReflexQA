"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { spring } from "../../lib/motion";
import { useAgentStore } from "../../store/useAgentStore";
import { Card } from "../ui/Card";

/** Skills Meta distilled from failed trajectories. Each one is fed into the next generation's prompt. */
export function LessonsList() {
  const lessons = useAgentStore((s) => s.lessons);
  return (
    <Card aria-labelledby="lessons-title" className="flex flex-col gap-2 p-3">
      <h3 id="lessons-title" className="flex items-center gap-2 text-xs font-medium text-fg">
        <BrainCircuit className="h-3.5 w-3.5 text-accent" aria-hidden />
        Learned skills <span className="font-mono tabular-nums text-fg-subtle">({lessons.length})</span>
      </h3>
      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {lessons.map((lesson, i) => (
            <motion.li
              key={`${i}-${lesson}`}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
              className="rounded-md bg-white/[0.03] px-2 py-1.5 text-[11px] leading-snug text-fg-muted ring-1 ring-inset ring-card-border"
            >
              <span className="mr-1.5 font-mono tabular-nums text-accent">#{i + 1}</span>
              {lesson}
            </motion.li>
          ))}
        </AnimatePresence>
        {lessons.length === 0 ? <li className="text-xs text-fg-subtle">Memory empty: first generation explores blind.</li> : null}
      </ul>
    </Card>
  );
}

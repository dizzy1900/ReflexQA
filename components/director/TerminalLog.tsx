"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, ChevronDown, SquareTerminal } from "lucide-react";
import { cn } from "../../lib/cn";
import { useIsoLayoutEffect } from "../../lib/useIsoLayoutEffect";
import { useAgentStore, type LogEntry } from "../../store/useAgentStore";
import { Card } from "../ui/Card";
import { formatClock, highlight, ORIGIN_LABEL, ORIGIN_STYLE, SEVERITY_STYLE } from "./terminalFormat";

/** Older lines stay in the store; the drawer renders the tail so the DOM stays small. */
const VISIBLE_LINES = 120;
const BODY_HEIGHT_REM = 6.5;
const PIN_TOLERANCE_PX = 24;

/** Timeline clock and run state. Isolated so the 60 Hz clock does not re-render the log lines. */
function RunClock() {
  const elapsedMs = useAgentStore((s) => s.elapsedMs);
  const isPlaying = useAgentStore((s) => s.isPlaying);
  const started = useAgentStore((s) => s.durationMs > 0);
  const state = isPlaying ? "Live" : started ? "Paused" : "Idle";

  return (
    <p className="flex items-center gap-2 text-xs tabular-nums text-fg-muted">
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-[background-color,box-shadow] duration-200",
          isPlaying ? "bg-success" : started ? "bg-warning" : "bg-fg-subtle",
        )}
      />
      <span>{state}</span>
      <span className="font-mono text-fg">{formatClock(elapsedMs)}</span>
    </p>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const severity = SEVERITY_STYLE[entry.severity];
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      data-log-severity={entry.severity}
      className="flex gap-3 whitespace-pre-wrap font-mono text-xs leading-5"
    >
      <span className="shrink-0 tabular-nums text-fg-subtle">{entry.time}</span>
      <span className="flex w-3 shrink-0 items-center justify-center" title={severity.tag}>
        <span aria-label={severity.tag} className={cn("h-1.5 w-1.5 rounded-full", severity.tagClass)} />
      </span>
      <span className={cn("w-9 shrink-0", ORIGIN_STYLE[entry.origin])}>{ORIGIN_LABEL[entry.origin]}</span>
      <span className={cn("min-w-0 flex-1 break-words", severity.messageClass)}>{highlight(entry.message)}</span>
    </motion.li>
  );
}

function Prompt({ idle }: { idle: boolean }) {
  return (
    <li className="flex items-center gap-2 font-mono text-xs leading-5 text-fg-muted">
      <span className="text-fg-subtle">$</span>
      <span>{idle ? "awaiting run · press G for the golden demo" : "streaming"}</span>
      <span aria-hidden className="h-3.5 w-1.5 bg-fg-subtle" />
    </li>
  );
}

/** Collapsible execution log. Lines come from the store, so they share the same clock as every other panel. */
export function TerminalLog({ className }: { className?: string }) {
  const logs = useAgentStore((s) => s.logs);
  const [open, setOpen] = useState(true);
  const [behind, setBehind] = useState(false);
  const scroller = useRef<HTMLOListElement>(null);
  const pinned = useRef(true);

  const lines = logs.length > VISIBLE_LINES ? logs.slice(-VISIBLE_LINES) : logs;
  const last = lines[lines.length - 1];

  // Follow the tail unless the presenter scrolled up to read something.
  useIsoLayoutEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [logs.length, open]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_TOLERANCE_PX;
    pinned.current = atBottom;
    setBehind(!atBottom);
  };

  const jumpToLatest = () => {
    const el = scroller.current;
    if (!el) return;
    pinned.current = true;
    setBehind(false);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  return (
    <Card aria-labelledby="terminal-log-title" className={cn("flex flex-col overflow-hidden", className)}>
      <header className="flex items-center gap-3 border-b border-card-border px-3 py-2">
        <h2 id="terminal-log-title" className="flex items-center gap-2 text-[13px] font-medium text-fg">
          <SquareTerminal className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />
          Execution Log
        </h2>
        <p className="text-xs tabular-nums text-fg-subtle">{logs.length} lines</p>

        <AnimatePresence initial={false}>
          {!open && last ? (
            <motion.p
              key="peek"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-w-0 flex-1 truncate font-mono text-[11px] text-fg-muted"
            >
              {last.time} <span className={ORIGIN_STYLE[last.origin]}>{ORIGIN_LABEL[last.origin]}</span> {last.message}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <span className="ml-auto flex items-center gap-3">
          <RunClock />
          <button
            type="button"
            aria-label={open ? "Collapse execution log" : "Expand execution log"}
            aria-expanded={open}
            aria-controls="terminal-log-body"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md text-fg-subtle outline-none",
              "transition-colors duration-150 ease-out hover:bg-white/[0.06] hover:text-fg",
              "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40",
            )}
          >
            <motion.span animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.15 }} className="flex">
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </motion.span>
          </button>
        </span>
      </header>

      <motion.section
        id="terminal-log-body"
        initial={false}
        animate={{ height: open ? `${BODY_HEIGHT_REM}rem` : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative overflow-hidden"
        aria-hidden={!open}
      >
        <ol
          ref={scroller}
          onScroll={onScroll}
          role="log"
          aria-label="Execution log"
          aria-live="off"
          tabIndex={open ? 0 : -1}
          className="flex h-full flex-col gap-0.5 overflow-y-auto px-3 py-2 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
        >
          {lines.map((entry) => (
            <LogLine key={entry.id} entry={entry} />
          ))}
          <Prompt idle={logs.length === 0} />
        </ol>

        <AnimatePresence>
          {behind ? (
            <motion.button
              key="jump"
              type="button"
              onClick={jumpToLatest}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute bottom-2 right-4 flex items-center gap-1.5 rounded-md bg-card px-2 py-1 text-xs text-fg outline-none ring-1 ring-inset ring-card-border-hover",
                "transition-colors duration-150 ease-out hover:bg-elevated focus-visible:ring-white/40",
              )}
            >
              <ArrowDownToLine className="h-3 w-3" aria-hidden />
              Latest
            </motion.button>
          ) : null}
        </AnimatePresence>
      </motion.section>
    </Card>
  );
}

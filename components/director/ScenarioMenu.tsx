"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring, springPop } from "../../lib/motion";
import { useAgentStore, type ActiveScenario } from "../../store/useAgentStore";
import { SCENARIOS, SCENARIO_BY_ID, SCENARIO_TONE_STYLES } from "./scenarios";

/**
 * Live scenario picker. Choosing a scenario aborts the current run and plays that failure and its heal at once.
 * A custom listbox: arrows move, Enter or Space selects, Escape closes.
 */
export function ScenarioMenu() {
  const active = useAgentStore((s) => s.activeScenario);
  const isPlaying = useAgentStore((s) => s.isPlaying);
  const injectChaos = useAgentStore((s) => s.injectChaos);

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const current = SCENARIO_BY_ID[active];
  const optionId = (id: ActiveScenario) => `${listId}-${id}`;

  const openMenu = () => {
    setHighlight(Math.max(0, SCENARIOS.findIndex((s) => s.id === active)));
    setOpen(true);
  };
  const closeMenu = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const choose = (id: ActiveScenario) => {
    injectChaos(id);
    closeMenu(true);
  };

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const last = SCENARIOS.length - 1;
    switch (event.key) {
      case "ArrowDown":
        setHighlight((i) => (i >= last ? 0 : i + 1));
        break;
      case "ArrowUp":
        setHighlight((i) => (i <= 0 ? last : i - 1));
        break;
      case "Home":
        setHighlight(0);
        break;
      case "End":
        setHighlight(last);
        break;
      case "Enter":
      case " ":
        choose(SCENARIOS[highlight].id);
        break;
      case "Escape":
        closeMenu(true);
        break;
      case "Tab":
        closeMenu(false);
        return;
      default:
        return;
    }
    event.preventDefault();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Scenario: ${current.label}`}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md px-2 text-left text-sm text-fg outline-none",
          "transition-colors duration-150 ease-out hover:bg-white/[0.06]",
          "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40",
          open && "bg-white/[0.06]",
        )}
      >
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", isPlaying ? "bg-success" : "bg-fg-subtle")} />
        {current.label}
        <ChevronDown className={cn("h-3.5 w-3.5 text-fg-subtle transition-transform duration-150", open && "rotate-180")} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.section
            key="menu"
            aria-label="Scenario options"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg bg-card p-1 ring-1 ring-inset ring-card-border-hover"
          >
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-label="Scenario"
              aria-activedescendant={optionId(SCENARIOS[highlight].id)}
              onKeyDown={onListKeyDown}
              className="flex flex-col gap-0.5 outline-none"
            >
              {SCENARIOS.map((scenario, index) => {
                const styles = SCENARIO_TONE_STYLES[scenario.tone];
                const selected = scenario.id === active;
                const highlighted = index === highlight;
                return (
                  <li
                    key={scenario.id}
                    id={optionId(scenario.id)}
                    role="option"
                    aria-selected={selected}
                    onPointerEnter={() => setHighlight(index)}
                    onClick={() => choose(scenario.id)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md px-2.5 py-2",
                      "transition-colors duration-150 ease-out",
                      highlighted && "bg-white/[0.06]",
                    )}
                  >
                    <span aria-hidden className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-fg">{scenario.label}</span>
                      <span className="text-xs leading-snug text-fg-muted">{scenario.hint}</span>
                    </span>
                    <AnimatePresence initial={false}>
                      {selected ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                          className="mt-1 flex text-fg"
                        >
                          <Check className="h-4 w-4" aria-hidden />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
            <p className="px-2.5 pb-1 pt-2 text-[10px] text-fg-subtle">Selecting a scenario restarts the run with that failure.</p>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

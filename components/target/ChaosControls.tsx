"use client";

import type { LucideIcon } from "lucide-react";
import { AppWindow, ArrowLeftRight, Hash, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { spring, springPop } from "../../lib/motion";
import { useAgentStore, type ActiveScenario } from "../../store/useAgentStore";
import { useTargetFaults } from "./useTargetFaults";

type Tone = "danger" | "warning" | "info";

interface PillSpec {
  scenario: ActiveScenario;
  label: string;
  icon: LucideIcon;
  tone: Tone;
}

const PILLS: readonly PillSpec[] = [
  { scenario: "broken_selector", label: "Break Selector ID", icon: Hash, tone: "danger" },
  { scenario: "modal_obstruction", label: "Spawn Modal", icon: AppWindow, tone: "warning" },
  { scenario: "css_layout_shift", label: "Shift Flex Order", icon: ArrowLeftRight, tone: "info" },
];

const toneStyles: Record<Tone, { idle: string; active: string; dot: string }> = {
  danger: {
    idle: "hover:text-danger hover:ring-danger/30 hover:shadow-glow-danger focus-visible:shadow-glow-danger",
    active: "bg-danger/10 text-danger ring-danger/40 shadow-glow-danger",
    dot: "bg-danger",
  },
  warning: {
    idle: "hover:text-warning hover:ring-warning/30 hover:shadow-glow-warning focus-visible:shadow-glow-warning",
    active: "bg-warning/10 text-warning ring-warning/40 shadow-glow-warning",
    dot: "bg-warning",
  },
  info: {
    idle: "hover:text-info hover:ring-info/30 hover:shadow-glow-info focus-visible:shadow-glow-info",
    active: "bg-info/10 text-info ring-info/40 shadow-glow-info",
    dot: "bg-info",
  },
};

interface PillProps extends PillSpec {
  active: boolean;
  onSelect: (scenario: ActiveScenario) => void;
}

function ChaosPill({ scenario, label, icon: Icon, tone, active, onSelect }: PillProps) {
  const styles = toneStyles[tone];
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(scenario)}
      whileHover={{ y: -1, scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      transition={spring}
      className={cn(
        "relative flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium outline-none ring-1 ring-inset",
        "transition-[background-color,color,box-shadow] duration-200 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/70",
        active ? styles.active : cn("bg-white/[0.03] text-fg-muted ring-card-border", styles.idle),
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
      <AnimatePresence initial={false}>
        {active ? (
          <motion.span
            key="live"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={springPop}
            className={cn("h-1.5 w-1.5 rounded-full", styles.dot)}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Glass bar that injects faults into the sandbox. Each pill runs the full agent loop
 * for its scenario (fault, regression, heal), so the sandbox shows the break and the recovery.
 */
export function ChaosControls() {
  const injectChaos = useAgentStore((s) => s.injectChaos);
  const { selectorMutated, modalOpen, layoutReversed } = useTargetFaults();
  const active: Record<ActiveScenario, boolean> = {
    broken_selector: selectorMutated,
    modal_obstruction: modalOpen,
    css_layout_shift: layoutReversed,
  };

  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[70] flex justify-center">
      <motion.section
        role="group"
        aria-label="Chaos controls"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-lg bg-card p-1.5 pl-3 ring-1 ring-inset ring-card-border"
      >
        <span className="mr-1 flex items-center gap-1.5 text-xs text-fg-muted">
          <Zap className="h-3.5 w-3.5" aria-hidden />
          Inject fault
        </span>
        {PILLS.map((pill) => (
          <ChaosPill key={pill.scenario} {...pill} active={active[pill.scenario]} onSelect={injectChaos} />
        ))}
      </motion.section>
    </div>
  );
}

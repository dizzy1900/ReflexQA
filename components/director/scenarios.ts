import { AppWindow, ArrowLeftRight, Hash, type LucideIcon } from "lucide-react";
import { CHECKOUT_SELECTOR, MUTATED_SELECTOR, useAgentStore, type ActiveScenario } from "../../store/useAgentStore";

export type ScenarioTone = "danger" | "warning" | "info";

export interface ScenarioMeta {
  id: ActiveScenario;
  /** Presenter-facing name, shared by the top bar menu and the dock toggles. */
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: ScenarioTone;
}

export const SCENARIOS: readonly ScenarioMeta[] = [
  {
    id: "broken_selector",
    label: "Selector Drift",
    hint: `${CHECKOUT_SELECTOR} becomes ${MUTATED_SELECTOR} in the v2 markup`,
    icon: Hash,
    tone: "danger",
  },
  {
    id: "modal_obstruction",
    label: "Modal Trap",
    hint: "A security notice covers the checkout button",
    icon: AppWindow,
    tone: "warning",
  },
  {
    id: "css_layout_shift",
    label: "Flex Shift",
    hint: "The action bar flips with flex-row-reverse",
    icon: ArrowLeftRight,
    tone: "info",
  },
];

export const SCENARIO_BY_ID: Record<ActiveScenario, ScenarioMeta> = {
  broken_selector: SCENARIOS[0],
  modal_obstruction: SCENARIOS[1],
  css_layout_shift: SCENARIOS[2],
};

/** Classes for each tone, covering rest, hover and live states. */
export const SCENARIO_TONE_STYLES: Record<ScenarioTone, { idle: string; active: string; dot: string; text: string; glow: string }> = {
  danger: {
    idle: "hover:bg-white/[0.06] hover:text-fg",
    active: "bg-white/[0.08] text-fg ring-card-border-hover",
    dot: "bg-danger",
    text: "text-fg",
    glow: "",
  },
  warning: {
    idle: "hover:bg-white/[0.06] hover:text-fg",
    active: "bg-white/[0.08] text-fg ring-card-border-hover",
    dot: "bg-warning",
    text: "text-fg",
    glow: "",
  },
  info: {
    idle: "hover:bg-white/[0.06] hover:text-fg",
    active: "bg-white/[0.08] text-fg ring-card-border-hover",
    dot: "bg-info",
    text: "text-fg",
    glow: "",
  },
};

/** Which faults the page is rendering right now, read from the store's ground-truth `targetElement`. */
export function useLiveFaults(): Record<ActiveScenario, boolean> {
  const selectorDrifted = useAgentStore((s) => s.targetElement.selector !== CHECKOUT_SELECTOR);
  const modalOpen = useAgentStore((s) => s.targetElement.obstruction !== null);
  const layoutReversed = useAgentStore((s) => s.targetElement.layoutReversed);
  return { broken_selector: selectorDrifted, modal_obstruction: modalOpen, css_layout_shift: layoutReversed };
}

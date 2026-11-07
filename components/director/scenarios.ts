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
    idle: "hover:text-danger hover:ring-danger/30 hover:shadow-glow-danger focus-visible:shadow-glow-danger",
    active: "bg-danger/10 text-danger ring-danger/40 shadow-glow-danger",
    dot: "bg-danger",
    text: "text-danger",
    glow: "shadow-glow-danger",
  },
  warning: {
    idle: "hover:text-warning hover:ring-warning/30 hover:shadow-glow-warning focus-visible:shadow-glow-warning",
    active: "bg-warning/10 text-warning ring-warning/40 shadow-glow-warning",
    dot: "bg-warning",
    text: "text-warning",
    glow: "shadow-glow-warning",
  },
  info: {
    idle: "hover:text-info hover:ring-info/30 hover:shadow-glow-info focus-visible:shadow-glow-info",
    active: "bg-info/10 text-info ring-info/40 shadow-glow-info",
    dot: "bg-info",
    text: "text-info",
    glow: "shadow-glow-info",
  },
};

/** Which faults the page is rendering right now, read from the store's ground-truth `targetElement`. */
export function useLiveFaults(): Record<ActiveScenario, boolean> {
  const selectorDrifted = useAgentStore((s) => s.targetElement.selector !== CHECKOUT_SELECTOR);
  const modalOpen = useAgentStore((s) => s.targetElement.obstruction !== null);
  const layoutReversed = useAgentStore((s) => s.targetElement.layoutReversed);
  return { broken_selector: selectorDrifted, modal_obstruction: modalOpen, css_layout_shift: layoutReversed };
}

"use client";

import { CHECKOUT_SELECTOR, useAgentStore } from "../../store/useAgentStore";

/**
 * Which chaos faults the page is currently rendering, derived from the store's
 * ground-truth `targetElement`. `activeScenario` is not used because it names the
 * last scenario selected, even before any fault has landed.
 */
export function useTargetFaults() {
  const selector = useAgentStore((s) => s.targetElement.selector);
  const modalOpen = useAgentStore((s) => s.targetElement.obstruction !== null);
  const layoutReversed = useAgentStore((s) => s.targetElement.layoutReversed);

  return {
    selector,
    selectorMutated: selector !== CHECKOUT_SELECTOR,
    modalOpen,
    layoutReversed,
  };
}

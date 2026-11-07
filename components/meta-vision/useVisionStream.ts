"use client";

import { useEffect, useState } from "react";
import {
  CHECKOUT_SELECTOR,
  RESERVATION_ID,
  TARGET_BOX_ID,
  TARGET_VIEWPORT,
  useAgentStore,
  type AgentState,
  type AgentStatus,
} from "../../store/useAgentStore";

export interface VisionLine {
  id: number;
  text: string;
}

/** Frames are derived from the run clock: 24 fps puts the Subquadratic HUD flash (4.5s) on frame 108. */
const FPS = 24;
const MAX_LINES = 4;

function targetCenter(state: AgentState): { x: number; y: number } {
  const box = state.boundingBoxes.find((b) => b.id === TARGET_BOX_ID);
  const rect = box ?? state.targetElement;
  return { x: Math.round(rect.x + rect.w / 2), y: Math.round(rect.y + rect.h / 2) };
}

/** One reasoning line per status, in `Frame N: a -> b -> c.` form. Null means "say nothing". */
function describe(status: AgentStatus, state: AgentState): string | null {
  const frame = Math.floor((state.elapsedMs / 1000) * FPS);
  const { x, y } = targetCenter(state);
  const regions = state.boundingBoxes.length;

  switch (status) {
    case "observing":
      return `Frame ${frame}: Scanning ${TARGET_VIEWPORT.w}×${TARGET_VIEWPORT.h} viewport -> ${regions} regions segmented -> Acquiring target.`;
    case "analyzing":
      return `Frame ${frame}: Page model built -> "${CHECKOUT_SELECTOR}" ranked 1 of ${regions} -> Planning action.`;
    case "action_attempted":
      return `Frame ${frame}: Visual Grounding verified -> Element localized at (${x}, ${y}) -> Target ready.`;
    case "regression_tripped":
      return `Frame ${frame}: Selector ${CHECKOUT_SELECTOR} unresolved -> Click at (${Math.round(state.cursor.x)}, ${Math.round(state.cursor.y)}) missed -> Escalating to Subquadratic.`;
    case "subq_healing":
      return `Frame ${frame}: Repository snapshot ingesting -> Tracing selector origin -> Patch pending.`;
    case "healed_execution":
      return `Frame ${frame}: OCR fallback re-grounded "Complete Reservation" -> Element localized at (${x}, ${y}) -> Target ready.`;
    case "success":
      return `Frame ${frame}: Click verified -> Reservation ${RESERVATION_ID} confirmed -> Run verified.`;
    case "idle":
      return null;
  }
}

/**
 * Turns agent status changes into a short rolling history of vision reasoning lines.
 * Subscribes imperatively so lines read the store state at the moment of the change.
 */
export function useVisionStream() {
  const [lines, setLines] = useState<VisionLine[]>([]);

  useEffect(() => {
    let nextId = 0;
    let previous: AgentStatus | null = null;

    const handle = (state: AgentState) => {
      const status = state.agentStatus;
      if (status === previous) return;
      previous = status;

      if (status === "idle") {
        setLines([]);
        return;
      }
      const text = describe(status, state);
      if (text) setLines((current) => [...current, { id: nextId++, text }].slice(-MAX_LINES));
    };

    handle(useAgentStore.getState());
    // The store changes status first and updates boxes and the run clock later in the same tick.
    // Reading in a microtask means the line sees the settled state, not the half-applied one.
    return useAgentStore.subscribe(() => queueMicrotask(() => handle(useAgentStore.getState())));
  }, []);

  return lines;
}

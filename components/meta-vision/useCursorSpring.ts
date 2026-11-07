"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { useIsoLayoutEffect } from "../../lib/useIsoLayoutEffect";
import { useAgentStore } from "../../store/useAgentStore";

const CURSOR_SPRING = { stiffness: 260, damping: 28, mass: 0.6 } as const;

/**
 * Spring-smoothed cursor position in screen pixels. Reads the store imperatively, so
 * the 60fps cursor never re-renders React; only the MotionValues move.
 */
export function useCursorSpring(scale: number) {
  const initial = useAgentStore.getState().cursor;
  const rawX = useMotionValue(initial.x * scale);
  const rawY = useMotionValue(initial.y * scale);
  const x = useSpring(rawX, CURSOR_SPRING);
  const y = useSpring(rawY, CURSOR_SPRING);
  const scaleRef = useRef(scale);

  // A rescale moves the cursor's screen position without any real movement: jump, don't glide.
  useIsoLayoutEffect(() => {
    scaleRef.current = scale;
    const { cursor } = useAgentStore.getState();
    rawX.set(cursor.x * scale);
    rawY.set(cursor.y * scale);
    x.jump(cursor.x * scale);
    y.jump(cursor.y * scale);
  }, [scale, rawX, rawY, x, y]);

  useEffect(
    () =>
      useAgentStore.subscribe((state, previous) => {
        if (state.cursor === previous.cursor) return;
        rawX.set(state.cursor.x * scaleRef.current);
        rawY.set(state.cursor.y * scaleRef.current);
      }),
    [rawX, rawY],
  );

  return { x, y };
}

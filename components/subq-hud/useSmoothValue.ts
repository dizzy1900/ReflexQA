"use client";

import { useEffect } from "react";
import { useMotionValue, useReducedMotion, useSpring, type MotionValue } from "framer-motion";

const SMOOTH = { stiffness: 110, damping: 22, mass: 1 } as const;

/**
 * A spring-smoothed copy of a store value. Readouts subscribe to the returned motion value,
 * so they animate without re-rendering React on every frame.
 */
export function useSmoothValue(target: number): MotionValue<number> {
  const reduceMotion = useReducedMotion();
  const raw = useMotionValue(target);
  const smooth = useSpring(raw, SMOOTH);

  useEffect(() => {
    raw.set(target);
    if (reduceMotion) smooth.jump(target);
  }, [raw, smooth, target, reduceMotion]);

  return smooth;
}

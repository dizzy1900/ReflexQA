"use client";

import { useRef, useState } from "react";
import { useIsoLayoutEffect } from "../../lib/useIsoLayoutEffect";

/**
 * Scale factor that fits a `baseWidth`-wide surface into the measured container,
 * never above 1. `scale` is null until the first measurement.
 */
export function useFitScale(baseWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / baseWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [baseWidth]);

  return { ref, scale };
}

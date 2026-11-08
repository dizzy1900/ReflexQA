"use client";

import { useRef, useState } from "react";
import { useIsoLayoutEffect } from "../../lib/useIsoLayoutEffect";
import { TARGET_VIEWPORT } from "../../store/useAgentStore";
import { MetaVisionOverlay } from "./MetaVisionOverlay";

/** The real Playwright screenshot Meta Muse Spark is looking at, with the vision overlay drawn in the same 1280×800 space. */
export function LiveFrameFeed({ frame }: { frame: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / TARGET_VIEWPORT.w);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      aria-label="Live screenshot seen by Meta Muse Spark"
      className="relative w-full shrink-0 overflow-hidden rounded-2xl bg-background ring-1 ring-inset ring-card-border shadow-frame"
      style={{ aspectRatio: `${TARGET_VIEWPORT.w} / ${TARGET_VIEWPORT.h}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/jpeg;base64,${frame}`} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {scale > 0 ? (
        <span className="pointer-events-none absolute inset-0 z-10 block">
          <MetaVisionOverlay scale={scale} />
        </span>
      ) : null}
    </figure>
  );
}

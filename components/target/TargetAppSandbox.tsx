"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { fadeUp } from "../../lib/motion";
import { TARGET_VIEWPORT } from "../../store/useAgentStore";
import { ChaosControls } from "./ChaosControls";
import { CheckoutPage } from "./CheckoutPage";
import { useFitScale } from "./useFitScale";
import { WindowChrome } from "./WindowChrome";

interface TargetAppSandboxProps {
  /**
   * Layer drawn above the page, in screen pixels, sized to the scaled viewport. Multiply
   * store coordinates (TARGET_VIEWPORT space) by `scale`. Rendering outside the scaled
   * subtree keeps strokes and text crisp and layout animations correct. Pointer events pass through.
   */
  overlay?: (viewport: { scale: number }) => ReactNode;
  /** Shows the Chaos Controls bar over the page. Defaults to true. */
  chaosControls?: boolean;
  /**
   * Renders a read-only copy of the page, as a camera feed: no window chrome or controls, and
   * inert so it takes no focus or clicks. It follows the same store, so it always matches the live sandbox.
   */
  mirror?: boolean;
  className?: string;
}

// React 18's DOM typings predate `inert`, but the attribute passes straight through to the element.
const INERT_PROPS: Record<string, string> = { inert: "" };

export function TargetAppSandbox({ overlay, chaosControls = true, mirror = false, className }: TargetAppSandboxProps) {
  const { ref, scale } = useFitScale(TARGET_VIEWPORT.w);
  const s = scale ?? 1;

  return (
    <MotionConfig reducedMotion="user">
      <motion.article
        aria-label={mirror ? "Target application feed" : "Target application sandbox"}
        aria-hidden={mirror || undefined}
        {...(mirror ? INERT_PROPS : {})}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-card ring-1 ring-inset ring-card-border shadow-frame",
          className,
        )}
      >
        {mirror ? null : <WindowChrome />}

        <div ref={ref} className="relative w-full min-w-0 bg-background">
          <div
            className={cn("relative overflow-hidden transition-opacity duration-200 ease-out", scale === null && "opacity-0")}
            style={{ width: TARGET_VIEWPORT.w * s, height: TARGET_VIEWPORT.h * s }}
          >
            <div style={{ width: TARGET_VIEWPORT.w, height: TARGET_VIEWPORT.h, transform: `scale(${s})`, transformOrigin: "top left" }}>
              <CheckoutPage />
            </div>
            {overlay ? <div className="pointer-events-none absolute inset-0 z-[60]">{overlay({ scale: s })}</div> : null}
          </div>

          {chaosControls && !mirror ? <ChaosControls /> : null}
        </div>
      </motion.article>
    </MotionConfig>
  );
}

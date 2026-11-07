"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import { cn } from "../../lib/cn";
import { spring, springSoft } from "../../lib/motion";
import { useIsoLayoutEffect } from "../../lib/useIsoLayoutEffect";
import { useAgentStore } from "../../store/useAgentStore";
import { Button } from "../ui/Button";
import { BILLING_FORM_ID } from "./BillingForm";
import { useTargetFaults } from "./useTargetFaults";

/** How far the terms block travels when the bar flips: inner width (1088 - 2 × 24) minus its own 480px. */
const TERMS_TRAVEL_PX = 1088 - 2 * 24 - 480;

/**
 * Animates an element from where it used to be to where the layout now puts it.
 * The DOM jumps instantly; this offset starts at the old position and springs to 0.
 */
function useFlipOffset(delta: (prev: number, next: number) => number, value: number, transition: typeof spring | typeof springSoft = spring) {
  const x = useMotionValue(0);
  const previous = useRef(value);
  const reduceMotion = useReducedMotion();

  useIsoLayoutEffect(() => {
    const from = delta(previous.current, value);
    previous.current = value;
    if (from === 0) return;
    if (reduceMotion) {
      x.set(0);
      return;
    }
    x.set(x.get() + from);
    const controls = animate(x, 0, transition);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return x;
}

export function CheckoutActionBar() {
  const { selector, selectorMutated, layoutReversed } = useTargetFaults();
  const buttonLeft = useAgentStore((s) => s.targetElement.x);

  const buttonX = useFlipOffset((prev, next) => prev - next, buttonLeft);
  const termsX = useFlipOffset((prev, next) => (prev - next) * TERMS_TRAVEL_PX, layoutReversed ? 1 : 0, springSoft);

  return (
    <motion.section
      aria-label="Checkout actions"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={cn(
        "checkout-actions absolute left-[96px] top-[624px] flex h-[88px] w-[1088px] items-center justify-between",
        "rounded-xl bg-card pl-[24px] ring-1 ring-inset ring-card-border",
        // The v2 carrier markup reserves extra room on the right of the bar.
        selectorMutated ? "pr-[96px]" : "pr-[24px]",
        layoutReversed && "flex-row-reverse",
      )}
    >
      <motion.p
        style={{ x: termsX }}
        className="checkout-actions__terms flex w-[480px] shrink-0 items-center gap-3 text-xs leading-relaxed text-fg-muted"
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-success" aria-hidden />
        <span>
          <span className="text-sm font-medium text-fg">
            Total due today · <span className="font-mono tabular-nums">$32,400.00</span>/mo
          </span>
          <br />
          Billed to •••• <span className="font-mono tabular-nums">4242</span>. By continuing you accept the Reservation
          Terms.
        </span>
      </motion.p>

      <Button
        id={selector.slice(1)}
        type="submit"
        form={BILLING_FORM_ID}
        size="lg"
        style={{ x: buttonX }}
        className={cn("w-[240px] shrink-0", selectorMutated ? "btn-v2 pay-carrier-cta" : "btn-primary checkout-cta")}
      >
        Complete Reservation
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </motion.section>
  );
}

"use client";

import { AnimatePresence } from "framer-motion";
import { TARGET_VIEWPORT, useAgentStore } from "../../store/useAgentStore";
import { BillingForm } from "./BillingForm";
import { CheckoutActionBar } from "./CheckoutActionBar";
import { CheckoutHeader } from "./CheckoutHeader";
import { OrderConfirmationModal } from "./OrderConfirmationModal";
import { OrderSummary } from "./OrderSummary";
import { SecurityNoticeModal } from "./SecurityNoticeModal";
import { SuccessParticles } from "./SuccessParticles";

/**
 * The mock Hyperscale checkout at its native TARGET_VIEWPORT size. Every box is placed
 * in whole pixels because the store's coordinates (cursor, bounding boxes) use this space.
 */
export function CheckoutPage() {
  const obstruction = useAgentStore((s) => s.targetElement.obstruction);

  return (
    <section
      aria-label="Hyperscale checkout"
      data-target-viewport
      className="relative overflow-hidden bg-background font-sans text-fg antialiased"
      style={{ width: TARGET_VIEWPORT.w, height: TARGET_VIEWPORT.h }}
    >
      <CheckoutHeader />
      <OrderSummary />
      <BillingForm />
      <CheckoutActionBar />

      <AnimatePresence>
        {obstruction ? <SecurityNoticeModal key="tenant-modal" obstruction={obstruction} /> : null}
      </AnimatePresence>
      <OrderConfirmationModal />
      <SuccessParticles />
    </section>
  );
}

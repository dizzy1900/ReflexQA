"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { springPop } from "../../lib/motion";
import { RESERVATION_ID, useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function OrderConfirmationModal() {
  const orderConfirmed = useAgentStore((s) => s.orderConfirmed);
  const [dismissed, setDismissed] = useState(false);

  // A new run (or reset) clears `orderConfirmed`, which re-arms the modal for the next success.
  useEffect(() => {
    if (!orderConfirmed) setDismissed(false);
  }, [orderConfirmed]);

  return (
    <AnimatePresence>
      {orderConfirmed && !dismissed ? (
        <motion.div
          key="order-confirmation"
          className="order-confirmation absolute inset-0 z-40 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-confirmation-title"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={springPop}
            className="flex w-[460px] flex-col items-center gap-6 rounded-2xl bg-card p-8 text-center ring-1 ring-inset ring-card-border-hover shadow-glow-success"
          >
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springPop, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-inset ring-success/40 shadow-glow-success"
            >
              <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
            </motion.span>

            <header className="flex flex-col items-center gap-2">
              <h2 id="order-confirmation-title" className="text-xl font-semibold tracking-tight text-fg">
                Reservation confirmed
              </h2>
              <p className="text-sm leading-relaxed text-fg-muted">
                H100 GPU Cluster (8x Node Reservation) is being provisioned in us-east-2.
              </p>
            </header>

            <dl className="flex w-full flex-col divide-y divide-card-border rounded-xl bg-background/60 ring-1 ring-inset ring-card-border">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <dt className="text-fg-muted">Reservation</dt>
                <dd className="font-mono text-xs tabular-nums text-fg">{RESERVATION_ID}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <dt className="text-fg-muted">Amount</dt>
                <dd className="font-mono text-xs tabular-nums text-fg">$32,400.00/mo</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <dt className="text-fg-muted">Status</dt>
                <dd>
                  <Badge tone="success" pulse>
                    Provisioning
                  </Badge>
                </dd>
              </div>
            </dl>

            <Button className="w-full" onClick={() => setDismissed(true)}>
              Done
            </Button>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { springPop } from "../../lib/motion";
import { useAgentStore, type Obstruction } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

const CLOSE_BUTTON_PX = 32;

const TENANT_ROWS = [
  ["Tenant", "hyperscale-prod-us-east"],
  ["Region", "us-east-2"],
  ["Requested by", "priya.raman@northwind.ai"],
] as const;

/**
 * Placed from the store's obstruction rect, so the card and its close control sit
 * exactly where Meta Vision and the cursor expect them.
 */
export function SecurityNoticeModal({ obstruction }: { obstruction: Obstruction }) {
  const dismiss = useAgentStore((s) => s.dismissObstruction);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <motion.div
      className="tenant-modal__backdrop absolute inset-0 z-40 bg-black/75"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tenant-modal-title"
        aria-describedby="tenant-modal-body"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={springPop}
        style={{ left: obstruction.x, top: obstruction.y, width: obstruction.w, height: obstruction.h }}
        className="tenant-modal absolute flex flex-col justify-between rounded-2xl bg-card p-8 ring-1 ring-inset ring-card-border-hover shadow-glow-warning"
      >
        <Button
          variant="ghost"
          size="sm"
          aria-label="Dismiss security notice"
          onClick={dismiss}
          style={{
            position: "absolute",
            left: obstruction.dismissX - obstruction.x - CLOSE_BUTTON_PX / 2,
            top: obstruction.dismissY - obstruction.y - CLOSE_BUTTON_PX / 2,
            width: CLOSE_BUTTON_PX,
            height: CLOSE_BUTTON_PX,
            padding: 0,
          }}
          className="tenant-modal__close"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>

        <header className="flex items-start gap-4 pr-10">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning ring-1 ring-inset ring-warning/30 shadow-glow-warning">
            <ShieldAlert className="h-6 w-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <Badge tone="warning" pulse>
              Action required
            </Badge>
            <h2 id="tenant-modal-title" className="text-lg font-semibold leading-snug tracking-tight text-fg">
              Security Notice: Confirm Cloud Tenant
            </h2>
          </div>
        </header>

        <p id="tenant-modal-body" className="text-sm leading-relaxed text-fg-muted">
          This reservation was requested from a region your organization has not used before. Confirm the cloud tenant
          below before committing $32,400.00/mo of GPU capacity.
        </p>

        <dl className="flex flex-col divide-y divide-card-border rounded-xl bg-background/60 ring-1 ring-inset ring-card-border">
          {TENANT_ROWS.map(([term, value]) => (
            <div key={term} className="flex items-center justify-between px-4 py-3 text-sm">
              <dt className="text-fg-muted">{term}</dt>
              <dd className="font-mono text-xs tabular-nums text-fg">{value}</dd>
            </div>
          ))}
        </dl>

        <footer className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={dismiss}>
            Cancel
          </Button>
          <Button ref={confirmRef} onClick={dismiss}>
            Confirm Tenant
          </Button>
        </footer>
      </motion.section>
    </motion.div>
  );
}

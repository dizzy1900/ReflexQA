"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ALL_FAULTS, type Fault } from "../../lib/engine/events";
import { useAgentStore } from "../../store/useAgentStore";
import { CheckoutPage } from "../../components/target/CheckoutPage";

function parseFaults(raw: string | null): Fault[] {
  if (!raw) return [];
  return raw.split(",").filter((f): f is Fault => (ALL_FAULTS as readonly string[]).includes(f));
}

/**
 * The real page under test. The live engine opens /target?faults=… in headless Chromium,
 * and every click it makes goes through the actual DOM, modal backdrop and flex layout.
 */
export function TargetHarness() {
  const params = useSearchParams();
  const faults = params.get("faults");
  const applyFaults = useAgentStore((s) => s.applyFaults);
  const confirmed = useAgentStore((s) => s.orderConfirmed);

  useEffect(() => {
    applyFaults(parseFaults(faults));
  }, [applyFaults, faults]);

  return (
    <main data-order-confirmed={confirmed ? "true" : "false"} className="min-h-dvh bg-background">
      <CheckoutPage />
    </main>
  );
}

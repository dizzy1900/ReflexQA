"use client";

import type { FormEvent } from "react";
import { CreditCard, LockKeyhole } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

export const BILLING_FORM_ID = "billing-form";

function SectionLabel({ children }: { children: string }) {
  return <h3 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">{children}</h3>;
}

export function BillingForm() {
  const submitOrder = useAgentStore((s) => s.submitOrder);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitOrder();
  };

  return (
    <Card
      aria-labelledby="billing-title"
      className="absolute left-[648px] top-[112px] h-[480px] w-[536px] overflow-hidden p-8"
    >
      <form id={BILLING_FORM_ID} onSubmit={onSubmit} className="flex h-full flex-col justify-between">
        <header className="flex items-center justify-between">
          <h2 id="billing-title" className="flex items-center gap-2.5 text-base font-semibold text-fg">
            <CreditCard className="h-4 w-4 text-fg-muted" aria-hidden />
            Billing details
          </h2>
          <Badge tone="success">Saved profile</Badge>
        </header>

        <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0">
          <legend className="mb-3 p-0">
            <SectionLabel>Payment method</SectionLabel>
          </legend>
          <Field
            label="Card number"
            mono
            defaultValue="•••• •••• •••• 4242"
            inputMode="numeric"
            trailing={<LockKeyhole className="h-4 w-4" aria-hidden />}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expiry" mono defaultValue="09 / 28" inputMode="numeric" />
            <Field label="CVC" mono defaultValue="•••" inputMode="numeric" />
          </div>
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0">
          <legend className="mb-3 p-0">
            <SectionLabel>Customer</SectionLabel>
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" defaultValue="Northwind Labs, Inc." />
            <Field label="Billing email" type="email" defaultValue="billing@northwind.ai" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tenant ID" mono defaultValue="tnt_8f31c9a2" />
            <Field label="PO number" mono defaultValue="PO-2026-0412" />
          </div>
        </fieldset>
      </form>
    </Card>
  );
}

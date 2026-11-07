"use client";

import { Cpu, Network, ReceiptText, Timer } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

const SPEC_CHIPS = [
  { icon: Network, label: "400 Gb/s InfiniBand" },
  { icon: Cpu, label: "NVLink 4.0" },
  { icon: Timer, label: "12-month commitment" },
] as const;

const money = "font-mono tabular-nums";

export function OrderSummary() {
  return (
    <Card
      aria-labelledby="order-summary-title"
      className="absolute left-[96px] top-[112px] flex h-[480px] w-[520px] flex-col justify-between overflow-hidden p-8"
    >
      <header className="flex items-center justify-between">
        <h2 id="order-summary-title" className="flex items-center gap-2.5 text-base font-semibold text-fg">
          <ReceiptText className="h-4 w-4 text-fg-muted" aria-hidden />
          Order summary
        </h2>
        <Badge tone="info">Billed monthly</Badge>
      </header>

      <article className="flex items-start gap-4 rounded-xl bg-background/60 p-4 ring-1 ring-inset ring-card-border transition-[box-shadow] duration-200 ease-out hover:ring-card-border-hover">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-hover ring-1 ring-inset ring-accent/30">
          <Cpu className="h-6 w-6" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-sm font-medium leading-snug text-fg">H100 GPU Cluster (8x Node Reservation)</h3>
          <p className="text-xs leading-relaxed text-fg-muted">
            8 × NVIDIA H100 SXM5 80 GB · us-east-2 · dedicated tenancy
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className={`${money} text-sm font-semibold text-fg`}>$32,400.00</span>
          <span className="text-xs text-fg-subtle">/mo</span>
        </div>
      </article>

      <ul className="flex flex-wrap gap-2" aria-label="Included specifications">
        {SPEC_CHIPS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 rounded-full bg-white/[0.03] px-3 py-1.5 text-xs text-fg-muted ring-1 ring-inset ring-card-border transition-[background-color,color,box-shadow] duration-200 ease-out hover:bg-white/[0.06] hover:text-fg hover:shadow-glow-accent"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-3 border-t border-card-border pt-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-fg-muted">Subtotal</dt>
          <dd className={`${money} text-fg`}>$32,400.00</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-fg-muted">Estimated tax (reverse charge)</dt>
          <dd className={`${money} text-fg`}>$0.00</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-card-border pt-4">
          <dt className="font-medium text-fg">Total due today</dt>
          <dd className="flex items-baseline gap-1">
            <span className={`${money} text-2xl font-semibold tracking-tight text-fg`}>$32,400.00</span>
            <span className="text-xs text-fg-subtle">/mo</span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

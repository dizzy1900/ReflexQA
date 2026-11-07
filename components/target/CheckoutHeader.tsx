"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Server } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";

const NAV_ITEMS = ["Overview", "Reservations", "Billing", "Support"] as const;
const ACTIVE_ITEM = "Reservations";

const navButton =
  "relative rounded-md px-3 py-2 text-sm outline-none transition-[background-color,color,box-shadow] duration-200 ease-out " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/70";

export function CheckoutHeader() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 flex h-[72px] items-center justify-between border-b border-card-border bg-card/60 px-[96px]">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-hover ring-1 ring-inset ring-accent/30 shadow-glow-accent">
            <Server className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-fg">Hyperscale</span>
        </span>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item === ACTIVE_ITEM;
            return (
              <motion.button
                key={item}
                type="button"
                aria-current={active ? "page" : undefined}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                className={cn(
                  navButton,
                  active
                    ? "bg-white/[0.06] text-fg shadow-glow-accent"
                    : "text-fg-muted hover:bg-white/[0.04] hover:text-fg",
                )}
              >
                {item}
              </motion.button>
            );
          })}
        </nav>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className={cn(
            navButton,
            "flex items-center gap-2.5 bg-white/[0.03] py-1.5 pl-1.5 pr-3 ring-1 ring-inset ring-card-border hover:bg-white/[0.06] hover:shadow-glow-info",
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-info/15 text-xs font-semibold text-info">
            NL
          </span>
          <span className="text-sm text-fg">Northwind Labs</span>
          <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" aria-hidden />
        </motion.button>
      </header>

      <nav
        aria-label="Breadcrumb"
        className="absolute left-[96px] top-[84px] flex h-6 items-center gap-1.5 text-xs text-fg-subtle"
      >
        <span>Reservations</span>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span>GPU clusters</span>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="text-fg-muted">Checkout</span>
      </nav>
    </>
  );
}

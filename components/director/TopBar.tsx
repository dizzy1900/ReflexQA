"use client";

import { motion } from "framer-motion";
import { ScanEye } from "lucide-react";
import { spring } from "../../lib/motion";
import { ScenarioMenu } from "./ScenarioMenu";
import { SponsorTags } from "./SponsorTags";
import { SystemHealth } from "./SystemHealth";

export function TopBar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="relative z-40 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-card-border bg-background/90 px-4 py-2.5"
    >
      <h1 className="flex items-center gap-2.5">
        <motion.span
          whileHover={{ rotate: -6, scale: 1.06 }}
          transition={spring}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-vision-nominal text-white ring-1 ring-inset ring-white/20 shadow-glow-accent"
        >
          <ScanEye className="h-4 w-4" aria-hidden />
        </motion.span>
        <span className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight text-fg">ReflexQA</span>
          <span className="mt-1 hidden text-[10px] uppercase tracking-[0.16em] text-fg-subtle md:block">Self-healing QA agent</span>
        </span>
      </h1>

      <span role="separator" aria-orientation="vertical" className="hidden h-6 w-px bg-card-border sm:block" />
      <ScenarioMenu />

      <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <SponsorTags />
        <span role="separator" aria-orientation="vertical" className="hidden h-6 w-px bg-card-border lg:block" />
        <SystemHealth />
      </span>
    </motion.header>
  );
}

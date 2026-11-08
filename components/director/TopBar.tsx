"use client";

import { motion } from "framer-motion";
import { GitBranch, ScanEye } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { spring } from "../../lib/motion";
import { ScenarioMenu } from "./ScenarioMenu";
import { SponsorTags } from "./SponsorTags";
import { SystemHealth } from "./SystemHealth";

/** During a React-suite run the scenario picker gives way to what is actually under test. */
function SuiteChip() {
  const generation = useAgentStore((s) => s.liveGeneration);
  const catalog = useAgentStore((s) => s.liveCatalogSize);
  return (
    <motion.p
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={spring}
      className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-fg ring-1 ring-inset ring-card-border shadow-glow-info"
    >
      <GitBranch className="h-3.5 w-3.5 text-info" aria-hidden />
      react/react <span className="text-fg-subtle">·</span> fixtures/dom
      <span className="text-fg-subtle">·</span>
      <span className="tabular-nums text-fg-muted">
        {catalog || "–"} cases · Gen {generation || 1}
      </span>
    </motion.p>
  );
}

export function TopBar() {
  const reactRun = useAgentStore((s) => s.mode === "live" && (s.liveCase !== null || s.liveCatalogSize > 0));
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
          <span className="mt-1 hidden text-[10px] uppercase tracking-[0.16em] text-fg-subtle md:block">Recursive self-improving QA</span>
        </span>
      </h1>

      <span role="separator" aria-orientation="vertical" className="hidden h-6 w-px bg-card-border sm:block" />
      {reactRun ? <SuiteChip /> : <ScenarioMenu />}

      <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <SponsorTags />
        <span role="separator" aria-orientation="vertical" className="hidden h-6 w-px bg-card-border lg:block" />
        <SystemHealth />
      </span>
    </motion.header>
  );
}

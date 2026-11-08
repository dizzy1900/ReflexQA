"use client";

import { History, ScanEye, Square } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { Button } from "../ui/Button";
import { ScenarioMenu } from "./ScenarioMenu";
import { SponsorTags } from "./SponsorTags";
import { SystemHealth } from "./SystemHealth";

function Slash() {
  return (
    <span aria-hidden className="select-none text-fg-subtle">
      /
    </span>
  );
}

/** What is under test: the React suite during a live run, the checkout demo otherwise. */
function Breadcrumb() {
  const reactRun = useAgentStore(
    (s) =>
      (s.mode === "live" && (s.liveCase !== null || s.liveCatalogSize > 0)) ||
      (s.mode !== "live" && s.agentStatus === "idle" && !s.isPlaying),
  );
  const running = useAgentStore((s) => s.mode === "live" && s.liveCatalogSize > 0);
  const generation = useAgentStore((s) => s.liveGeneration);
  const catalog = useAgentStore((s) => s.liveCatalogSize);

  if (reactRun) {
    return (
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        <span className="text-fg-muted">react/react</span>
        <Slash />
        <span className="truncate text-fg">fixtures/dom</span>
        <span className="ml-2 hidden font-mono text-xs tabular-nums text-fg-subtle sm:inline">
          {catalog || 32} cases{running ? ` · gen ${generation || 1}` : ""}
        </span>
      </nav>
    );
  }
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
      <span className="text-fg-muted">Checkout demo</span>
      <Slash />
      <ScenarioMenu />
    </nav>
  );
}

/** Primary actions: run the live React campaign, or replay the last recorded one. */
function RunActions() {
  const runLive = useAgentStore((s) => s.runLive);
  const stopLive = useAgentStore((s) => s.stopLive);
  const replayLastLive = useAgentStore((s) => s.replayLastLive);
  const liveRunning = useAgentStore((s) => s.liveRunning);
  const liveReplay = useAgentStore((s) => s.liveReplay);

  if (liveRunning) {
    return (
      <Button variant="secondary" size="sm" onClick={stopLive} aria-keyshortcuts="L">
        <Square className="h-3 w-3 fill-current" aria-hidden />
        {liveReplay ? "Stop replay" : "Stop run"}
      </Button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={replayLastLive} title="Stream the last recorded real run. No API credits used.">
        <History className="h-3.5 w-3.5" aria-hidden />
        Replay run
      </Button>
      <Button variant="primary" size="sm" onClick={runLive} aria-keyshortcuts="L" title="Meta drives · SubQ judges">
        Run live
        <span aria-hidden className="font-mono text-[10px] text-black/45">
          L
        </span>
      </Button>
    </span>
  );
}

export function TopBar() {
  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-card-border bg-background px-4">
      <h1 className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-fg text-black">
          <ScanEye className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="text-sm font-semibold tracking-tight text-fg">ReflexQA</span>
      </h1>
      <Slash />
      <Breadcrumb />

      <span className="ml-auto flex items-center gap-5">
        <SponsorTags />
        <SystemHealth />
        <RunActions />
      </span>
    </header>
  );
}

"use client";

import { GitPullRequest, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "../../lib/cn";
import { GOLDEN_DURATION_MS, useAgentStore } from "../../store/useAgentStore";
import { Kbd } from "../ui/Kbd";
import { SCENARIOS, SCENARIO_TONE_STYLES, useLiveFaults, type ScenarioMeta } from "./scenarios";
import { SpeedToggle } from "./SpeedToggle";
import { TimerRing } from "./TimerRing";
import { useDirectorShortcuts, type ShortcutKey } from "./useDirectorShortcuts";

const GOLDEN_SECONDS = GOLDEN_DURATION_MS / 1000;

/** Small flat toolbar button: text only until hovered, hairline ring when active. */
export const toolButton =
  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-fg-muted outline-none " +
  "transition-colors duration-150 ease-out hover:bg-white/[0.06] hover:text-fg " +
  "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40 " +
  "disabled:pointer-events-none disabled:opacity-40";

function Divider() {
  return <span role="separator" aria-orientation="vertical" className="mx-1 hidden h-4 w-px bg-card-border sm:block" />;
}

function ScenarioToggle({ scenario, live, onSelect }: { scenario: ScenarioMeta; live: boolean; onSelect: (id: ScenarioMeta["id"]) => void }) {
  const styles = SCENARIO_TONE_STYLES[scenario.tone];
  return (
    <button
      type="button"
      aria-pressed={live}
      title={scenario.hint}
      onClick={() => onSelect(scenario.id)}
      className={cn(toolButton, live && "bg-white/[0.06] text-fg ring-1 ring-inset ring-card-border-hover")}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", live ? styles.dot : "bg-fg-subtle")} />
      {scenario.label}
    </button>
  );
}

/**
 * Bottom toolbar for the scripted checkout demo and playback. The live React run lives in the top bar.
 * Everything here drives the same store actions as the keyboard.
 */
export function DirectorDock() {
  const runGoldenDemo = useAgentStore((s) => s.runGoldenDemo);
  const injectChaos = useAgentStore((s) => s.injectChaos);
  const resetState = useAgentStore((s) => s.resetState);
  const togglePlay = useAgentStore((s) => s.togglePlay);
  const openPrModal = useAgentStore((s) => s.openPrModal);
  const isPlaying = useAgentStore((s) => s.isPlaying);
  const hasRun = useAgentStore((s) => s.durationMs > 0 || s.agentStatus !== "idle");
  const paused = useAgentStore((s) => !s.isPlaying && s.elapsedMs > 0 && s.elapsedMs < s.durationMs);
  const faults = useLiveFaults();
  const runLive = useAgentStore((s) => s.runLive);
  const stopLive = useAgentStore((s) => s.stopLive);
  const liveRunning = useAgentStore((s) => s.liveRunning);

  const pressed: ShortcutKey | null = useDirectorShortcuts({
    golden: () => void runGoldenDemo(),
    live: () => (liveRunning ? stopLive() : runLive()),
    playPause: togglePlay,
    reset: resetState,
    pr: openPrModal,
  });

  const playLabel = isPlaying ? "Pause" : paused ? "Resume" : "Play";

  return (
    <nav
      aria-label="Demo controls"
      className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-t border-card-border bg-background px-3"
    >
      <span className="mr-2 hidden text-xs text-fg-subtle md:block">Checkout demo</span>

      <button type="button" aria-keyshortcuts="G" onClick={() => void runGoldenDemo()} className={toolButton}>
        <TimerRing />
        Scripted walkthrough
        <span className="font-mono tabular-nums text-fg-subtle">{GOLDEN_SECONDS}s</span>
        <Kbd pressed={pressed === "golden"}>G</Kbd>
      </button>

      <Divider />

      <span role="group" aria-label="Failure injection" className="flex items-center gap-0.5">
        {SCENARIOS.map((scenario) => (
          <ScenarioToggle key={scenario.id} scenario={scenario} live={faults[scenario.id]} onSelect={injectChaos} />
        ))}
      </span>

      <Divider />

      <span role="group" aria-label="Playback" className="flex items-center gap-1">
        <button
          type="button"
          aria-keyshortcuts="Space"
          aria-label={`${playLabel} (Space)`}
          onClick={togglePlay}
          className={cn(toolButton, paused && "text-fg")}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
          <span className="w-10 text-left">{playLabel}</span>
          <Kbd pressed={pressed === "playPause"}>Space</Kbd>
        </button>
        <SpeedToggle />
      </span>

      <span className="ml-auto flex items-center gap-1">
        <button type="button" aria-keyshortcuts="P" onClick={openPrModal} className={toolButton}>
          <GitPullRequest className="h-3.5 w-3.5" aria-hidden />
          Patch PR
          <Kbd pressed={pressed === "pr"}>P</Kbd>
        </button>
        <button type="button" aria-keyshortcuts="R" disabled={!hasRun} onClick={resetState} className={toolButton}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset
          <Kbd pressed={pressed === "reset"}>R</Kbd>
        </button>
      </span>
    </nav>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clapperboard, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring, springPop } from "../../lib/motion";
import { GOLDEN_DURATION_MS, useAgentStore } from "../../store/useAgentStore";
import { Kbd } from "../ui/Kbd";
import { SCENARIOS, SCENARIO_TONE_STYLES, useLiveFaults, type ScenarioMeta } from "./scenarios";
import { SpeedToggle } from "./SpeedToggle";
import { TimerRing } from "./TimerRing";
import { useDirectorShortcuts, type ShortcutKey } from "./useDirectorShortcuts";

const GOLDEN_SECONDS = GOLDEN_DURATION_MS / 1000;

const dockButton =
  "relative flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium outline-none ring-1 ring-inset " +
  "transition-[background-color,color,box-shadow] duration-200 ease-out " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/70 " +
  "disabled:pointer-events-none disabled:opacity-40";

function Divider() {
  return <span role="separator" aria-orientation="vertical" className="hidden h-7 w-px bg-white/10 sm:block" />;
}

interface ToggleProps {
  scenario: ScenarioMeta;
  live: boolean;
  onSelect: (id: ScenarioMeta["id"]) => void;
}

function ScenarioToggle({ scenario, live, onSelect }: ToggleProps) {
  const styles = SCENARIO_TONE_STYLES[scenario.tone];
  return (
    <motion.button
      type="button"
      aria-pressed={live}
      title={scenario.hint}
      onClick={() => onSelect(scenario.id)}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={spring}
      className={cn(dockButton, live ? styles.active : cn("bg-white/[0.04] text-fg-muted ring-card-border", styles.idle))}
    >
      <scenario.icon className="h-3.5 w-3.5" aria-hidden />
      {scenario.label}
      {live ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springPop}
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-full", styles.dot)}
        />
      ) : null}
    </motion.button>
  );
}

/**
 * Floating presenter dock. Everything here drives the same store actions as the keyboard,
 * so a mouse click and a key press are interchangeable mid-pitch.
 */
export function DirectorDock() {
  const runGoldenDemo = useAgentStore((s) => s.runGoldenDemo);
  const injectChaos = useAgentStore((s) => s.injectChaos);
  const resetState = useAgentStore((s) => s.resetState);
  const togglePlay = useAgentStore((s) => s.togglePlay);
  const isPlaying = useAgentStore((s) => s.isPlaying);
  const hasRun = useAgentStore((s) => s.durationMs > 0 || s.agentStatus !== "idle");
  const paused = useAgentStore((s) => !s.isPlaying && s.elapsedMs > 0 && s.elapsedMs < s.durationMs);
  const faults = useLiveFaults();
  const reduceMotion = useReducedMotion();

  const pressed: ShortcutKey | null = useDirectorShortcuts({
    golden: () => void runGoldenDemo(),
    playPause: togglePlay,
    reset: resetState,
  });

  const playLabel = isPlaying ? "Pause" : paused ? "Resume" : "Play";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <motion.nav
        aria-label="Director Mode"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className={cn(
          "pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl p-2",
          "bg-white/[0.06] ring-1 ring-inset ring-white/15 backdrop-blur-xl",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_24px_60px_-20px_rgba(0,0,0,0.9)]",
        )}
      >
        <span className="hidden items-center gap-1.5 pl-2 pr-1 text-[10px] font-medium uppercase tracking-[0.14em] text-fg-subtle 2xl:flex">
          <Clapperboard className="h-3.5 w-3.5" aria-hidden />
          Director Mode
        </span>

        <span className="relative flex">
          {reduceMotion ? null : (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-2xl bg-accent/40 blur-lg"
              animate={{ opacity: isPlaying ? 0.35 : [0.25, 0.7, 0.25] }}
              transition={isPlaying ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <motion.button
            type="button"
            aria-keyshortcuts="G"
            onClick={() => void runGoldenDemo()}
            animate={{ scale: pressed === "golden" ? 0.96 : 1 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className={cn(
              "relative flex h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-accent to-vision-nominal/90 pl-2 pr-3.5 text-sm font-semibold text-white outline-none",
              "ring-1 ring-inset ring-white/25 shadow-glow-accent transition-[filter,box-shadow] duration-200 ease-out",
              "hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
            )}
          >
            <TimerRing />
            <span className="flex flex-col items-start leading-tight">
              <span>Run Golden Demo</span>
              <span className="text-[11px] font-medium text-white/70">({GOLDEN_SECONDS}s Showcase)</span>
            </span>
            <Kbd tone="onAccent" pressed={pressed === "golden"}>G</Kbd>
          </motion.button>
        </span>

        <Divider />

        <span role="group" aria-label="Failure injection" className="flex items-center gap-1.5">
          {SCENARIOS.map((scenario) => (
            <ScenarioToggle key={scenario.id} scenario={scenario} live={faults[scenario.id]} onSelect={injectChaos} />
          ))}
        </span>

        <Divider />

        <span role="group" aria-label="Playback" className="flex items-center gap-1.5">
          <motion.button
            type="button"
            aria-keyshortcuts="Space"
            aria-label={`${playLabel} (Space)`}
            onClick={togglePlay}
            animate={{ scale: pressed === "playPause" ? 0.95 : 1 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className={cn(
              dockButton,
              "bg-white/[0.06] text-fg ring-card-border-hover hover:bg-white/[0.1] hover:shadow-glow-info focus-visible:shadow-glow-info",
              paused && "text-warning ring-warning/40 shadow-glow-warning",
            )}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
            <span className="w-11 text-left">{playLabel}</span>
            <Kbd pressed={pressed === "playPause"}>Space</Kbd>
          </motion.button>
          <SpeedToggle />
        </span>

        <Divider />

        <motion.button
          type="button"
          aria-keyshortcuts="R"
          disabled={!hasRun}
          onClick={resetState}
          animate={{ scale: pressed === "reset" ? 0.95 : 1 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className={cn(
            dockButton,
            "bg-white/[0.04] text-fg-muted ring-card-border hover:text-fg hover:ring-card-border-hover hover:shadow-glow-danger focus-visible:shadow-glow-danger",
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset
          <Kbd pressed={pressed === "reset"}>R</Kbd>
        </motion.button>
      </motion.nav>
    </div>
  );
}

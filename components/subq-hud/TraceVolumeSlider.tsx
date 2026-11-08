"use client";

import { useId, type ChangeEvent } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
import { formatInt, TRACE_MAX_TOKENS, TRACE_MIN_TOKENS, TRACE_STEP_TOKENS } from "./subqModel";

interface TraceVolumeSliderProps {
  /** Exact token count in play. May sit between steps (the 384,120 default); the first drag lands on the grid. */
  tokens: number;
  /** Spring-smoothed copy of `tokens`, so the fill glides in step with the chart. */
  smooth: MotionValue<number>;
  onChange: (tokens: number) => void;
  /** Offered only while the viewer has taken control of the depth. */
  onReset?: () => void;
}

const SPAN = TRACE_MAX_TOKENS - TRACE_MIN_TOKENS;

/* The thumb is styled per engine; the input itself stays a native range so keyboard, touch and AT behaviour are free. */
const thumb =
  "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none " +
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-vision-nominal " +
  "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-glow-vision-nominal " +
  "[&::-webkit-slider-thumb]:transition-[transform,box-shadow] [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-out " +
  "[&:hover::-webkit-slider-thumb]:scale-110 [&:active::-webkit-slider-thumb]:scale-125 " +
  "[&:focus-visible::-webkit-slider-thumb]:scale-125 [&:focus-visible::-webkit-slider-thumb]:outline [&:focus-visible::-webkit-slider-thumb]:outline-2 " +
  "[&:focus-visible::-webkit-slider-thumb]:outline-offset-2 [&:focus-visible::-webkit-slider-thumb]:outline-accent/70 " +
  "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 " +
  "[&::-moz-range-thumb]:border-vision-nominal [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-glow-vision-nominal " +
  "[&::-moz-range-thumb]:transition-[transform,box-shadow] [&::-moz-range-thumb]:duration-200 [&:hover::-moz-range-thumb]:scale-110 " +
  "[&:focus-visible::-moz-range-thumb]:outline [&:focus-visible::-moz-range-thumb]:outline-2 [&:focus-visible::-moz-range-thumb]:outline-offset-2 " +
  "[&:focus-visible::-moz-range-thumb]:outline-accent/70";

export function TraceVolumeSlider({ tokens, smooth, onChange, onReset }: TraceVolumeSliderProps) {
  const id = useId();
  const progress = useTransform(smooth, (n) => Math.min(1, Math.max(0, (n - TRACE_MIN_TOKENS) / SPAN)));

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-2 rounded-lg bg-white/[0.02] px-3 py-2.5 ring-1 ring-inset ring-card-border transition-[box-shadow,background-color] duration-200 ease-out focus-within:bg-white/[0.04] focus-within:ring-card-border-hover"
    >
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[11px] font-medium leading-tight text-fg-muted">
          Simulated Trace Volume (Context Depth)
        </label>
        <div className="flex shrink-0 items-center gap-2">
          <output htmlFor={id} className="font-mono text-xs font-semibold tabular-nums text-vision-nominal">
            {formatInt(tokens)} <span className="font-normal text-fg-subtle">tokens</span>
          </output>
          {onReset ? (
            <motion.button
              type="button"
              onClick={onReset}
              aria-label="Reset context depth to default"
              title="Reset to default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.92 }}
              transition={spring}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-md text-fg-muted outline-none ring-1 ring-inset ring-card-border",
                "transition-[background-color,color,box-shadow] duration-200 ease-out",
                "hover:bg-white/[0.06] hover:text-fg hover:shadow-glow-info",
                "focus-visible:text-fg focus-visible:shadow-glow-info focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/70",
              )}
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
            </motion.button>
          ) : null}
        </div>
      </div>

      <div className="relative flex h-5 items-center">
        <span aria-hidden className="absolute inset-x-2 h-1 rounded-full bg-white/15" />
        <motion.span
          aria-hidden
          className="absolute inset-x-2 h-1 origin-left rounded-full bg-fg"
          style={{ scaleX: progress }}
        />
        <input
          id={id}
          type="range"
          min={TRACE_MIN_TOKENS}
          max={TRACE_MAX_TOKENS}
          step={TRACE_STEP_TOKENS}
          value={tokens}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
          aria-valuetext={`${formatInt(tokens)} tokens`}
          data-trace-slider
          className={cn(
            "relative z-10 m-0 h-5 w-full cursor-pointer appearance-none bg-transparent outline-none",
            "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent",
            "[&::-webkit-slider-thumb]:-mt-[5px] [&::-moz-range-track]:bg-transparent",
            thumb,
          )}
        />
      </div>

      <p className="flex justify-between font-mono text-[9px] tabular-nums text-fg-subtle" aria-hidden>
        <span>{formatInt(TRACE_MIN_TOKENS)}</span>
        <span>{formatInt(TRACE_MAX_TOKENS)}</span>
      </p>
    </form>
  );
}

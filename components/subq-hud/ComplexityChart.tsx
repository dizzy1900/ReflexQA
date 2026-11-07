"use client";

import { useId } from "react";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { ChartLine } from "lucide-react";
import { AdvantageCallout } from "./AdvantageCallout";
import { HudPanel } from "./HudPanel";
import {
  formatInt,
  formatLatency,
  formatUsd,
  frontierCostUsd,
  FRONTIER_USD_PER_MILLION_TOKENS,
  quadraticLatencyMs,
  SNAP_CEILING_MS,
  subqCostUsd,
  subqLatencyMs,
  SUBQ_USD_PER_MILLION_TOKENS,
  TRACE_MAX_TOKENS,
  TRACE_MIN_TOKENS,
} from "./subqModel";
import { TraceVolumeSlider } from "./TraceVolumeSlider";
import { useSmoothValue } from "./useSmoothValue";

/* Plot geometry in viewBox units. The chart scales with its container; text stays crisp because it is real SVG text. */
const W = 560;
const H = 204;
const LEFT = 46;
const RIGHT = 14;
const TOP = 18;
/** Zero sits a few units above the axis so the near-flat O(N) curve is not hidden by the axis line. */
const ZERO_Y = 172;
const AXIS_Y = 180;
const PLOT_W = W - LEFT - RIGHT;

/* Latency spans 10ms to 1,000s, so the y-axis is logarithmic: it is the only way the flat O(N) line and the 480s O(N²) blow-up share one plot. */
const Y_MIN_MS = 10;
const Y_MAX_MS = 1_000_000;
const DECADES = Math.log10(Y_MAX_MS / Y_MIN_MS);

const xOf = (tokens: number) => LEFT + (tokens / TRACE_MAX_TOKENS) * PLOT_W;
const yOf = (ms: number) => ZERO_Y - (Math.log10(Math.max(ms, Y_MIN_MS) / Y_MIN_MS) / DECADES) * (ZERO_Y - TOP);

const line = (samples: number, latency: (tokens: number) => number) =>
  `M${Array.from({ length: samples + 1 }, (_, i) => {
    const tokens = TRACE_MIN_TOKENS + (i / samples) * (TRACE_MAX_TOKENS - TRACE_MIN_TOKENS);
    return `${xOf(tokens).toFixed(1)} ${yOf(latency(tokens)).toFixed(1)}`;
  }).join(" L")}`;

const QUADRATIC_LINE = line(90, quadraticLatencyMs);
const QUADRATIC_AREA = `${QUADRATIC_LINE} L${xOf(TRACE_MAX_TOKENS)} ${ZERO_Y} L${xOf(TRACE_MIN_TOKENS)} ${ZERO_Y} Z`;
const SUBQ_LINE = line(40, subqLatencyMs);

const Y_TICKS = [
  { ms: 10, label: "10ms" },
  { ms: 100, label: "100ms" },
  { ms: 1000, label: "1s" },
  { ms: 10_000, label: "10s" },
  { ms: 100_000, label: "100s" },
  { ms: 1_000_000, label: "1,000s" },
] as const;
const X_TICKS = [0, 250_000, 500_000, 750_000, 1_000_000] as const;
const X_LABELS: Record<(typeof X_TICKS)[number], string> = {
  0: "0",
  250_000: "250k",
  500_000: "500k",
  750_000: "750k",
  1_000_000: "1M tokens",
};

const DRAW = { duration: 1.1, ease: "easeOut" } as const;

interface ComplexityChartProps {
  /** Context depth in play: the slider position, or the live trace while the demo drives. */
  tokens: number;
  onTokensChange: (tokens: number) => void;
  /** Present only while the viewer has taken over the depth. */
  onReset?: () => void;
}

export function ComplexityChart({ tokens, onTokensChange, onReset }: ComplexityChartProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const smooth = useSmoothValue(tokens);
  const uid = useId().replace(/:/g, "");
  const areaId = `${uid}-area`;
  const blurId = `${uid}-blur`;

  const markerX = useTransform(smooth, (n) => xOf(Math.min(n, TRACE_MAX_TOKENS)));
  const quadraticY = useTransform(smooth, (n) => yOf(quadraticLatencyMs(n)));
  const subqY = useTransform(smooth, (n) => yOf(subqLatencyMs(n)));
  const quadraticText = useTransform(smooth, (n) => formatLatency(quadraticLatencyMs(n)));
  const subqText = useTransform(smooth, (n) => formatLatency(subqLatencyMs(n)));
  const quadraticCost = useTransform(smooth, (n) => formatUsd(frontierCostUsd(n)));
  const subqCost = useTransform(smooth, (n) => formatUsd(subqCostUsd(n)));

  const draw = (delay = 0) =>
    reduceMotion
      ? { initial: false as const }
      : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { ...DRAW, delay } };

  return (
    <HudPanel
      id="subq-complexity-title"
      title="Algorithmic Complexity"
      icon={ChartLine}
      aside={
        <ul className="flex items-center gap-3 font-mono text-[10px] text-fg-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3.5 rounded-full bg-vision-fail shadow-glow-danger" />
            O(N²) Traditional attention
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3.5 rounded-full bg-vision-nominal shadow-glow-vision-nominal" />
            O(N) Subquadratic Snap
          </li>
        </ul>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Latency versus context length from 0 to ${formatInt(TRACE_MAX_TOKENS)} tokens on a logarithmic axis. Traditional attention grows quadratically to ${formatLatency(quadraticLatencyMs(TRACE_MAX_TOKENS))}. Subquadratic Snap stays linear, under ${SNAP_CEILING_MS} milliseconds.`}
        className="h-auto w-full overflow-visible"
      >
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1" className="text-vision-fail">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id={blurId} x="-10%" y="-60%" width="120%" height="220%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {Y_TICKS.map((tick) => (
          <g key={tick.label}>
            <line x1={LEFT} x2={W - RIGHT} y1={yOf(tick.ms)} y2={yOf(tick.ms)} className="stroke-white/[0.06]" />
            <text x={LEFT - 8} y={yOf(tick.ms) + 3} textAnchor="end" className="fill-fg-subtle font-mono text-[9px] tabular-nums">
              {tick.label}
            </text>
          </g>
        ))}
        {X_TICKS.map((tick) => (
          <text
            key={tick}
            x={xOf(tick)}
            y={AXIS_Y + 15}
            textAnchor={tick === TRACE_MAX_TOKENS ? "end" : "middle"}
            className="fill-fg-subtle font-mono text-[9px] tabular-nums"
          >
            {X_LABELS[tick]}
          </text>
        ))}
        <line x1={LEFT} x2={W - RIGHT} y1={AXIS_Y} y2={AXIS_Y} className="stroke-white/10" />

        <line
          x1={LEFT}
          x2={W - RIGHT}
          y1={yOf(SNAP_CEILING_MS)}
          y2={yOf(SNAP_CEILING_MS)}
          strokeDasharray="3 4"
          className="stroke-vision-nominal/40"
        />
        <text x={W - RIGHT - 4} y={yOf(SNAP_CEILING_MS) - 6} textAnchor="end" className="fill-vision-nominal/80 font-mono text-[9px] tabular-nums">
          {SNAP_CEILING_MS}ms ceiling
        </text>

        <motion.path
          d={QUADRATIC_AREA}
          fill={`url(#${areaId})`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5 }}
        />
        <motion.path
          d={QUADRATIC_LINE}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          className="stroke-vision-fail/40"
          filter={`url(#${blurId})`}
          {...draw()}
        />
        <motion.path d={QUADRATIC_LINE} fill="none" strokeWidth={2} strokeLinecap="round" className="stroke-vision-fail" {...draw()} />

        <motion.path d={SUBQ_LINE} fill="none" strokeWidth={7} strokeLinecap="round" className="stroke-vision-nominal/60" filter={`url(#${blurId})`} {...draw(0.15)} />
        <motion.path d={SUBQ_LINE} fill="none" strokeWidth={2} strokeLinecap="round" className="stroke-vision-nominal" {...draw(0.15)} />

        <motion.g style={{ x: markerX }} data-chart-marker>
          <line y1={TOP - 8} y2={ZERO_Y} strokeDasharray="2 4" className="stroke-white/20" />
          <motion.g style={{ y: quadraticY }} data-chart-quadratic-point>
            <circle r={3.5} className="fill-background stroke-vision-fail" strokeWidth={1.5} />
          </motion.g>
          <motion.g style={{ y: subqY }} data-chart-snap-point>
            {reduceMotion ? null : (
              <motion.circle
                r={7}
                className="fill-vision-nominal/30"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <circle r={8} className="fill-vision-nominal/50" filter={`url(#${blurId})`} />
            <circle r={4} className="fill-white stroke-vision-nominal" strokeWidth={2} />
          </motion.g>
        </motion.g>
      </svg>

      <TraceVolumeSlider tokens={tokens} smooth={smooth} onChange={onTokensChange} onReset={onReset} />

      <ul className="grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
        <li className="flex flex-col gap-0.5 rounded-lg bg-vision-fail/[0.06] px-2.5 py-2 ring-1 ring-inset ring-vision-fail/20">
          <p className="text-[10px] text-fg-muted">Frontier LLM · O(N²)</p>
          <p className="text-sm font-semibold text-vision-fail" data-readout="quadratic">
            <motion.span>{quadraticText}</motion.span>
          </p>
          <p className="text-[10px] text-fg-subtle" data-readout="frontier-cost">
            <motion.span className="text-fg-muted">{quadraticCost}</motion.span> at ${FRONTIER_USD_PER_MILLION_TOKENS.toFixed(2)} / 1M tokens
          </p>
        </li>
        <li className="flex flex-col gap-0.5 rounded-lg bg-vision-nominal/[0.06] px-2.5 py-2 ring-1 ring-inset ring-vision-nominal/20">
          <p className="text-[10px] text-fg-muted">Subquadratic Snap · O(N)</p>
          <p className="text-sm font-semibold text-vision-nominal" data-readout="subq">
            <motion.span>{subqText}</motion.span>
          </p>
          <p className="text-[10px] text-fg-subtle" data-readout="subq-cost">
            <motion.span className="text-fg-muted">{subqCost}</motion.span> at ${SUBQ_USD_PER_MILLION_TOKENS.toFixed(2)} / 1M tokens
          </p>
        </li>
      </ul>

      <AdvantageCallout smooth={smooth} />
    </HudPanel>
  );
}

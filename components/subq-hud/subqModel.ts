import { COST_PER_HEAL_GPT4O, COST_PER_HEAL_REFLEX, TOKENS_SURGE_TARGET } from "../../store/useAgentStore";

/* Context-depth benchmark: the slider's range and the closed-form models behind every number it drives. */
export const TRACE_MIN_TOKENS = 10_000;
export const TRACE_MAX_TOKENS = 1_000_000;
export const TRACE_STEP_TOKENS = 10_000;
/** The slider opens on the same trace the golden demo ingests. */
export const TRACE_DEFAULT_TOKENS = TOKENS_SURGE_TARGET;
/** The Subquadratic curve must stay under this at every point on the chart. */
export const SNAP_CEILING_MS = 240;

export const SUBQ_USD_PER_MILLION_TOKENS = 0.04;
export const FRONTIER_USD_PER_MILLION_TOKENS = 2.5;

/** Linear in context length with a fixed 140ms floor. */
export function subqLatencyMs(tokens: number): number {
  return 140 + (tokens / 100_000) * 10;
}

/** Quadratic full-attention latency: 480s at 1M tokens. */
export function quadraticLatencyMs(tokens: number): number {
  return (tokens / 50_000) ** 2 * 1200;
}

/** How many times faster the linear engine resolves a trace of this size. */
export function advantageFactor(tokens: number): number {
  return quadraticLatencyMs(tokens) / subqLatencyMs(tokens);
}

/** Smallest context where the linear engine wins: solves 1200·(t/50k)² = 140 + t/10k, rounded to the nearest hundred. */
export const BREAK_EVEN_TOKENS = Math.round((1 + Math.sqrt(1 + 4 * 48 * 140)) / (2 * 48) * 10_000 / 100) * 100;

export function subqCostUsd(tokens: number): number {
  return (tokens / 1_000_000) * SUBQ_USD_PER_MILLION_TOKENS;
}

export function frontierCostUsd(tokens: number): number {
  return (tokens / 1_000_000) * FRONTIER_USD_PER_MILLION_TOKENS;
}

export const BENCHMARK_COST_REDUCTION_PERCENT = (1 - SUBQ_USD_PER_MILLION_TOKENS / FRONTIER_USD_PER_MILLION_TOKENS) * 100;

/* Golden-demo costs: per-heal prices measured on the 384,120-token trace, scaled by the live buffer while it surges. */
export function demoSnapCostUsd(tokens: number): number {
  return (COST_PER_HEAL_REFLEX * tokens) / TOKENS_SURGE_TARGET;
}

export function demoBaselineCostUsd(tokens: number): number {
  return (COST_PER_HEAL_GPT4O * tokens) / TOKENS_SURGE_TARGET;
}

export const DEMO_COST_REDUCTION_PERCENT = (1 - COST_PER_HEAL_REFLEX / COST_PER_HEAL_GPT4O) * 100;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function formatInt(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

/** Milliseconds below a second, seconds above: 178ms, 70.8s, 480.0s. */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  return `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`;
}

/** One decimal under 10x so the early, modest gains do not all read as "1x" or "2x". */
export function formatMultiple(value: number): string {
  return `${value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString("en-US")}x`;
}

export interface RepoArtifact {
  id: string;
  /** Directory part, shown muted. */
  dir: string;
  name: string;
  kind: "source" | "state" | "trace";
  /** Line count, shown only for artifacts large enough that it matters. */
  lines?: number;
}

/** What the Subquadratic engine ingests in one pass, in reconcile order. */
export const REPO_ARTIFACTS: readonly RepoArtifact[] = [
  { id: "submit-button", dir: "/frontend/checkout/", name: "SubmitButton.tsx", kind: "source" },
  { id: "payment-machine", dir: "/state/", name: "paymentMachine.ts", kind: "state" },
  { id: "playwright-log", dir: "/traces/", name: "playwright-run-9481.log", kind: "trace", lines: 280_000 },
];

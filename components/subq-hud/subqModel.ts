import {
  COST_PER_HEAL_GPT4O,
  COST_PER_HEAL_REFLEX,
  SUBQ_PARSE_MS,
  TOKENS_SURGE_TARGET,
} from "../../store/useAgentStore";

/** Right edge of the complexity chart. */
export const CHART_MAX_TOKENS = 400_000;
/** Full-attention latency at `CHART_MAX_TOKENS`; the O(N²) curve is anchored here. */
export const TRADITIONAL_MAX_SECONDS = 14.2;
/** The Subquadratic curve must stay under this at every point on the chart. */
export const SNAP_CEILING_MS = 200;

/** Quadratic in context length. */
export function traditionalSeconds(tokens: number): number {
  return TRADITIONAL_MAX_SECONDS * (tokens / CHART_MAX_TOKENS) ** 2;
}

/** Linear in context length, calibrated so the full 384k-token trace resolves in `SUBQ_PARSE_MS`. */
export function snapMs(tokens: number): number {
  return (SUBQ_PARSE_MS * tokens) / TOKENS_SURGE_TARGET;
}

/** Both costs are per-input-token, so they scale with the live context buffer. */
export function snapCostUsd(tokens: number): number {
  return (COST_PER_HEAL_REFLEX * tokens) / TOKENS_SURGE_TARGET;
}

export function baselineCostUsd(tokens: number): number {
  return (COST_PER_HEAL_GPT4O * tokens) / TOKENS_SURGE_TARGET;
}

export const COST_REDUCTION_PERCENT = (1 - COST_PER_HEAL_REFLEX / COST_PER_HEAL_GPT4O) * 100;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function formatInt(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
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

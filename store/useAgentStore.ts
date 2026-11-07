import { create } from "zustand";
import { Timeline } from "./timeline";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type AgentStatus =
  | "idle"
  | "observing"
  | "analyzing"
  | "action_attempted"
  | "regression_tripped"
  | "subq_healing"
  | "healed_execution"
  | "success";

export type ActiveScenario = "broken_selector" | "modal_obstruction" | "css_layout_shift";
export type BoxStatus = "nominal" | "evaluating" | "failed" | "healed";
export type TraceStatus = "idle" | "parsed" | "patched";
export type LogOrigin = "META_VISION" | "SUBQ_SNAP" | "DOM_RUNTIME";
export type LogSeverity = "info" | "warn" | "alert" | "success";
export type PlaybackSpeed = 1 | 2;

export interface Metrics {
  tokensIngested: number;
  latencyMs: number;
  costSaved: number;
  confidenceScore: number;
}

export interface Cursor {
  x: number;
  y: number;
  isClicking: boolean;
  targetLabel: string;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  status: BoxStatus;
}

export interface TraceNode {
  file: string;
  lines: number;
  status: TraceStatus;
}

export interface LogEntry {
  id: string;
  /** Timeline clock, `mm:ss.mmm`. */
  time: string;
  origin: LogOrigin;
  message: string;
  severity: LogSeverity;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A modal covering the target. `dismissX/Y` is the centre of its close control. */
export interface Obstruction extends Rect {
  label: string;
  dismissX: number;
  dismissY: number;
}

/**
 * Ground truth of the element under test as the page actually renders it.
 * Meta Vision's `boundingBoxes` are the agent's belief; this is what the DOM does.
 */
export interface TargetElement extends Rect {
  selector: string;
  obstruction: Obstruction | null;
  /** True when the action bar's flex order is reversed. */
  layoutReversed: boolean;
}

export interface AgentState {
  agentStatus: AgentStatus;
  activeScenario: ActiveScenario;
  metrics: Metrics;
  cursor: Cursor;
  boundingBoxes: BoundingBox[];
  traceTree: TraceNode[];
  logs: LogEntry[];
  playbackSpeed: PlaybackSpeed;
  isPlaying: boolean;

  targetElement: TargetElement;
  /** True while the order confirmation modal is on screen. */
  orderConfirmed: boolean;
  /** Increments once per success particle burst (0 = none yet). Key canvas effects on it. */
  particleBurstId: number;
  /** Increments each time the Subquadratic HUD should flash (0 = none yet). */
  hudFlashId: number;
  /** True while the auto-generated self-heal pull request is on screen. */
  prModalOpen: boolean;
  /** Virtual timeline position, scaled by playback speed. */
  elapsedMs: number;
  durationMs: number;
}

export interface AgentActions {
  /**
   * Runs the scripted 45s demo from a clean state. Resolves when the run ends,
   * and also when it is cancelled by reset, chaos, or a new run.
   */
  runGoldenDemo: () => Promise<void>;
  /** Aborts any run, re-arms the board, and plays the selected failure and its heal. */
  injectChaos: (type: ActiveScenario) => void;
  /** Stops everything and restores initial state. Keeps `playbackSpeed`. */
  resetState: () => void;
  /** Pauses or resumes the current run. Starts the golden demo when nothing is running. */
  togglePlay: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  /** Closes the obstructing modal, as a user (or the agent's click) would. */
  dismissObstruction: () => void;
  openPrModal: () => void;
  closePrModal: () => void;
}

export type AgentStore = AgentState & AgentActions;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

export const TARGET_VIEWPORT = { w: 1280, h: 800 } as const;

export const TOKENS_BASELINE = 12_400;
export const TOKENS_SURGE_TARGET = 384_120;
export const LATENCY_RANGE_MS = [140, 192] as const;
export const CONFIDENCE_RANGE = [0.94, 0.998] as const;
export const COST_PER_HEAL_REFLEX = 0.0034;
export const COST_PER_HEAL_GPT4O = 0.841;
/** Dollars saved by one heal versus the GPT-4o baseline. */
export const COST_SAVED_PER_HEAL = round(COST_PER_HEAL_GPT4O - COST_PER_HEAL_REFLEX, 4);

/** Golden demo stage start times, in ms from the start of the run. */
export const GOLDEN_STAGE_MS = {
  scan: 0,
  mutation: 2500,
  clickFail: 3500,
  subqHud: 4500,
  ocrFallback: 6000,
  recovery: 7500,
} as const;
export const GOLDEN_DURATION_MS = 45_000;

/** The 384k-token repo parse reported by the Subquadratic HUD. */
export const SUBQ_PARSE_MS = 184;

export const CHECKOUT_SELECTOR = "#checkout-btn";
export const MUTATED_SELECTOR = "#pay-v2-carrier";
export const RESERVATION_ID = "HS-48213";
/** Id of the bounding box that tracks the checkout button. */
export const TARGET_BOX_ID = "checkout-btn";

/*
 * These rects are in the target viewport's pixel space and must match the layout in
 * components/target/CheckoutActionBar.tsx and SecurityNoticeModal.tsx.
 */
const CHECKOUT_RECT: Rect = { x: 920, y: 640, w: 240, h: 56 };
/** The v2 carrier markup adds right padding, so the button sits 72px further left. */
export const V2_RECT: Rect = { ...CHECKOUT_RECT, x: 848 };
/** `flex-row-reverse` on the action bar moves the button to the opposite edge. */
const REVERSED_RECT: Rect = { ...CHECKOUT_RECT, x: 120 };
const TENANT_MODAL: Obstruction = {
  label: "Security notice modal",
  x: 320,
  y: 160,
  w: 640,
  h: 480,
  dismissX: 928,
  dismissY: 192,
};

const SCAN_REGIONS: ReadonlyArray<Omit<BoundingBox, "status">> = [
  { id: "hdr", x: 0, y: 0, w: 1280, h: 72, label: "Header nav" },
  { id: "summary", x: 96, y: 112, w: 520, h: 480, label: "Order summary" },
  { id: "billing", x: 648, y: 112, w: 536, h: 480, label: "Billing form" },
  { id: TARGET_BOX_ID, ...CHECKOUT_RECT, label: CHECKOUT_SELECTOR },
];

const TRACE_FILES: ReadonlyArray<Pick<TraceNode, "file" | "lines">> = [
  { file: "src/app/checkout/page.tsx", lines: 412 },
  { file: "src/components/CompleteReservationButton.tsx", lines: 138 },
  { file: "src/components/TenantConfirmModal.tsx", lines: 164 },
  { file: "src/components/OrderSummary.tsx", lines: 264 },
  { file: "src/components/BillingForm.tsx", lines: 191 },
  { file: "src/hooks/useReservation.ts", lines: 187 },
  { file: "src/lib/selectors.ts", lines: 96 },
  { file: "src/api/reservations.ts", lines: 223 },
  { file: "src/styles/layout.css", lines: 540 },
];

const MAX_LOGS = 200;
const FRAME_MS = 16;
/** Caps real time per frame so a throttled background tab slows the demo instead of skipping it. */
const MAX_FRAME_MS = 100;
const AMBIENT_INTERVAL_MS = 400;
const CLICK_HOLD_MS = 250;
const MOVE_MS = 1200;
const PATCH_DELAY_MS = 500;
const SETTLE_DELAY_MS = 400;
const CHAOS_TAIL_MS = 4000;
/** How long the confirmed order stays on screen before the self-heal PR slides in. */
const PR_MODAL_DELAY_MS = 1200;

/** Timing of each healing beat, relative to the moment the fault is injected. */
const HEAL_OFFSET = {
  fault: 0,
  attempt: (GOLDEN_STAGE_MS.clickFail - GOLDEN_STAGE_MS.mutation) / 2,
  trip: GOLDEN_STAGE_MS.clickFail - GOLDEN_STAGE_MS.mutation,
  subq: GOLDEN_STAGE_MS.subqHud - GOLDEN_STAGE_MS.mutation,
  reidentify: GOLDEN_STAGE_MS.ocrFallback - GOLDEN_STAGE_MS.mutation,
  recover: GOLDEN_STAGE_MS.recovery - GOLDEN_STAGE_MS.mutation,
} as const;

const CONFIDENCE_BAND: Record<AgentStatus, readonly [number, number]> = {
  idle: [0.97, 0.985],
  observing: [0.96, 0.985],
  analyzing: [0.965, 0.985],
  action_attempted: [0.955, 0.98],
  regression_tripped: [0.94, 0.96],
  subq_healing: [0.95, 0.975],
  healed_execution: [0.975, 0.995],
  success: [0.988, 0.998],
};

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                              */
/* -------------------------------------------------------------------------- */

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function center(rect: Rect): { x: number; y: number } {
  return { x: Math.round(rect.x + rect.w / 2), y: Math.round(rect.y + rect.h / 2) };
}

function formatClock(ms: number): string {
  const total = Math.floor(ms);
  const minutes = Math.floor(total / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  const millis = total % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatInt(value: number): string {
  return value.toLocaleString("en-US");
}

function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

function createTraceTree(): TraceNode[] {
  return TRACE_FILES.map((f) => ({ ...f, status: "idle" }));
}

function createTargetElement(): TargetElement {
  return { ...CHECKOUT_RECT, selector: CHECKOUT_SELECTOR, obstruction: null, layoutReversed: false };
}

function createInitialState(playbackSpeed: PlaybackSpeed = 1): AgentState {
  return {
    agentStatus: "idle",
    activeScenario: "broken_selector",
    metrics: { tokensIngested: TOKENS_BASELINE, latencyMs: 156, costSaved: 0, confidenceScore: 0.972 },
    cursor: { x: 200, y: 160, isClicking: false, targetLabel: "" },
    boundingBoxes: [],
    traceTree: createTraceTree(),
    logs: [],
    playbackSpeed,
    isPlaying: false,
    targetElement: createTargetElement(),
    orderConfirmed: false,
    particleBurstId: 0,
    hudFlashId: 0,
    prModalOpen: false,
    elapsedMs: 0,
    durationMs: 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  State mutation helpers                                                    */
/* -------------------------------------------------------------------------- */

type StatePatch = Partial<AgentState> | ((state: AgentStore) => Partial<AgentState>);

const setState = (patch: StatePatch) => useAgentStore.setState(patch);
const getState = () => useAgentStore.getState();

let logSeq = 0;

function log(origin: LogOrigin, severity: LogSeverity, message: string) {
  const entry: LogEntry = {
    id: `log-${++logSeq}`,
    time: formatClock(runtime?.timeline.time ?? 0),
    origin,
    severity,
    message,
  };
  setState((s) => ({ logs: [...s.logs, entry].slice(-MAX_LOGS) }));
}

function patchBox(boxes: BoundingBox[], id: string, patch: Partial<BoundingBox>): BoundingBox[] {
  return boxes.map((b) => (b.id === id ? { ...b, ...patch } : b));
}

function updateBox(id: string, patch: Partial<BoundingBox>) {
  setState((s) => ({ boundingBoxes: patchBox(s.boundingBoxes, id, patch) }));
}

function setCursor(patch: Partial<Cursor>) {
  setState((s) => ({ cursor: { ...s.cursor, ...patch } }));
}

function patchMetrics(patch: Partial<Metrics>) {
  setState((s) => ({ metrics: { ...s.metrics, ...patch } }));
}

/* -------------------------------------------------------------------------- */
/*  Runtime (timer, pause, ambient metrics)                                   */
/* -------------------------------------------------------------------------- */

interface Runtime {
  timeline: Timeline;
  timer: ReturnType<typeof setInterval> | null;
  lastTick: number;
  ambientMs: number;
  /** `rolling` ticks up slowly, `surging` is driven by a tween, `held` stays put. */
  tokenMode: "rolling" | "surging" | "held";
  pinLatency: boolean;
  resolve: () => void;
}

let runtime: Runtime | null = null;

function setRuntimeFlags(patch: Partial<Pick<Runtime, "tokenMode" | "pinLatency">>) {
  if (runtime) Object.assign(runtime, patch);
}

function tickMetrics(rt: Runtime) {
  setState((s) => {
    const m = s.metrics;
    const [lo, hi] = CONFIDENCE_BAND[s.agentStatus];
    const target = lo + Math.random() * (hi - lo);
    const confidenceScore = round(
      clamp(clamp(m.confidenceScore + (target - m.confidenceScore) * 0.5, lo, hi), ...CONFIDENCE_RANGE),
      3,
    );
    const latencyMs = rt.pinLatency
      ? m.latencyMs
      : clamp(Math.round(m.latencyMs + (Math.random() - 0.5) * 30), ...LATENCY_RANGE_MS);
    const tokensIngested =
      rt.tokenMode === "rolling" ? m.tokensIngested + Math.round(40 + Math.random() * 110) : m.tokensIngested;
    return { metrics: { ...m, confidenceScore, latencyMs, tokensIngested } };
  });
}

function step(rt: Runtime, dt: number) {
  const done = rt.timeline.advance(dt);
  rt.ambientMs += dt;
  while (rt.ambientMs >= AMBIENT_INTERVAL_MS) {
    rt.ambientMs -= AMBIENT_INTERVAL_MS;
    tickMetrics(rt);
  }
  setState({ elapsedMs: rt.timeline.time });
  if (done) finish(rt);
}

function startTimer(rt: Runtime) {
  rt.lastTick = Date.now();
  rt.timer = setInterval(() => {
    if (runtime !== rt) return;
    const now = Date.now();
    const realDt = clamp(now - rt.lastTick, 0, MAX_FRAME_MS);
    rt.lastTick = now;
    step(rt, realDt * getState().playbackSpeed);
  }, FRAME_MS);
}

function stopTimer(rt: Runtime) {
  if (rt.timer !== null) clearInterval(rt.timer);
  rt.timer = null;
}

function finish(rt: Runtime) {
  if (runtime !== rt) return;
  stopTimer(rt);
  runtime = null;
  setState({ isPlaying: false });
  rt.resolve();
}

/** Cancels the active run without touching store state. */
function abortRuntime() {
  if (!runtime) return;
  const rt = runtime;
  runtime = null;
  stopTimer(rt);
  rt.resolve();
}

function launch(timeline: Timeline): Promise<void> {
  abortRuntime();
  return new Promise<void>((resolve) => {
    const rt: Runtime = {
      timeline,
      timer: null,
      lastTick: Date.now(),
      ambientMs: 0,
      tokenMode: "rolling",
      pinLatency: false,
      resolve,
    };
    runtime = rt;
    setState({ isPlaying: true, elapsedMs: 0, durationMs: timeline.duration });
    // Apply the t=0 beats synchronously so state is correct when the action returns.
    step(rt, 0);
    if (runtime === rt) startTimer(rt);
  });
}

/* -------------------------------------------------------------------------- */
/*  Timeline building blocks                                                  */
/* -------------------------------------------------------------------------- */

function moveCursor(tl: Timeline, start: number, end: number, to: { x: number; y: number }, label: string) {
  let from: { x: number; y: number } | null = null;
  tl.tween(start, end, (p) => {
    if (!from) from = { x: getState().cursor.x, y: getState().cursor.y };
    const t = easeInOutCubic(p);
    setCursor({ x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), targetLabel: label });
  });
}

/** Schedules a click press and release. Returns the release time. */
function press(tl: Timeline, at: number): number {
  tl.at(at, () => setCursor({ isClicking: true }));
  tl.at(at + CLICK_HOLD_MS, () => setCursor({ isClicking: false }));
  return at + CLICK_HOLD_MS;
}

function confirmOrder(tl: Timeline, at: number) {
  tl.at(at, () => {
    setState((s) => ({
      agentStatus: "success",
      orderConfirmed: true,
      particleBurstId: s.particleBurstId + 1,
      boundingBoxes: patchBox(s.boundingBoxes, TARGET_BOX_ID, { status: "healed" }),
    }));
    log("DOM_RUNTIME", "success", `POST /api/reservations → 201 · reservation ${RESERVATION_ID} confirmed`);
    log(
      "META_VISION",
      "success",
      `Self-heal complete · ${formatUsd(COST_PER_HEAL_REFLEX)} vs ${formatUsd(COST_PER_HEAL_GPT4O)} GPT-4o · ` +
        `${formatUsd(getState().metrics.costSaved)} saved`,
    );
  });
}

function recoverByClick(tl: Timeline, start: number, rect: Rect, selector: string): number {
  moveCursor(tl, start, start + MOVE_MS, center(rect), selector);
  const pressAt = start + MOVE_MS + 100;
  tl.at(pressAt, () => log("DOM_RUNTIME", "success", `click → ${selector} · target resolved`));
  const releaseAt = press(tl, pressAt);
  confirmOrder(tl, releaseAt);
  return releaseAt;
}

/* -------------------------------------------------------------------------- */
/*  Scenarios                                                                 */
/* -------------------------------------------------------------------------- */

interface ScenarioConfig {
  patchFile: string;
  patchLine: number;
  patchSummary: string;
  faultMessage: string;
  tripMessage: string;
  applyFault: () => void;
  reidentify: () => void;
  settle: () => void;
  /** Schedules the recovery beats from `start`. Returns when the order is confirmed. */
  recover: (tl: Timeline, start: number) => number;
}

const home = center(CHECKOUT_RECT);

const SCENARIOS: Record<ActiveScenario, ScenarioConfig> = {
  broken_selector: {
    patchFile: "src/components/CompleteReservationButton.tsx",
    patchLine: 42,
    patchSummary: `id "checkout-btn" → "pay-v2-carrier"`,
    faultMessage: `Mutation observed · ${CHECKOUT_SELECTOR} replaced by ${MUTATED_SELECTOR}`,
    tripMessage: `document.querySelector("${CHECKOUT_SELECTOR}") → null`,
    applyFault: () =>
      setState({ targetElement: { ...V2_RECT, selector: MUTATED_SELECTOR, obstruction: null, layoutReversed: false } }),
    reidentify: () => {
      updateBox(TARGET_BOX_ID, { ...V2_RECT, label: MUTATED_SELECTOR, status: "evaluating" });
      const { x, y } = center(V2_RECT);
      log(
        "META_VISION",
        "info",
        `Optical OCR fallback matched "Complete Reservation" at (${x}, ${y}) · conf ${getState().metrics.confidenceScore.toFixed(3)}`,
      );
    },
    settle: () => updateBox(TARGET_BOX_ID, { status: "healed" }),
    recover: (tl, start) => recoverByClick(tl, start, V2_RECT, MUTATED_SELECTOR),
  },

  modal_obstruction: {
    patchFile: "src/components/TenantConfirmModal.tsx",
    patchLine: 18,
    patchSummary: "overlay z-index 50 blocks pointer events over checkout",
    faultMessage: `Mutation observed · .tenant-modal mounted over ${CHECKOUT_SELECTOR} (z-index 50)`,
    tripMessage: `elementFromPoint(${home.x}, ${home.y}) → div.tenant-modal__backdrop · click intercepted`,
    applyFault: () =>
      setState({
        targetElement: { ...CHECKOUT_RECT, selector: CHECKOUT_SELECTOR, obstruction: TENANT_MODAL, layoutReversed: false },
      }),
    reidentify: () => {
      setState((s) => ({
        boundingBoxes: [
          ...patchBox(s.boundingBoxes, TARGET_BOX_ID, { status: "evaluating" }),
          { id: "tenant-modal", x: TENANT_MODAL.x, y: TENANT_MODAL.y, w: TENANT_MODAL.w, h: TENANT_MODAL.h, label: "Security notice (occluder)", status: "evaluating" },
        ],
      }));
      log(
        "META_VISION",
        "info",
        `Occluder detected over target · dismiss control at (${TENANT_MODAL.dismissX}, ${TENANT_MODAL.dismissY})`,
      );
    },
    settle: () => updateBox("tenant-modal", { status: "failed" }),
    recover: (tl, start) => {
      const dismiss = { x: TENANT_MODAL.dismissX, y: TENANT_MODAL.dismissY };
      moveCursor(tl, start, start + 800, dismiss, "Dismiss security notice");

      const dismissPress = start + 900;
      tl.at(dismissPress, () => log("DOM_RUNTIME", "info", "click → .tenant-modal__close · dismissing overlay"));
      const dismissRelease = press(tl, dismissPress);
      tl.at(dismissRelease, () => {
        setState((s) => ({
          targetElement: { ...s.targetElement, obstruction: null },
          boundingBoxes: patchBox(s.boundingBoxes, "tenant-modal", { status: "healed" }),
        }));
      });
      tl.at(dismissRelease + 500, () => {
        setState((s) => ({ boundingBoxes: s.boundingBoxes.filter((b) => b.id !== "tenant-modal") }));
      });

      const moveStart = dismissRelease + 150;
      moveCursor(tl, moveStart, moveStart + 700, home, CHECKOUT_SELECTOR);
      const pressAt = moveStart + 800;
      tl.at(pressAt, () => log("DOM_RUNTIME", "success", `click → ${CHECKOUT_SELECTOR} · target resolved`));
      const releaseAt = press(tl, pressAt);
      confirmOrder(tl, releaseAt);
      return releaseAt;
    },
  },

  css_layout_shift: {
    patchFile: "src/styles/layout.css",
    patchLine: 212,
    patchSummary: ".checkout-actions flex-direction: row-reverse moves the CTA to the opposite edge",
    faultMessage: `Mutation observed · .checkout-actions flex order reversed · ${CHECKOUT_SELECTOR} moved`,
    tripMessage: `elementFromPoint(${home.x}, ${home.y}) → p.checkout-actions__terms · not actionable`,
    applyFault: () =>
      setState({ targetElement: { ...REVERSED_RECT, selector: CHECKOUT_SELECTOR, obstruction: null, layoutReversed: true } }),
    reidentify: () => {
      updateBox(TARGET_BOX_ID, { ...REVERSED_RECT, status: "evaluating" });
      const { x, y } = center(REVERSED_RECT);
      log(
        "META_VISION",
        "info",
        `Optical OCR fallback matched "Complete Reservation" at (${x}, ${y}) · layout reversed · conf ${getState().metrics.confidenceScore.toFixed(3)}`,
      );
    },
    settle: () => updateBox(TARGET_BOX_ID, { status: "healed" }),
    recover: (tl, start) => recoverByClick(tl, start, REVERSED_RECT, CHECKOUT_SELECTOR),
  },
};

/**
 * Fault → click fails → Subquadratic heal → recovery → confirmation.
 * `base` is when the fault lands. Returns when the order is confirmed.
 */
function scheduleHealing(tl: Timeline, base: number, scenario: ActiveScenario): number {
  const cfg = SCENARIOS[scenario];
  const at = (offset: number, run: () => void) => tl.at(base + offset, run);

  at(HEAL_OFFSET.fault, () => {
    setState({ activeScenario: scenario });
    cfg.applyFault();
    log("DOM_RUNTIME", "warn", cfg.faultMessage);
  });

  at(HEAL_OFFSET.attempt, () => {
    setState({ agentStatus: "action_attempted" });
    log("META_VISION", "info", `Dispatching click → ${CHECKOUT_SELECTOR} @ (${home.x}, ${home.y})`);
  });

  at(HEAL_OFFSET.trip, () => {
    setState((s) => ({
      agentStatus: "regression_tripped",
      cursor: { ...s.cursor, isClicking: true },
      boundingBoxes: patchBox(s.boundingBoxes, TARGET_BOX_ID, { status: "failed" }),
    }));
    log("DOM_RUNTIME", "alert", cfg.tripMessage);
    log("META_VISION", "alert", "Regression tripped · selector-based action failed");
  });
  at(HEAL_OFFSET.trip + CLICK_HOLD_MS, () => setCursor({ isClicking: false }));

  // Subquadratic HUD: the whole repo is ingested inside SUBQ_PARSE_MS.
  const subqAt = base + HEAL_OFFSET.subq;
  tl.at(subqAt, () => {
    setState((s) => ({ agentStatus: "subq_healing", hudFlashId: s.hudFlashId + 1 }));
    patchMetrics({ latencyMs: SUBQ_PARSE_MS });
    setRuntimeFlags({ tokenMode: "surging", pinLatency: true });
    log("SUBQ_SNAP", "warn", "Subquadratic engine engaged · ingesting repository snapshot");
  });

  let startTokens: number | null = null;
  let startCost = 0;
  tl.tween(subqAt, subqAt + SUBQ_PARSE_MS, (p) => {
    if (startTokens === null) {
      startTokens = getState().metrics.tokensIngested;
      startCost = getState().metrics.costSaved;
    }
    patchMetrics({
      tokensIngested: Math.round(lerp(startTokens, TOKENS_SURGE_TARGET, easeOutCubic(p))),
      costSaved: round(startCost + COST_SAVED_PER_HEAL * p, 4),
    });
  });

  TRACE_FILES.forEach((_, i) => {
    const parsedAt = subqAt + Math.round(((i + 1) * SUBQ_PARSE_MS) / TRACE_FILES.length);
    tl.at(parsedAt, () => {
      setState((s) => ({
        traceTree: s.traceTree.map((node, j) => (j === i && node.status === "idle" ? { ...node, status: "parsed" } : node)),
      }));
    });
  });
  tl.at(subqAt + SUBQ_PARSE_MS, () => {
    setRuntimeFlags({ tokenMode: "held" });
    log(
      "SUBQ_SNAP",
      "info",
      `Parsed ${formatInt(TOKENS_SURGE_TARGET)} tokens + trace tree in ${SUBQ_PARSE_MS}ms`,
    );
  });

  tl.at(subqAt + PATCH_DELAY_MS, () => {
    setState((s) => ({
      traceTree: s.traceTree.map((node) => (node.file === cfg.patchFile ? { ...node, status: "patched" } : node)),
    }));
    setRuntimeFlags({ pinLatency: false });
    log("SUBQ_SNAP", "success", `Patch pinpointed · ${cfg.patchFile}:${cfg.patchLine} · ${cfg.patchSummary}`);
  });

  const reidentifyAt = base + HEAL_OFFSET.reidentify;
  tl.at(reidentifyAt, () => {
    setState({ agentStatus: "healed_execution" });
    cfg.reidentify();
  });
  tl.at(reidentifyAt + SETTLE_DELAY_MS, () => cfg.settle());

  return cfg.recover(tl, base + HEAL_OFFSET.recover);
}

function scheduleScan(tl: Timeline) {
  tl.at(GOLDEN_STAGE_MS.scan, () => {
    setState((s) => ({
      agentStatus: "observing",
      boundingBoxes: SCAN_REGIONS.map((r) => ({ ...r, status: "evaluating" })),
      cursor: { ...s.cursor, targetLabel: CHECKOUT_SELECTOR },
    }));
    log("META_VISION", "info", `Scanning /checkout · ${TARGET_VIEWPORT.w}×${TARGET_VIEWPORT.h} viewport`);
    log("META_VISION", "info", `Target locked · ${CHECKOUT_SELECTOR}`);
  });

  SCAN_REGIONS.forEach((region, i) => {
    tl.at(GOLDEN_STAGE_MS.scan + 600 + i * 300, () => updateBox(region.id, { status: "nominal" }));
  });

  tl.at(GOLDEN_STAGE_MS.scan + 1700, () => {
    setState({ agentStatus: "analyzing" });
    log("META_VISION", "info", `Page model built · ${SCAN_REGIONS.length} regions classified`);
  });

  moveCursor(tl, GOLDEN_STAGE_MS.scan + 300, GOLDEN_STAGE_MS.scan + 2200, home, CHECKOUT_SELECTOR);
}

function buildGoldenTimeline(): Timeline {
  const tl = new Timeline(GOLDEN_DURATION_MS);
  scheduleScan(tl);
  const confirmedAt = scheduleHealing(tl, GOLDEN_STAGE_MS.mutation, "broken_selector");
  tl.at(confirmedAt + PR_MODAL_DELAY_MS, () => setState({ prModalOpen: true }));
  return tl;
}

/** Puts the board in the post-scan state without the cinematic delays. */
function armBoard(scenario: ActiveScenario) {
  setState((s) => ({
    activeScenario: scenario,
    agentStatus: "observing",
    metrics: { ...s.metrics, tokensIngested: TOKENS_BASELINE },
    cursor: { ...home, isClicking: false, targetLabel: CHECKOUT_SELECTOR },
    boundingBoxes: SCAN_REGIONS.map((r) => ({ ...r, status: "nominal" })),
    traceTree: createTraceTree(),
    targetElement: createTargetElement(),
    orderConfirmed: false,
    prModalOpen: false,
  }));
  log("DOM_RUNTIME", "warn", `Chaos injected · ${scenario}`);
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

export const useAgentStore = create<AgentStore>()((set, get) => ({
  ...createInitialState(),

  runGoldenDemo: () => {
    abortRuntime();
    logSeq = 0;
    set(createInitialState(get().playbackSpeed));
    return launch(buildGoldenTimeline());
  },

  injectChaos: (type) => {
    abortRuntime();
    armBoard(type);
    const tl = new Timeline(0);
    const confirmedAt = scheduleHealing(tl, 0, type);
    tl.duration = confirmedAt + CHAOS_TAIL_MS;
    void launch(tl);
  },

  resetState: () => {
    abortRuntime();
    logSeq = 0;
    set(createInitialState(get().playbackSpeed));
  },

  togglePlay: () => {
    const rt = runtime;
    if (!rt) {
      void get().runGoldenDemo();
      return;
    }
    if (get().isPlaying) {
      stopTimer(rt);
      set({ isPlaying: false });
    } else {
      startTimer(rt);
      set({ isPlaying: true });
    }
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  dismissObstruction: () => set((s) => ({ targetElement: { ...s.targetElement, obstruction: null } })),

  openPrModal: () => set({ prModalOpen: true }),

  closePrModal: () => set({ prModalOpen: false }),
}));

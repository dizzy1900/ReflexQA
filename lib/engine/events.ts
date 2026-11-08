/**
 * Wire contract between the live engine (app/api/run, server) and the command center (client).
 * The server streams one EngineEvent per SSE `data:` line. Keep this file free of Node imports.
 */

/** Same ids as the store's ActiveScenario so the UI can reuse scenario labels. */
export type Fault = "broken_selector" | "modal_obstruction" | "css_layout_shift";

export const ALL_FAULTS: readonly Fault[] = ["broken_selector", "modal_obstruction", "css_layout_shift"];

/** Plain-language fault descriptions, used for the curriculum and the UI. */
export const FAULT_DESCRIPTIONS: Record<Fault, string> = {
  broken_selector: "the checkout button's id changes (#checkout-btn → #pay-v2-carrier) and it shifts position",
  modal_obstruction: "a security notice modal covers the page and swallows clicks",
  css_layout_shift: "the action bar flips, so the checkout button moves to the opposite edge",
};

/** SubQ's routing choices after each step. */
export type RouteChoice = "proceed" | "retry_vision" | "dismiss_obstruction" | "goal_complete" | "escalate_heal";

export interface MetaAction {
  /** click: mouse click · type: click then type `text` · select: choose option `text` in the <select> at x,y · key: press `text` (e.g. Backspace) · done */
  kind: "click" | "type" | "select" | "key" | "done";
  text?: string;
  /** Coordinates in the 1280×800 target viewport (same space as TARGET_VIEWPORT in the store). */
  x: number;
  y: number;
  target: string;
  reasoning: string;
}

export interface SubqVerdict {
  /** P(the last action moved the page closer to the goal). */
  progressed: number;
  /** P(the goal is reached on the current screen). */
  goalReached: number;
  route: { choice: RouteChoice; probabilities: Record<string, number>; confidence: number };
}

export interface EpisodeSummary {
  generation: number;
  faults: Fault[];
  steps: number;
  success: boolean;
  lessonsUsed: number;
  /** Meta Driver calls this episode (replayed skills need none). */
  metaCalls?: number;
  /** Actions replayed from a learned skill, verified step by step by SubQ. */
  replayedSteps?: number;
  durationMs?: number;
  /** Actions the Judge scored as no progress (misclicks, blocked clicks, stale replayed steps). */
  mistakes?: number;
  /** Steps where the Judge's goal verdict matched DOM ground truth, out of judgeChecks. */
  judgeCorrect?: number;
  judgeChecks?: number;
  /** React suite: the test case this episode ran and SubQ's P(behaves as expected). */
  caseTitle?: string;
  qaPass?: number;
}

/** One manual test case from react/react fixtures/dom, read off the rendered page. */
export interface ReactTestCase {
  id: string;
  fixture: string;
  index: number;
  title: string;
  steps: string[];
  expected: string;
  sourceUrl: string;
}

export type EngineEvent =
  | {
      type: "campaign_start";
      generations: number;
      codebaseTokens: number;
      codebaseFiles: { file: string; lines: number }[];
      metaModel: string;
      subqModel: string;
    }
  | { type: "episode_start"; generation: number; faults: Fault[]; lessons: string[] }
  /** JPEG screenshot, raw base64 (no data: prefix). */
  | { type: "frame"; generation: number; step: number; image: string }
  | { type: "meta_action"; generation: number; step: number; action: MetaAction; latencyMs: number }
  | {
      type: "subq_verdict";
      generation: number;
      step: number;
      verdict: SubqVerdict;
      latencyMs: number;
      inputTokens: number;
      costUsd: number;
      /** DOM ground truth for "goal reached" at this step. The agent never sees it; it only scores the Judge. */
      groundTruthGoal?: boolean;
    }
  | { type: "lesson"; generation: number; lesson: string; testPatch: string }
  | { type: "test_case"; generation: number; testCase: ReactTestCase; catalogSize: number }
  | { type: "qa_verdict"; generation: number; testCase: ReactTestCase; pass: number; stepsComplete: number; summary: string }
  | {
      type: "curriculum";
      generation: number;
      chosen: string;
      faults: Fault[];
      probabilities: Record<string, number>;
    }
  | ({ type: "episode_end" } & EpisodeSummary)
  | { type: "log"; origin: "META_VISION" | "SUBQ_SNAP" | "DOM_RUNTIME"; severity: "info" | "warn" | "alert" | "success"; message: string }
  | { type: "campaign_end"; episodes: EpisodeSummary[]; totalCostUsd: number }
  | { type: "error"; message: string };

/** SubQ Snap list price, dollars per input token ($0.04 / 1M). Output is free. */
export const SUBQ_USD_PER_INPUT_TOKEN = 0.04 / 1_000_000;

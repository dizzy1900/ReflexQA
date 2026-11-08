import { SUBQ_USD_PER_INPUT_TOKEN, type RouteChoice, type SubqVerdict } from "./events";

/** Subquadratic SubQ Snap: the Judge and Router. A decision model, not a generator. */
const URL = "https://api.subq.ai/v1/systemone";
export const SUBQ_MODEL = process.env.SUBQ_MODEL || "subq-snap-1.1";

type Question =
  | { type: "noul"; instructions: string; criteria?: { true: string; false: string } }
  | { type: "choice"; instructions: string; criteria: Record<string, string | null> }
  | { type: "score"; instructions: string; criteria: string[] };

interface NoulAnswer {
  type: "noul";
  noul: number;
}
interface ChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}
type Answer = NoulAnswer | ChoiceAnswer | { type: "score"; score: number; confidence: number };

interface DecideResult {
  answers: Record<string, Answer>;
  inputTokens: number;
  latencyMs: number;
  costUsd: number;
}

export interface SubqImage {
  mediaType: "image/jpeg" | "image/png";
  base64: string;
}

export async function decide(state: unknown, questions: Record<string, Question>, images: SubqImage[] = []): Promise<DecideResult> {
  const key = process.env.SUBQ_API_KEY;
  if (!key) throw new Error("SUBQ_API_KEY is not set in .env.local");
  const started = Date.now();
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: SUBQ_MODEL, state, questions, ...(images.length ? { images: images.slice(0, 4) } : {}) }),
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`SubQ ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  const { answers, usage } = body as { answers: Record<string, Answer>; usage?: { input_tokens?: number } };
  const inputTokens = usage?.input_tokens ?? 0;
  return { answers, inputTokens, latencyMs: Date.now() - started, costUsd: inputTokens * SUBQ_USD_PER_INPUT_TOKEN };
}

function noul(a: Answer | undefined): number {
  return a && a.type === "noul" ? a.noul : 0;
}

const ROUTES: Record<RouteChoice, string> = {
  proceed: "The last action worked; continue toward the goal with the next action",
  retry_vision: "The action missed or hit the wrong element; look again and re-target",
  dismiss_obstruction: "A modal or overlay is blocking the target; close it first",
  goal_complete: "The order confirmation is visible; the test passed",
  escalate_heal: "The page structure changed in a way that needs the test itself rewritten",
};

export interface JudgeInput {
  goal: string;
  codebase: string;
  memory: unknown;
  trajectory: string[];
  action: string;
  domAfter: string;
  before: string;
  after: string;
}

/** One call answers three questions over the whole codebase, memory, trajectory and both screenshots. */
export async function judgeStep(input: JudgeInput) {
  const result = await decide(
    {
      role: "ReflexQA Judge. Decide whether the GUI agent's last action succeeded, using the app source as ground truth for how the UI behaves.",
      goal: input.goal,
      last_action: input.action,
      dom_text_after_action: input.domAfter,
      trajectory_this_run: input.trajectory,
      agent_memory: input.memory,
      images: "Image 1 is the screen BEFORE the action, image 2 is AFTER.",
      application_codebase: input.codebase,
    },
    {
      progressed: {
        type: "noul",
        instructions: "Did the last action change the screen in a way that moves closer to the goal?",
        criteria: { true: "Visible progress: an obstruction closed, a form submitted, or a confirmation appeared", false: "Nothing useful changed, or the click hit the wrong element or a backdrop" },
      },
      goal_reached: {
        type: "noul",
        instructions: "Is the goal reached on the AFTER screen?",
        criteria: { true: "A 'Reservation confirmed' order confirmation is visible", false: "No order confirmation is visible yet" },
      },
      route: { type: "choice", instructions: "What should the agent do next?", criteria: ROUTES },
    },
    [
      { mediaType: "image/jpeg", base64: input.before },
      { mediaType: "image/jpeg", base64: input.after },
    ],
  );
  const route = result.answers.route;
  const verdict: SubqVerdict = {
    progressed: noul(result.answers.progressed),
    goalReached: noul(result.answers.goal_reached),
    route:
      route && route.type === "choice"
        ? { choice: route.choice as RouteChoice, probabilities: route.probabilities, confidence: route.confidence }
        : { choice: "retry_vision", probabilities: {}, confidence: 0 },
  };
  return { verdict, inputTokens: result.inputTokens, latencyMs: result.latencyMs, costUsd: result.costUsd };
}

/** The curriculum: SubQ picks the scenario the agent is most likely to fail next, given everything it remembers. */
export async function pickCurriculum(memory: unknown, options: Record<string, string>) {
  const result = await decide(
    { role: "ReflexQA curriculum planner. Pick the next test scenario that best exposes the agent's weaknesses.", agent_memory: memory },
    {
      next_scenario: {
        type: "choice",
        instructions: "Which scenario is the agent most likely to FAIL, given its lessons and past episodes? Prefer combinations it has never seen.",
        criteria: options,
      },
    },
  );
  const a = result.answers.next_scenario;
  if (!a || a.type !== "choice") throw new Error("SubQ curriculum returned no choice");
  return { chosen: a.choice, probabilities: a.probabilities, inputTokens: result.inputTokens, costUsd: result.costUsd };
}

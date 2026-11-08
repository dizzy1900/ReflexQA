import type { Mark } from "./browser";
import type { Fault, MetaAction, RouteChoice } from "./events";

/** Meta Model API: the multimodal Driver. OpenAI-compatible chat completions. */
const BASE_URL = "https://api.meta.ai/v1";
export const META_MODEL = process.env.META_MODEL || "muse-spark-1.3";

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export interface ChatMessage {
  role: "system" | "user";
  content: string | Part[];
}

interface ChatResult {
  text: string;
  latencyMs: number;
}

export async function chat(messages: ChatMessage[], maxTokens = 6000): Promise<ChatResult> {
  const key = process.env.MODEL_API_KEY;
  if (!key) throw new Error("MODEL_API_KEY is not set in .env.local");
  const started = Date.now();
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: META_MODEL, messages, max_completion_tokens: maxTokens, reasoning_effort: "low" }),
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Meta Model API ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  const text = extractText(body);
  if (!text) throw new Error(`Meta Model API returned no content: ${JSON.stringify(body).slice(0, 300)}`);
  return { text, latencyMs: Date.now() - started };
}

function extractText(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const choices = (body as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p: unknown) => (typeof p === "object" && p !== null && "text" in p ? String((p as { text: unknown }).text) : ""))
      .join("");
  }
  return "";
}

/** Pulls the first JSON object out of a model reply (tolerates code fences and prose). */
export function parseJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error(`No JSON in model reply: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

export const GOAL =
  'Complete the checkout: get the "Complete Reservation" order submitted so the "Reservation confirmed" dialog appears.';

const DRIVER_SYSTEM = `You are the Driver of ReflexQA, an autonomous GUI QA agent. You see a screenshot of a web app
(1280x800 pixels) and choose ONE mouse action at a time to reach the goal.
Every interactive element has a red numbered box (its mark). Pick the mark to click. Marks are drawn even on
elements that are covered by something else, so check visually what is actually on top before choosing.
If something covers the element you need (a modal, overlay, banner), deal with it first.
If the goal is already visibly reached, return kind "done".
Reply with ONLY a JSON object: {"kind":"click"|"done","mark":int,"target":"short element description","reasoning":"one sentence"}`;

export interface DriverInput {
  imageB64: string;
  lessons: string[];
  history: string[];
  routeHint: RouteChoice | null;
  marks: Mark[];
}

export async function decideAction(input: DriverInput): Promise<{ action: MetaAction; latencyMs: number }> {
  const memory = input.lessons.length
    ? `Lessons learned from your previous runs (apply them):\n${input.lessons.map((l, i) => `${i + 1}. ${l}`).join("\n")}`
    : "No lessons learned yet. This is your first run.";
  const history = input.history.length ? `Actions so far this run:\n${input.history.join("\n")}` : "No actions yet this run.";
  const marks = `Marks on screen:\n${input.marks.map((m) => `[${m.id}] ${m.label}`).join("\n")}`;
  const hint = input.routeHint ? `The Judge (SubQ Snap) routed the next step as: ${input.routeHint}.` : "";

  const { text, latencyMs } = await chat([
    { role: "system", content: DRIVER_SYSTEM },
    {
      role: "user",
      content: [
        { type: "text", text: `Goal: ${GOAL}\n\n${memory}\n\n${history}\n${hint}\n\n${marks}` },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.imageB64}` } },
      ],
    },
  ]);
  const raw = parseJsonObject(text);
  const mark = input.marks.find((m) => m.id === Number(raw.mark));
  const action: MetaAction = {
    kind: raw.kind === "done" ? "done" : "click",
    x: mark ? mark.x : clampInt(raw.x, 0, 1279),
    y: mark ? mark.y : clampInt(raw.y, 0, 799),
    target: String(raw.target ?? "element"),
    reasoning: String(raw.reasoning ?? ""),
  };
  return { action, latencyMs };
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

export interface LessonInput {
  faults: Fault[];
  trajectory: string[];
  success: boolean;
  existingLessons: string[];
}

/** After an episode, the Driver reflects on its own trajectory and writes a reusable lesson plus a hardened test. */
export async function distillLesson(input: LessonInput): Promise<{ lesson: string; testPatch: string }> {
  const { text } = await chat(
    [
      {
        role: "system",
        content:
          "You are the self-improvement module of a GUI QA agent. Turn a test trajectory into (1) ONE short, general, reusable lesson " +
          "(max 30 words) that would make the next run need fewer steps, not repeating existing lessons, and (2) a hardened Playwright " +
          'test (TypeScript, max 14 lines) that automates this test case robustly, asserting the expected result. Reply ONLY JSON: {"lesson":"...","testPatch":"..."}',
      },
      {
        role: "user",
        content:
          `Faults injected: ${input.faults.join(", ") || "none"}\nOutcome: ${input.success ? "success" : "failure"}\n` +
          `Existing lessons:\n${input.existingLessons.join("\n") || "(none)"}\n\nTrajectory (action → judge verdict):\n${input.trajectory.join("\n")}`,
      },
    ],
    8000,
  );
  const raw = parseJsonObject(text);
  return { lesson: String(raw.lesson ?? "").trim(), testPatch: String(raw.testPatch ?? "").trim() };
}

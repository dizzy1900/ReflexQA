import { promises as fs } from "node:fs";
import path from "node:path";
import type { Browser, Page } from "playwright";
import { domText, launchBrowser, markedScreenshot, screenshot, type Mark } from "./browser";
import type { EngineEvent, EpisodeSummary, MetaAction, ReactTestCase, RouteChoice } from "./events";
import { chat, distillLesson, parseJsonObject, META_MODEL } from "./meta";
import { loadMemory, saveMemory, type Memory } from "./memory";
import { SUBQ_MODEL, decide, pickCurriculum } from "./subq";

/**
 * ReflexQA × react/react: the agent works through React's own manual DOM QA suite (fixtures/dom),
 * the cases React maintainers click through by hand. Meta drives the browser; SubQ judges each step
 * with React DOM's real source in context and decides PASS/FAIL against each case's Expected Result.
 */

const REACT_REV = "d71b537";
const FIXTURES = ["selects", "number-inputs", "text-inputs", "buttons", "textareas", "password-inputs", "email-inputs", "input-change-events"];
/** Gen 1 is fixed so the run is reproducible: reset a single select (3 steps: pick, reset, verify). */
const FIRST_CASE = "selects#2";
const MAX_STEPS = 6;

export interface ReactCampaignOptions {
  origin: string;
  generations: number;
  fresh: boolean;
  emit: (event: EngineEvent) => void;
  signal: AbortSignal;
}

/* ------------------------------------------------------------------ context */

interface SourceBundle {
  text: string;
  files: { file: string; lines: number }[];
  approxTokens: number;
}
let bundle: SourceBundle | null = null;

async function walk(dir: string, out: string[]) {
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.name.endsWith(".js")) out.push(full);
  }
}

/** React DOM's client + event system source plus the fixtures under test: ~200K tokens, read on every judgement. */
export async function loadReactSource(): Promise<SourceBundle> {
  if (bundle) return bundle;
  const root = process.cwd();
  const paths: string[] = [];
  await walk(path.join(root, "vendor/react-fixtures"), paths);
  await walk(path.join(root, "vendor/react-dom-bindings"), paths);
  const files: SourceBundle["files"] = [];
  const chunks: string[] = [];
  for (const p of paths.sort()) {
    const src = await fs.readFile(p, "utf8");
    const rel = path
      .relative(root, p)
      .replace(/^vendor\/react-fixtures\//, "fixtures/dom/src/components/")
      .replace(/^vendor\/react-dom-bindings\//, "packages/react-dom-bindings/src/");
    files.push({ file: rel, lines: src.split("\n").length });
    chunks.push(`// ===== react/react ${rel} =====\n${src}`);
  }
  const text = chunks.join("\n\n");
  bundle = { text, files, approxTokens: Math.round(text.length / 3.6) };
  return bundle;
}

/* ------------------------------------------------------------------ browser */

async function waitReady(page: Page) {
  await page.waitForSelector("body[data-fixture-ready]", { timeout: 20_000 });
  await page.waitForTimeout(250);
}

/** Reads every test case that has reproduction steps, straight from the rendered fixtures. */
async function discoverCatalog(browser: Browser, origin: string): Promise<ReactTestCase[]> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const catalog: ReactTestCase[] = [];
  try {
    for (const fixture of FIXTURES) {
      await page.goto(`${origin}/react-qa?fixture=${fixture}`, { waitUntil: "networkidle" });
      await waitReady(page);
      const cases = await page.$$eval(".test-case", (els) =>
        els.map((el) => {
          const heads = Array.from(el.querySelectorAll("h3"));
          const exp = heads.find((h) => /Expected/i.test(h.textContent || ""));
          return {
            title: (el.querySelector(".test-case__title")?.textContent || "").trim(),
            steps: Array.from(el.querySelectorAll("ol li")).map((li) => (li.textContent || "").trim()),
            expected: (exp?.nextElementSibling?.textContent || "").trim(),
          };
        }),
      );
      cases.forEach((c, index) => {
        if (c.steps.length === 0 || !c.expected) return;
        catalog.push({
          id: `${fixture}#${index}`,
          fixture,
          index,
          title: c.title,
          steps: c.steps,
          expected: c.expected,
          sourceUrl: `https://github.com/react/react/tree/main/fixtures/dom/src/components/fixtures/${fixture}`,
        });
      });
    }
  } finally {
    await page.close();
  }
  return catalog;
}

export async function openCase(browser: Browser, origin: string, tc: ReactTestCase, consoleErrors: string[]): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on("console", (m) => {
    // The fixtures use legacy ReactDOM.render; React 18's deprecation notice is harness noise, not a test signal.
    if (m.type() === "error" && !m.text().includes("ReactDOM.render is no longer supported")) consoleErrors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 300)));
  await page.goto(`${origin}/react-qa?fixture=${tc.fixture}&case=${tc.index}`, { waitUntil: "networkidle" });
  await waitReady(page);
  // Keep the whole test case on screen when the fixture set has controls above it.
  await page.evaluate((i) => {
    const el = document.querySelector<HTMLElement>(`.test-case[data-case-index="${i}"]`);
    if (el && el.getBoundingClientRect().bottom > window.innerHeight) window.scrollTo(0, el.offsetTop - 16);
  }, tc.index);
  await page.waitForTimeout(200);
  return page;
}

/** Control values are not in innerText, so the Judge gets them explicitly. */
export async function formState(page: Page): Promise<string[]> {
  return page.$$eval("input, select, textarea", (els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .slice(0, 30)
      .map((el) => {
        if (el instanceof HTMLSelectElement) {
          const sel = Array.from(el.selectedOptions).map((o) => o.text).join(", ");
          return `<select${el.multiple ? " multiple" : ""}> selected: [${sel}]`;
        }
        const input = el as HTMLInputElement;
        if (input.type === "checkbox" || input.type === "radio") return `<input type=${input.type}> checked=${input.checked}`;
        return `<${el.tagName.toLowerCase()} type=${input.type || "text"}> value="${input.value}"`;
      }),
  );
}

export async function execute(page: Page, a: MetaAction): Promise<void> {
  if (a.kind === "done") return;
  if (a.kind === "key") {
    const [key, times] = (a.text || "Tab").split("*");
    for (let i = 0; i < Math.min(10, Number(times) || 1); i += 1) await page.keyboard.press(key.trim());
  } else if (a.kind === "select") {
    const handle = await page.evaluateHandle(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest("select") ?? el;
    }, [a.x, a.y] as const);
    const el = handle.asElement();
    if (el) {
      const label = a.text || "";
      await el.selectOption({ label }).catch(() => el.selectOption(label).catch(() => undefined));
    }
  } else {
    await page.mouse.move(a.x, a.y, { steps: 6 });
    await page.mouse.click(a.x, a.y);
    if (a.kind === "type" && a.text) await page.keyboard.type(a.text, { delay: 40 });
  }
  await page.waitForTimeout(500);
}

/* ------------------------------------------------------------------ models */

const DRIVER_SYSTEM = `You are the Driver of ReflexQA, an autonomous GUI QA agent running a manual test case from React's own
DOM test suite (react/react fixtures/dom) in a real browser. The screenshot is 1280x800. Every interactive element
has a red numbered box (its mark). Perform the reproduction steps one action at a time.
Actions:
- click: click the element at the mark
- type: click the element at the mark, then type "text"
- select: choose the option labelled "text" in the <select> at the mark
- key: press a keyboard key in the focused element, "text" like "Backspace" or "ArrowLeft*3" (repeat count)
- done: every reproduction step has been performed
Reply with ONLY JSON: {"kind":"click"|"type"|"select"|"key"|"done","mark":int,"text":"...","target":"short description","reasoning":"one sentence"}`;

async function decideReactAction(
  tc: ReactTestCase,
  imageB64: string,
  marks: Mark[],
  lessons: string[],
  history: string[],
  routeHint: RouteChoice | null,
) {
  const text =
    `Test case: ${tc.title}\nSteps to reproduce:\n${tc.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\nExpected result: ${tc.expected}\n\n` +
    (lessons.length ? `Lessons from your previous test runs (apply them):\n${lessons.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\n` : "No lessons yet.\n\n") +
    (history.length ? `Actions so far:\n${history.join("\n")}\n` : "No actions yet.\n") +
    (routeHint ? `The Judge (SubQ Snap) routed the next step as: ${routeHint}.\n` : "") +
    `\nMarks on screen:\n${marks.map((m) => `[${m.id}] ${m.label}`).join("\n")}`;
  const started = Date.now();
  const res = await chat([
    { role: "system", content: DRIVER_SYSTEM },
    { role: "user", content: [{ type: "text", text }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageB64}` } }] },
  ]);
  const raw = parseJsonObject(res.text);
  const mark = marks.find((m) => m.id === Number(raw.mark));
  const kinds = ["click", "type", "select", "key", "done"] as const;
  const kind = kinds.find((k) => k === raw.kind) ?? "click";
  const action: MetaAction = {
    kind,
    x: mark?.x ?? 0,
    y: mark?.y ?? 0,
    text: typeof raw.text === "string" ? raw.text : undefined,
    target: String(raw.target ?? mark?.label ?? "element"),
    reasoning: String(raw.reasoning ?? ""),
  };
  return { action, latencyMs: Date.now() - started };
}

function describe(a: MetaAction): string {
  switch (a.kind) {
    case "done":
      return "declare all steps done";
    case "type":
      return `type "${a.text ?? ""}" into ${a.target} at (${a.x}, ${a.y})`;
    case "select":
      return `select "${a.text ?? ""}" in ${a.target} at (${a.x}, ${a.y})`;
    case "key":
      return `press ${a.text ?? ""}`;
    default:
      return `click (${a.x}, ${a.y}) on ${a.target}`;
  }
}

const ROUTES: Record<RouteChoice, string> = {
  proceed: "The last action performed a reproduction step correctly; do the next step",
  retry_vision: "The action missed, did nothing, or targeted the wrong element; re-target",
  dismiss_obstruction: "Something on screen blocks the needed element; clear it first",
  goal_complete: "All reproduction steps are done; the result can be judged now",
  escalate_heal: "React behaved against the Expected Result; flag a possible React regression",
};

export async function judgeReactStep(input: {
  tc: ReactTestCase;
  source: string;
  memory: unknown;
  trajectory: string[];
  action: string;
  dom: string;
  controls: string[];
  consoleErrors: string[];
  before: string;
  after: string;
}) {
  const r = await decide(
    {
      role: "ReflexQA Judge for React's manual DOM test suite. Use React DOM's source below to reason about how React should behave.",
      test_case: { title: input.tc.title, steps: input.tc.steps, expected_result: input.tc.expected },
      last_action: input.action,
      control_values_after: input.controls,
      visible_text_after: input.dom,
      browser_console_errors: input.consoleErrors,
      trajectory_this_run: input.trajectory,
      agent_memory: input.memory,
      images: "Image 1 is BEFORE the action, image 2 is AFTER.",
      react_source: input.source,
    },
    {
      progressed: {
        type: "noul",
        instructions: "Did the last action correctly perform one of the reproduction steps?",
        criteria: { true: "A reproduction step visibly took effect", false: "Nothing useful changed, or the wrong element/value was used" },
      },
      steps_complete: {
        type: "noul",
        instructions: "Have ALL the reproduction steps now been performed?",
        criteria: { true: "Every listed step has been carried out", false: "At least one step remains" },
      },
      expected_holds: {
        type: "noul",
        instructions: "Does the current state satisfy the test case's Expected Result?",
        criteria: { true: "The AFTER state matches the Expected Result", false: "The AFTER state contradicts the Expected Result" },
      },
      route: { type: "choice", instructions: "What should the agent do next?", criteria: ROUTES },
    },
    [
      { mediaType: "image/jpeg", base64: input.before },
      { mediaType: "image/jpeg", base64: input.after },
    ],
  );
  const n = (k: string) => {
    const a = r.answers[k];
    return a && a.type === "noul" ? a.noul : 0;
  };
  const route = r.answers.route;
  return {
    verdict: {
      progressed: n("progressed"),
      goalReached: n("steps_complete"),
      route:
        route && route.type === "choice"
          ? { choice: route.choice as RouteChoice, probabilities: route.probabilities, confidence: route.confidence }
          : { choice: "retry_vision" as RouteChoice, probabilities: {}, confidence: 0 },
    },
    expectedHolds: n("expected_holds"),
    inputTokens: r.inputTokens,
    latencyMs: r.latencyMs,
    costUsd: r.costUsd,
  };
}

/* ------------------------------------------------------------------ campaign */

function memoryView(memory: Memory) {
  return { lessons: memory.lessons, learned_skills: Object.keys(memory.skills), past_episodes: memory.episodes, past_trajectories: memory.traces };
}

export async function runReactCampaign(opts: ReactCampaignOptions): Promise<void> {
  const { emit } = opts;
  const source = await loadReactSource();
  const memory = await loadMemory(opts.fresh);
  const browser = await launchBrowser();
  const episodes: EpisodeSummary[] = [];
  let totalCost = 0;

  emit({
    type: "campaign_start",
    generations: opts.generations,
    codebaseTokens: source.approxTokens,
    codebaseFiles: source.files,
    metaModel: META_MODEL,
    subqModel: SUBQ_MODEL,
  });
  emit({
    type: "log",
    origin: "SUBQ_SNAP",
    severity: "info",
    message: `react/react @ ${REACT_REV} · loaded ${source.files.length} source files (~${source.approxTokens.toLocaleString()} tokens: react-dom-bindings client + events, fixtures/dom) into the Judge's context`,
  });

  try {
    const catalog = await discoverCatalog(browser, opts.origin);
    emit({ type: "log", origin: "DOM_RUNTIME", severity: "info", message: `Discovered ${catalog.length} manual test cases across ${FIXTURES.length} React DOM fixture sets` });
    const done = new Set<string>();
    let current = catalog.find((c) => c.id === FIRST_CASE) ?? catalog[0];

    for (let gen = 1; gen <= opts.generations && !opts.signal.aborted; gen += 1) {
      // Gen 2 re-runs gen 1's case to show the learned skill; every later case is chosen by SubQ from the catalog.
      if (gen >= 3) {
        const options = Object.fromEntries(
          catalog.filter((c) => !done.has(c.id)).slice(0, 200).map((c) => [c.id, `${c.title} · steps: ${c.steps.join(" / ")}`]),
        );
        const pick = await pickCurriculum(memoryView(memory), options);
        totalCost += pick.costUsd;
        current = catalog.find((c) => c.id === pick.chosen) ?? current;
        emit({ type: "curriculum", generation: gen, chosen: current.title, faults: [], probabilities: pick.probabilities });
        emit({
          type: "log",
          origin: "SUBQ_SNAP",
          severity: "warn",
          message: `Curriculum · SubQ ranked ${Object.keys(options).length} React test cases · next: ${current.id} "${current.title}" (P=${(pick.probabilities[pick.chosen] ?? 0).toFixed(2)})`,
        });
      }
      const result = await runCase(browser, opts, source, memory, gen, current, catalog.length);
      totalCost += result.cost;
      episodes.push(result.summary);
      memory.episodes.push(result.summary);
      done.add(current.id);
      await saveMemory(memory);
    }
  } finally {
    await browser.close();
  }
  emit({ type: "campaign_end", episodes, totalCostUsd: totalCost });
}

async function runCase(
  browser: Browser,
  opts: ReactCampaignOptions,
  source: SourceBundle,
  memory: Memory,
  gen: number,
  tc: ReactTestCase,
  catalogSize: number,
) {
  const { emit } = opts;
  const started = Date.now();
  const lessonsAtStart = memory.lessons.length;
  emit({ type: "episode_start", generation: gen, faults: [], lessons: [...memory.lessons] });
  emit({ type: "test_case", generation: gen, testCase: tc, catalogSize });
  emit({ type: "log", origin: "DOM_RUNTIME", severity: "warn", message: `Gen ${gen} · react/react fixtures/dom/${tc.fixture} · "${tc.title}"` });

  const consoleErrors: string[] = [];
  const page = await openCase(browser, opts.origin, tc, consoleErrors);
  const queue: MetaAction[] = memory.skills[tc.id] ? [...memory.skills[tc.id]] : [];
  if (queue.length) emit({ type: "log", origin: "SUBQ_SNAP", severity: "info", message: `Memory hit · replaying learned skill for ${tc.id} (${queue.length} steps), verified step by step` });

  const history: string[] = [];
  const trajectory: string[] = [];
  const verified: MetaAction[] = [];
  let routeHint: RouteChoice | null = null;
  let metaCalls = 0;
  let replayed = 0;
  let mistakes = 0;
  let cost = 0;
  let steps = 0;
  let stepsComplete = 0;
  let expectedHolds = 0;

  try {
    let before = await screenshot(page);
    emit({ type: "frame", generation: gen, step: 0, image: before });

    for (let step = 1; step <= MAX_STEPS && !opts.signal.aborted; step += 1) {
      steps = step;
      let action: MetaAction;
      let latencyMs = 0;
      const next = queue.shift();
      const fromSkill = Boolean(next);
      if (next) {
        action = { ...next, reasoning: `[skill replay] ${next.reasoning}` };
        replayed += 1;
      } else {
        const view = await markedScreenshot(page);
        emit({ type: "frame", generation: gen, step, image: view.image });
        const d = await decideReactAction(tc, view.image, view.marks, memory.lessons, history, routeHint);
        action = d.action;
        latencyMs = d.latencyMs;
        metaCalls += 1;
      }
      emit({ type: "meta_action", generation: gen, step, action, latencyMs });
      emit({ type: "log", origin: "META_VISION", severity: "info", message: `${fromSkill ? "Skill" : `Driver (${latencyMs}ms)`} → ${describe(action)} · ${action.reasoning}` });

      await execute(page, action);
      const after = await screenshot(page);
      emit({ type: "frame", generation: gen, step, image: after });

      const j = await judgeReactStep({
        tc,
        source: source.text,
        memory: memoryView(memory),
        trajectory,
        action: describe(action),
        dom: await domText(page),
        controls: await formState(page),
        consoleErrors,
        before,
        after,
      });
      cost += j.costUsd;
      const v = j.verdict;
      stepsComplete = v.goalReached;
      expectedHolds = j.expectedHolds;
      if (v.progressed < 0.5 && v.goalReached <= 0.5) mistakes += 1;
      emit({ type: "subq_verdict", generation: gen, step, verdict: v, latencyMs: j.latencyMs, inputTokens: j.inputTokens, costUsd: j.costUsd });
      emit({
        type: "log",
        origin: "SUBQ_SNAP",
        severity: v.goalReached > 0.5 ? "success" : v.progressed >= 0.5 ? "info" : "alert",
        message: `Judge ${j.latencyMs}ms · ${j.inputTokens.toLocaleString()} tok of React source+trace · step ok ${v.progressed.toFixed(2)} · all steps ${v.goalReached.toFixed(2)} · expected holds ${j.expectedHolds.toFixed(2)} · route → ${v.route.choice}`,
      });

      const line = `${describe(action)} → progressed=${v.progressed.toFixed(2)} steps_complete=${v.goalReached.toFixed(2)} route=${v.route.choice}`;
      history.push(`${step}. ${line}`);
      trajectory.push(line);
      if (v.progressed >= 0.5 && action.kind !== "done") verified.push({ ...action, reasoning: action.reasoning.replace("[skill replay] ", "") });

      if (v.goalReached > 0.5) break;
      if (fromSkill && v.progressed < 0.5) {
        queue.length = 0;
        emit({ type: "log", origin: "SUBQ_SNAP", severity: "alert", message: "Judge rejected the replayed step · skill invalidated · handing control back to the Meta Driver" });
      }
      routeHint = v.route.choice;
      before = after;
    }
  } finally {
    await page.close();
  }

  const success = stepsComplete > 0.5;
  const pass = expectedHolds;
  if (success) memory.skills[tc.id] = verified;
  memory.traces.push({ generation: gen, faults: [], trajectory: [`[${tc.id}] ${tc.title}`, ...trajectory] });
  const summary = success
    ? pass > 0.5
      ? `PASS · React behaves as expected (P=${pass.toFixed(2)})`
      : `FAIL · behaviour contradicts the Expected Result (P(pass)=${pass.toFixed(2)}) · possible React regression or browser quirk`
    : "INCOMPLETE · could not perform every reproduction step";
  emit({ type: "qa_verdict", generation: gen, testCase: tc, pass, stepsComplete, summary });
  emit({ type: "log", origin: "SUBQ_SNAP", severity: success && pass > 0.5 ? "success" : "alert", message: `QA verdict · ${tc.id} · ${summary}` });

  if (metaCalls > 0 && !opts.signal.aborted) {
    try {
      const { lesson, testPatch } = await distillLesson({
        faults: [],
        trajectory: [`React DOM manual test "${tc.title}" (fixtures/dom/${tc.fixture})`, ...trajectory],
        success,
        existingLessons: memory.lessons,
      });
      if (lesson) memory.lessons.push(lesson);
      emit({ type: "lesson", generation: gen, lesson, testPatch });
      emit({ type: "log", origin: "META_VISION", severity: "success", message: `Lesson learned · ${lesson}` });
    } catch (err) {
      emit({ type: "log", origin: "META_VISION", severity: "warn", message: `Reflection skipped: ${(err as Error).message}` });
    }
  }

  const s: EpisodeSummary = {
    generation: gen,
    faults: [],
    steps,
    success,
    lessonsUsed: lessonsAtStart,
    metaCalls,
    replayedSteps: replayed,
    durationMs: Date.now() - started,
    mistakes,
    caseTitle: tc.title,
    qaPass: pass,
  };
  emit({ type: "episode_end", ...s });
  return { summary: s, cost };
}

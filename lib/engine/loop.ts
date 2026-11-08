import type { Browser } from "playwright";
import { click, domText, launchBrowser, markedScreenshot, openTarget, orderConfirmed, screenshot } from "./browser";
import { loadCodebase, type Codebase } from "./codebase";
import { ALL_FAULTS, FAULT_DESCRIPTIONS, type EngineEvent, type EpisodeSummary, type Fault, type MetaAction, type RouteChoice } from "./events";
import { GOAL, META_MODEL, decideAction, distillLesson } from "./meta";
import { faultKey, loadMemory, nearestSkill, saveMemory, type Memory } from "./memory";
import { SUBQ_MODEL, judgeStep, pickCurriculum } from "./subq";

const MAX_STEPS = 6;

/** Gen 1 starts on the fault a screenshot can't fully reveal, so the agent has a real mistake to learn from. */
const FIRST_SCENARIO: Fault[] = ["modal_obstruction"];

/**
 * The agent's own curriculum: every combination of 2+ faults that builds on something it has mastered but has not
 * itself been mastered. SubQ then picks the one the agent is most likely to fail.
 */
function curriculumOptions(memory: Memory): Record<string, { faults: Fault[]; description: string }> {
  const masteredKeys = new Set(Object.keys(memory.skills));
  const known = new Set(Object.keys(memory.skills).flatMap((k) => k.split("+")));
  const out: Record<string, { faults: Fault[]; description: string }> = {};
  for (let mask = 1; mask < 1 << ALL_FAULTS.length; mask += 1) {
    const faults = ALL_FAULTS.filter((_, i) => mask & (1 << i));
    if (faults.length < 2 || !faults.some((f) => known.has(f))) continue;
    const key = faultKey(faults);
    if (masteredKeys.has(key)) continue;
    out[key] = { faults, description: faults.map((f) => FAULT_DESCRIPTIONS[f]).join("; plus ") };
  }
  return out;
}

export interface CampaignOptions {
  origin: string;
  generations: number;
  fresh: boolean;
  emit: (event: EngineEvent) => void;
  signal: AbortSignal;
}

/** Compact memory for SubQ: what the agent knows, and how it has done so far. */
function memoryView(memory: Memory) {
  return {
    lessons: memory.lessons,
    learned_skills: Object.keys(memory.skills),
    past_episodes: memory.episodes,
    past_trajectories: memory.traces,
  };
}

function describe(a: MetaAction): string {
  return a.kind === "done" ? "declare done" : `click (${a.x}, ${a.y}) on ${a.target}`;
}

export async function runCampaign(opts: CampaignOptions): Promise<void> {
  const { emit } = opts;
  const codebase = await loadCodebase();
  const memory = await loadMemory(opts.fresh);
  let totalCost = 0;
  const episodes: EpisodeSummary[] = [];

  emit({
    type: "campaign_start",
    generations: opts.generations,
    codebaseTokens: codebase.approxTokens,
    codebaseFiles: codebase.files,
    metaModel: META_MODEL,
    subqModel: SUBQ_MODEL,
  });
  emit({ type: "log", origin: "SUBQ_SNAP", severity: "info", message: `Loaded ${codebase.files.length} source files (~${codebase.approxTokens.toLocaleString()} tokens) into the Judge's context` });

  const browser = await launchBrowser();
  try {
    let faults: Fault[] = FIRST_SCENARIO;
    for (let gen = 1; gen <= opts.generations; gen += 1) {
      if (opts.signal.aborted) break;

      // Gen 1 and 2 run the same scenario (learn, then reuse). From gen 3 the Judge writes the curriculum, then each new
      // scenario is repeated once so the replay shows the gain.
      if (gen >= 3 && gen % 2 === 1) {
        const catalog = curriculumOptions(memory);
        const options = Object.fromEntries(Object.entries(catalog).map(([k, c]) => [k, c.description]));
        if (Object.keys(options).length >= 2) {
          const pick = await pickCurriculum(memoryView(memory), options);
          totalCost += pick.costUsd;
          const chosen = catalog[pick.chosen] ?? Object.values(catalog)[0];
          faults = chosen.faults;
          emit({ type: "curriculum", generation: gen, chosen: pick.chosen, faults, probabilities: pick.probabilities });
          emit({
            type: "log",
            origin: "SUBQ_SNAP",
            severity: "warn",
            message: `Curriculum · ${Object.keys(options).length} candidate tests generated from mastered skills · SubQ picked ${pick.chosen} (P=${(pick.probabilities[pick.chosen] ?? 0).toFixed(2)})`,
          });
        } else {
          faults = [...ALL_FAULTS];
        }
      }

      const result = await runEpisode(browser, opts, codebase, memory, gen, faults);
      totalCost += result.cost;
      episodes.push(result.summary);
      memory.episodes.push(result.summary);
      await saveMemory(memory);
    }
  } finally {
    await browser.close();
  }
  emit({ type: "campaign_end", episodes, totalCostUsd: totalCost });
}

async function runEpisode(browser: Browser, opts: CampaignOptions, codebase: Codebase, memory: Memory, gen: number, faults: Fault[]) {
  const { emit } = opts;
  const started = Date.now();
  const lessonsAtStart = memory.lessons.length;
  emit({ type: "episode_start", generation: gen, faults, lessons: [...memory.lessons] });
  emit({ type: "log", origin: "DOM_RUNTIME", severity: "warn", message: `Gen ${gen} · launching Chromium · faults: ${faults.join(", ")}` });

  const page = await openTarget(browser, opts.origin, faults);
  const skill = nearestSkill(memory, faults);
  const queue: MetaAction[] = skill ? [...skill.steps] : [];
  if (skill) {
    emit({ type: "log", origin: "SUBQ_SNAP", severity: "info", message: `Memory hit · replaying learned skill "${skill.key}" (${queue.length} steps), verified step by step` });
  }

  const history: string[] = [];
  const trajectory: string[] = [];
  const verified: MetaAction[] = [];
  let routeHint: RouteChoice | null = null;
  let metaCalls = 0;
  let replayed = 0;
  let cost = 0;
  let success = false;
  let steps = 0;
  let mistakes = 0;
  let judgeCorrect = 0;
  let judgeChecks = 0;

  try {
    let before = await screenshot(page);
    emit({ type: "frame", generation: gen, step: 0, image: before });

    for (let step = 1; step <= MAX_STEPS && !opts.signal.aborted; step += 1) {
      steps = step;
      let action: MetaAction;
      let fromSkill = false;
      let latencyMs = 0;
      const next = queue.shift();
      if (next) {
        action = { ...next, reasoning: `[skill replay] ${next.reasoning}` };
        fromSkill = true;
        replayed += 1;
      } else {
        const view = await markedScreenshot(page);
        emit({ type: "frame", generation: gen, step, image: view.image });
        const decided = await decideAction({ imageB64: view.image, marks: view.marks, lessons: memory.lessons, history, routeHint });
        action = decided.action;
        latencyMs = decided.latencyMs;
        metaCalls += 1;
      }
      emit({ type: "meta_action", generation: gen, step, action, latencyMs });
      emit({
        type: "log",
        origin: "META_VISION",
        severity: "info",
        message: `${fromSkill ? "Skill" : `Driver (${latencyMs}ms)`} → ${describe(action)} · ${action.reasoning}`,
      });

      if (action.kind === "click") await click(page, action.x, action.y);
      const after = await screenshot(page);
      emit({ type: "frame", generation: gen, step, image: after });

      const judged = await judgeStep({
        goal: GOAL,
        codebase: codebase.text,
        memory: memoryView(memory),
        trajectory,
        action: describe(action),
        domAfter: await domText(page),
        before,
        after,
      });
      cost += judged.costUsd;
      const v = judged.verdict;
      // Score the Judge against the DOM after every step. The agent itself never reads this.
      const truthNow = await orderConfirmed(page);
      judgeChecks += 1;
      if (v.goalReached > 0.5 === truthNow) judgeCorrect += 1;
      if (v.progressed < 0.5 && v.goalReached <= 0.5) mistakes += 1;
      emit({
        type: "subq_verdict",
        generation: gen,
        step,
        verdict: v,
        latencyMs: judged.latencyMs,
        inputTokens: judged.inputTokens,
        costUsd: judged.costUsd,
        groundTruthGoal: truthNow,
      });
      emit({
        type: "log",
        origin: "SUBQ_SNAP",
        severity: v.goalReached > 0.5 ? "success" : v.progressed >= 0.5 ? "info" : "alert",
        message: `Judge ${judged.latencyMs}ms · ${judged.inputTokens.toLocaleString()} tok · progressed ${v.progressed.toFixed(2)} · goal ${v.goalReached.toFixed(2)} · route → ${v.route.choice}`,
      });

      const line = `${describe(action)} → progressed=${v.progressed.toFixed(2)} goal=${v.goalReached.toFixed(2)} route=${v.route.choice}`;
      history.push(`${step}. ${line}`);
      trajectory.push(line);
      if (v.progressed >= 0.5 || v.goalReached > 0.5) verified.push({ ...action, reasoning: action.reasoning.replace("[skill replay] ", "") });

      if (v.goalReached > 0.5) {
        success = true;
        break;
      }
      if (fromSkill && v.progressed < 0.5) {
        queue.length = 0;
        emit({ type: "log", origin: "SUBQ_SNAP", severity: "alert", message: "Judge rejected the replayed step · skill invalidated · handing control back to the Meta Driver" });
      }
      routeHint = v.route.choice;
      before = after;
    }

    const truth = await orderConfirmed(page);
    emit({
      type: "log",
      origin: "DOM_RUNTIME",
      severity: truth === success ? "success" : "alert",
      message: `Ground truth: order ${truth ? "confirmed" : "not confirmed"} · Judge ${truth === success ? "agreed" : "DISAGREED"}`,
    });
    success = success && truth;
  } finally {
    await page.close();
  }

  if (success) memory.skills[faultKey(faults)] = verified;
  memory.traces.push({ generation: gen, faults, trajectory });

  // Reflection only costs a Driver call when the Driver was needed; pure replays have nothing new to teach.
  if (metaCalls > 0 && !opts.signal.aborted) {
    try {
      const { lesson, testPatch } = await distillLesson({ faults, trajectory, success, existingLessons: memory.lessons });
      if (lesson) memory.lessons.push(lesson);
      emit({ type: "lesson", generation: gen, lesson, testPatch });
      emit({ type: "log", origin: "META_VISION", severity: "success", message: `Lesson learned · ${lesson}` });
    } catch (err) {
      emit({ type: "log", origin: "META_VISION", severity: "warn", message: `Reflection skipped: ${(err as Error).message}` });
    }
  }

  const summary: EpisodeSummary = {
    generation: gen,
    faults,
    steps,
    success,
    lessonsUsed: lessonsAtStart,
    metaCalls,
    replayedSteps: replayed,
    durationMs: Date.now() - started,
    mistakes,
    judgeCorrect,
    judgeChecks,
  };
  emit({ type: "episode_end", ...summary });
  return { summary, cost };
}

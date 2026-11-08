import { promises as fs } from "node:fs";
import path from "node:path";
import type { EngineEvent, EpisodeSummary, Fault, MetaAction } from "./events";

const DIR = path.join(process.cwd(), ".reflexqa");
const MEMORY = path.join(DIR, "memory.json");
const RECORDING = path.join(DIR, "last-run.json");

/** A skill is a verified action sequence the agent can replay without calling the Driver. */
export interface Memory {
  lessons: string[];
  skills: Record<string, MetaAction[]>;
  episodes: EpisodeSummary[];
}

export const faultKey = (faults: Fault[]) => [...faults].sort().join("+") || "baseline";

export async function loadMemory(fresh: boolean): Promise<Memory> {
  if (!fresh) {
    try {
      return JSON.parse(await fs.readFile(MEMORY, "utf8")) as Memory;
    } catch {
      /* first run */
    }
  }
  return { lessons: [], skills: {}, episodes: [] };
}

export async function saveMemory(memory: Memory): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(MEMORY, JSON.stringify(memory, null, 2));
}

/** The closest learned skill: exact match first, otherwise the largest learned fault subset. */
export function nearestSkill(memory: Memory, faults: Fault[]): { key: string; steps: MetaAction[] } | null {
  const exact = memory.skills[faultKey(faults)];
  if (exact) return { key: faultKey(faults), steps: exact };
  let best: { key: string; steps: MetaAction[] } | null = null;
  for (const [key, steps] of Object.entries(memory.skills)) {
    const parts = key.split("+");
    if (parts.every((p) => faults.includes(p as Fault)) && (!best || parts.length > best.key.split("+").length)) {
      best = { key, steps };
    }
  }
  return best;
}

export interface RecordedEvent {
  t: number;
  event: EngineEvent;
}

export async function saveRecording(events: RecordedEvent[]): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(RECORDING, JSON.stringify(events));
}

export async function loadRecording(): Promise<RecordedEvent[] | null> {
  try {
    return JSON.parse(await fs.readFile(RECORDING, "utf8")) as RecordedEvent[];
  } catch {
    return null;
  }
}

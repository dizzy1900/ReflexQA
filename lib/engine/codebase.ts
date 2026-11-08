import { promises as fs } from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components", "store", "lib"];
const EXT = /\.(tsx?|css)$/;

export interface Codebase {
  text: string;
  files: { file: string; lines: number }[];
  approxTokens: number;
}

let cached: Codebase | null = null;

async function walk(dir: string, out: string[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (EXT.test(e.name)) out.push(full);
  }
}

/** The whole application source, fed to SubQ Snap on every judgement (it fits easily in 384K). */
export async function loadCodebase(): Promise<Codebase> {
  if (cached) return cached;
  const root = process.cwd();
  const paths: string[] = [];
  for (const r of ROOTS) await walk(path.join(root, r), paths);
  paths.sort();
  const files: Codebase["files"] = [];
  const chunks: string[] = [];
  for (const p of paths) {
    const src = await fs.readFile(p, "utf8");
    const rel = path.relative(root, p);
    files.push({ file: rel, lines: src.split("\n").length });
    chunks.push(`// ===== ${rel} =====\n${src}`);
  }
  const text = chunks.join("\n\n");
  cached = { text, files, approxTokens: Math.round(text.length / 3.6) };
  return cached;
}

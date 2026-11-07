import {
  COST_PER_HEAL_REFLEX,
  RESERVATION_ID,
  SUBQ_PARSE_MS,
  TOKENS_SURGE_TARGET,
  V2_RECT,
} from "../../store/useAgentStore";

/* The pull request ReflexQA opens after a selector self-heal. The numbers that come from the run are read from the store's constants so the PR can never disagree with the HUD. */

export const PR_NUMBER = 1042;
export const PR_TITLE = "[Self-Heal] Reconcile selector mutation in checkout flow";
export const PR_AUTHOR = "ReflexQA Bot (Subquadratic Engine)";
export const PR_BRANCH = "reflexqa/self-heal-1042";
export const PR_BASE = "main";
export const PR_CONFIDENCE_PERCENT = 99.4;

export const DIFF_FILE = { path: "test/e2e/checkout.spec.ts", line: 42 } as const;

export type DiffKind = "context" | "remove" | "add";

export interface DiffLine {
  id: string;
  kind: DiffKind;
  oldNo: number | null;
  newNo: number | null;
  code: string;
}

export const DIFF_LINES: readonly DiffLine[] = [
  { id: "ctx-before", kind: "context", oldNo: 41, newNo: 41, code: "  await page.getByLabel('Billing email').fill('billing@northwind.ai');" },
  { id: "del", kind: "remove", oldNo: 42, newNo: null, code: "  await page.locator('#checkout-btn').click();" },
  {
    id: "add-comment",
    kind: "add",
    oldNo: null,
    newNo: 42,
    code: `  // Healed in ${SUBQ_PARSE_MS}ms via SubQ Trace Reconciliation (Confidence: ${PR_CONFIDENCE_PERCENT}%)`,
  },
  {
    id: "add-click",
    kind: "add",
    oldNo: null,
    newNo: 43,
    code: "  await page.getByRole('button', { name: /complete reservation/i }).click();",
  },
  { id: "ctx-after", kind: "context", oldNo: 43, newNo: 44, code: `  await expect(page.getByText('${RESERVATION_ID}')).toBeVisible();` },
];

export const DIFF_STATS = {
  additions: DIFF_LINES.filter((l) => l.kind === "add").length,
  deletions: DIFF_LINES.filter((l) => l.kind === "remove").length,
} as const;

export type AstTone = "plain" | "remove" | "add";

export interface AstNode {
  depth: number;
  kind: string;
  detail?: string;
  tone: AstTone;
}

export const AST_TRACE: readonly AstNode[] = [
  { depth: 0, kind: "Program", detail: DIFF_FILE.path, tone: "plain" },
  { depth: 1, kind: "ExpressionStatement", detail: `line ${DIFF_FILE.line}`, tone: "plain" },
  { depth: 2, kind: "AwaitExpression", tone: "plain" },
  { depth: 3, kind: "CallExpression", detail: ".click()", tone: "plain" },
  { depth: 4, kind: "MemberExpression", detail: "callee", tone: "plain" },
  { depth: 5, kind: "CallExpression", detail: "page.locator('#checkout-btn') · 0 matches", tone: "remove" },
  { depth: 5, kind: "CallExpression", detail: "page.getByRole('button', { name: /complete reservation/i }) · 1 match", tone: "add" },
];

/** Where Meta Vision's OCR found the healed button's top-left corner, in target-viewport pixels. */
export const GROUNDING_POINT = { x: V2_RECT.x, y: V2_RECT.y } as const;

export const TELEMETRY = {
  tokens: TOKENS_SURGE_TARGET.toLocaleString("en-US"),
  ms: SUBQ_PARSE_MS,
  cost: `$${COST_PER_HEAL_REFLEX.toFixed(4)}`,
} as const;

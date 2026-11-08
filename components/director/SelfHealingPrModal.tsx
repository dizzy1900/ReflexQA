"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Check, GitBranch, GitMerge, GitPullRequest, Network, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { AstTracePanel } from "./AstTracePanel";
import { PrDiffViewer } from "./PrDiffViewer";
import { PrTelemetryBar } from "./PrTelemetryBar";
import { DIFF_STATS, PR_AUTHOR, PR_BASE, PR_BRANCH, PR_NUMBER, PR_TITLE } from "./prContent";

type MergeState = "open" | "merging" | "merged";

/** Stand-in for the deploy pipeline, long enough for the spinner to read. */
const MERGE_MS = 1100;
const TITLE_ID = "self-heal-pr-title";

function LivePatch({ patch, file }: { patch: string; file: string }) {
  return (
    <section aria-label="Patch written by Meta Muse Spark" className="overflow-hidden rounded-md bg-background ring-1 ring-inset ring-card-border">
      <header className="flex items-center justify-between border-b border-card-border px-3 py-2 text-xs text-fg-subtle">
        <span className="font-mono text-fg">{file}</span>
        <span>Live patch · Meta Muse Spark</span>
      </header>
      <pre className="max-h-72 overflow-auto p-3 font-mono text-xs leading-5 text-fg">
        {patch
          .split("\n")
          .map((line) => (line.startsWith("+") || line.startsWith("-") ? line : `+ ${line}`))
          .join("\n")}
      </pre>
    </section>
  );
}

function PrDialog({ onClose }: { onClose: () => void }) {
  const livePatch = useAgentStore((s) => (s.mode === "live" ? s.liveTestPatch : null));
  const liveCase = useAgentStore((s) => (s.mode === "live" ? s.liveCase : null));
  const title = liveCase ? `[ReflexQA] Automate React DOM manual test: ${liveCase.title}` : PR_TITLE;
  const branch = liveCase ? `reflexqa/automate-${liveCase.fixture}-${liveCase.index}` : PR_BRANCH;
  const patchFile = liveCase ? `fixtures/dom/e2e/${liveCase.fixture}.spec.ts` : "test/e2e/checkout.spec.ts";
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLElement>(null);
  const astId = useId();
  const [merge, setMerge] = useState<MergeState>("open");
  const [astOpen, setAstOpen] = useState(false);

  // Move focus into the dialog, and hand it back to whatever had it when the dialog goes away.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, []);

  // Escape closes. Tab wraps inside the dialog so keyboard focus never leaks into the page behind it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const root = dialogRef.current;
      if (event.key !== "Tab" || !root) return;

      const focusable = Array.from(root.querySelectorAll<HTMLElement>("button:not([disabled])"));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!(active instanceof Node) || !root.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === root)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (merge !== "merging") return;
    const timer = setTimeout(() => setMerge("merged"), MERGE_MS);
    return () => clearTimeout(timer);
  }, [merge]);

  // The merge button leaves the DOM once merged, which would drop focus to the page.
  useEffect(() => {
    if (merge !== "open") dialogRef.current?.focus();
  }, [merge]);

  const merged = merge === "merged";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute inset-0 bg-black/60"
      />

      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-card outline-none ring-1 ring-inset ring-card-border"
      >

        <header className="flex flex-col gap-2.5 border-b border-card-border px-5 py-4">
          <span className="flex items-start gap-3">
            <GitPullRequest className="mt-1 h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
            <h2 id={TITLE_ID} className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-fg">
              <span className="text-fg-muted">PR #{PR_NUMBER}:</span> {title}
            </h2>
            <Badge tone={merged ? "success" : "neutral"} className="mt-0.5">
              {merged ? "Merged" : "Open"}
            </Badge>
            <button
              type="button"
              aria-label="Close pull request"
              onClick={onClose}
              className={cn(
                "-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-subtle outline-none",
                "transition-colors duration-150 ease-out hover:bg-white/[0.06] hover:text-fg",
                "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40",
              )}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </span>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-7 text-xs text-fg-muted">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] text-fg-muted">
                <Bot className="h-3 w-3" aria-hidden />
              </span>
              <span className="font-medium text-fg">{PR_AUTHOR}</span>
            </span>
            <span>opened this pull request just now</span>
            <span className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] text-fg ring-1 ring-inset ring-card-border">
              <GitBranch className="h-3 w-3 text-fg-subtle" aria-hidden />
              {branch} <span className="text-fg-subtle">→</span> {PR_BASE}
            </span>
            <span className="font-mono text-[11px] tabular-nums">
              1 file · <span className="text-success">+{DIFF_STATS.additions}</span>{" "}
              <span className="text-danger">−{DIFF_STATS.deletions}</span>
            </span>
          </p>
        </header>

        <section aria-label="Changes" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
          {livePatch ? <LivePatch patch={livePatch} file={patchFile} /> : <PrDiffViewer />}
          <AnimatePresence initial={false}>{astOpen ? <AstTracePanel key="ast" id={astId} /> : null}</AnimatePresence>
        </section>

        <footer className="flex flex-wrap items-center gap-2 border-t border-card-border px-5 py-3">
          <AnimatePresence mode="wait" initial={false}>
            {merged ? (
              <motion.span
                key="merged"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                <Badge tone="success" className="h-8 px-3 text-xs">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Merged &amp; deployed to production
                </Badge>
              </motion.span>
            ) : (
              <motion.span key="merge" exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex">
                <Button size="sm" loading={merge === "merging"} onClick={() => setMerge("merging")}>
                  {merge === "merging" ? null : <GitMerge className="h-3.5 w-3.5" aria-hidden />}
                  {merge === "merging" ? "Deploying patch…" : "Merge and deploy"}
                </Button>
              </motion.span>
            )}
          </AnimatePresence>

          <Button variant="secondary" size="sm" onClick={onClose}>
            {merged ? "Close" : "Discard"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-expanded={astOpen}
            aria-controls={astId}
            onClick={() => setAstOpen((v) => !v)}
            className="ml-auto"
          >
            <Network className="h-3.5 w-3.5" aria-hidden />
            {astOpen ? "Hide AST trace" : "View AST trace"}
          </Button>
        </footer>

        <PrTelemetryBar />
      </motion.section>
    </div>
  );
}

/** Mounted once on the page. Opens itself when the store's `prModalOpen` flips, whatever flipped it: the golden demo, the `P` key, or the dock. */
export function SelfHealingPrModal() {
  const open = useAgentStore((s) => s.prModalOpen);
  const close = useAgentStore((s) => s.closePrModal);

  return <AnimatePresence>{open ? <PrDialog key="pr-dialog" onClose={close} /> : null}</AnimatePresence>;
}

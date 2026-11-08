"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Check, GitBranch, GitMerge, GitPullRequest, Network, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";
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
    <section aria-label="Patch written by Meta Muse Spark" className="overflow-hidden rounded-lg bg-background ring-1 ring-inset ring-card-border">
      <header className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 font-mono text-[11px] text-fg-subtle">
        <span>{file}</span>
        <span className="text-ansi-green">live patch · Meta Muse Spark</span>
      </header>
      <pre className="max-h-72 overflow-auto p-3 font-mono text-xs leading-relaxed text-ansi-green">
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
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } }}
        transition={spring}
        className={cn(
          "relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-card outline-none",
          "ring-1 ring-inset ring-card-border-hover",
          "shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9),0_0_64px_-24px_rgba(192,132,252,0.4)]",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ansi-magenta/80 to-transparent"
        />

        <header className="flex flex-col gap-2.5 border-b border-card-border px-5 py-4">
          <span className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ansi-magenta/10 text-ansi-magenta ring-1 ring-inset ring-ansi-magenta/30 shadow-glow-purple">
              <GitPullRequest className="h-4 w-4" aria-hidden />
            </span>
            <h2 id={TITLE_ID} className="min-w-0 flex-1 text-base font-semibold leading-snug text-fg">
              <span className="text-fg-muted">PR #{PR_NUMBER}:</span> {title}
            </h2>
            <Badge tone="purple" className="mt-0.5">
              {merged ? "Merged" : "Open"}
            </Badge>
            <motion.button
              type="button"
              aria-label="Close pull request"
              onClick={onClose}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.9 }}
              transition={spring}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-fg-muted outline-none ring-1 ring-inset ring-card-border",
                "transition-[background-color,color,box-shadow] duration-200 ease-out hover:bg-white/[0.06] hover:text-fg hover:shadow-glow-info",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/70 focus-visible:shadow-glow-info",
              )}
            >
              <X className="h-4 w-4" aria-hidden />
            </motion.button>
          </span>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-11 text-xs text-fg-muted">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-accent to-vision-nominal text-white ring-1 ring-inset ring-white/20">
                <Bot className="h-3 w-3" aria-hidden />
              </span>
              <span className="font-medium text-fg">{PR_AUTHOR}</span>
            </span>
            <span>opened this pull request just now</span>
            <span className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] ring-1 ring-inset ring-card-border">
              <GitBranch className="h-3 w-3 text-fg-subtle" aria-hidden />
              {branch} <span className="text-fg-subtle">→</span> {PR_BASE}
            </span>
            <span className="font-mono text-[11px] tabular-nums">
              1 file · <span className="text-ansi-green">+{DIFF_STATS.additions}</span>{" "}
              <span className="text-ansi-red">−{DIFF_STATS.deletions}</span>
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={spring}
                className="flex"
              >
                <Badge tone="success" className="h-10 px-3.5 text-xs">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Merged &amp; deployed to production
                </Badge>
              </motion.span>
            ) : (
              <motion.span key="merge" exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex">
                <Button loading={merge === "merging"} onClick={() => setMerge("merging")}>
                  {merge === "merging" ? null : <GitMerge className="h-4 w-4" aria-hidden />}
                  {merge === "merging" ? "Deploying patch…" : "Merge & Deploy Patch"}
                </Button>
              </motion.span>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            onClick={onClose}
            className="ring-1 ring-inset ring-card-border hover:text-danger hover:shadow-glow-danger focus-visible:shadow-glow-danger"
          >
            {merged ? "Close" : "Discard"}
          </Button>

          <Button
            variant="secondary"
            aria-expanded={astOpen}
            aria-controls={astId}
            onClick={() => setAstOpen((v) => !v)}
            className="ml-auto"
          >
            <Network className="h-4 w-4" aria-hidden />
            {astOpen ? "Hide AST Trace" : "View AST Trace"}
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

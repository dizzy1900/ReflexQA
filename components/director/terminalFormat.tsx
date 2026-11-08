import type { ReactNode } from "react";
import type { LogOrigin, LogSeverity } from "../../store/useAgentStore";

export const ORIGIN_STYLE: Record<LogOrigin, string> = {
  META_VISION: "text-fg-muted",
  SUBQ_SNAP: "text-fg-muted",
  DOM_RUNTIME: "text-fg-muted",
};

/** Short source labels, Vercel-logs style. */
export const ORIGIN_LABEL: Record<LogOrigin, string> = {
  META_VISION: "meta",
  SUBQ_SNAP: "subq",
  DOM_RUNTIME: "dom",
};

export const SEVERITY_STYLE: Record<LogSeverity, { tag: string; tagClass: string; messageClass: string }> = {
  info: { tag: "info", tagClass: "bg-fg-subtle", messageClass: "text-fg-muted" },
  warn: { tag: "warn", tagClass: "bg-warning", messageClass: "text-fg" },
  alert: { tag: "error", tagClass: "bg-danger", messageClass: "text-danger" },
  success: { tag: "ok", tagClass: "bg-success", messageClass: "text-fg" },
};

// One capture group, so `split` alternates plain text and tokens.
const TOKEN = /(#[\w-]+|\$\d+\.\d+|\b\d[\d,]*(?:ms|\s?tokens)\b|[\w./-]+\.(?:tsx?|css|log)(?::\d+)?)/g;

function tokenClass(): string {
  return "text-fg";
}

/** Colours selectors, money, durations and file paths inside a message, the way a log highlighter would. */
export function highlight(message: string): ReactNode[] {
  return message.split(TOKEN).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={tokenClass()}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** `mm:ss.t` from milliseconds. */
export function formatClock(ms: number): string {
  const total = Math.max(0, ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const tenths = Math.floor((total % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

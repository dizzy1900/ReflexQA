import type { ReactNode } from "react";
import type { LogOrigin, LogSeverity } from "../../store/useAgentStore";

export const ORIGIN_STYLE: Record<LogOrigin, string> = {
  META_VISION: "text-ansi-magenta",
  SUBQ_SNAP: "text-ansi-cyan",
  DOM_RUNTIME: "text-ansi-blue",
};

export const SEVERITY_STYLE: Record<LogSeverity, { tag: string; tagClass: string; messageClass: string }> = {
  info: { tag: "INFO", tagClass: "text-ansi-green", messageClass: "text-fg" },
  warn: { tag: "WARN", tagClass: "text-ansi-yellow", messageClass: "text-ansi-yellow" },
  alert: { tag: "ALRT", tagClass: "text-ansi-red", messageClass: "font-semibold text-ansi-red" },
  success: { tag: "OK", tagClass: "text-ansi-green", messageClass: "text-ansi-green" },
};

// One capture group, so `split` alternates plain text and tokens.
const TOKEN = /(#[\w-]+|\$\d+\.\d+|\b\d[\d,]*(?:ms|\s?tokens)\b|[\w./-]+\.(?:tsx?|css|log)(?::\d+)?)/g;

function tokenClass(token: string): string {
  if (token.startsWith("#")) return "text-ansi-cyan";
  if (token.startsWith("$")) return "text-ansi-green";
  if (/(?:ms|tokens)$/.test(token)) return "text-ansi-yellow";
  return "text-ansi-blue underline decoration-dotted underline-offset-2";
}

/** Colours selectors, money, durations and file paths inside a message, the way a log highlighter would. */
export function highlight(message: string): ReactNode[] {
  return message.split(TOKEN).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={tokenClass(part)}>
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

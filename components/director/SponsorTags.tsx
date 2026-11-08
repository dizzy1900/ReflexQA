"use client";

/** The two sponsor engines, as plain text. */
export function SponsorTags() {
  return (
    <p aria-label="Powered by" className="hidden items-center gap-1.5 text-xs text-fg-subtle lg:flex">
      <span>Meta Model API</span>
      <span aria-hidden>·</span>
      <span>SubQ Snap</span>
    </p>
  );
}

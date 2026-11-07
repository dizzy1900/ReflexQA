"use client";

import type { ReactNode } from "react";

interface PaneHeaderProps {
  id: string;
  title: string;
  /** An icon element, so server pages can pass it across the client boundary. */
  icon: ReactNode;
  /** Right-aligned slot, usually a status badge. */
  aside?: ReactNode;
}

/** Title strip above a column of the command center. */
export function PaneHeader({ id, title, icon, aside }: PaneHeaderProps) {
  return (
    <header className="flex min-h-[1.75rem] items-center justify-between gap-3 px-1">
      <h2 id={id} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-muted">
        <span className="flex text-fg-subtle [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      {aside}
    </header>
  );
}

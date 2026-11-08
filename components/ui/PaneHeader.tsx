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
      <h2 id={id} className="flex items-center gap-2 text-[13px] font-medium text-fg">
        <span className="flex text-fg-subtle [&>svg]:h-4 [&>svg]:w-4" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      {aside}
    </header>
  );
}

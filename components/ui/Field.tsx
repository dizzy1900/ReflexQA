"use client";

import { forwardRef, useId, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";

export interface FieldProps extends Omit<HTMLMotionProps<"input">, "id"> {
  label: string;
  /** Renders the value in the mono face with tabular figures. */
  mono?: boolean;
  trailing?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, mono = false, trailing, className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      <span className="relative flex items-center">
        <motion.input
          ref={ref}
          id={id}
          autoComplete="off"
          spellCheck={false}
          whileFocus={{ y: -1 }}
          transition={spring}
          className={cn(
            "h-11 w-full min-w-0 rounded-lg bg-background/70 px-3 text-sm text-fg outline-none ring-1 ring-inset ring-card-border",
            "placeholder:text-fg-subtle transition-[box-shadow,background-color] duration-200 ease-out",
            "hover:ring-card-border-hover focus:bg-background focus:ring-accent/60 focus:shadow-glow-accent",
            mono && "font-mono tabular-nums",
            trailing ? "pr-10" : null,
            className,
          )}
          {...rest}
        />
        {trailing ? <span className="pointer-events-none absolute right-3 text-fg-subtle">{trailing}</span> : null}
      </span>
    </label>
  );
});

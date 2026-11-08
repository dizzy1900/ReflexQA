"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium " +
  "outline-none transition-[background-color,color,box-shadow,opacity] duration-200 ease-out " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 " +
  "disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-fg text-black hover:bg-white",
  secondary: "bg-transparent text-fg ring-1 ring-inset ring-card-border-hover hover:bg-white/[0.06]",
  ghost: "text-fg-muted hover:bg-white/[0.06] hover:text-fg",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-10 px-4 text-sm",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className, children, type = "button", ...rest },
  ref,
) {
  const inert = disabled || loading;
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={inert}
      aria-busy={loading || undefined}
      whileTap={inert ? undefined : { scale: 0.98 }}
      transition={spring}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </motion.button>
  );
});

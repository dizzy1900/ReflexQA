"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/cn";
import { fadeUp } from "../../lib/motion";

export interface CardProps extends HTMLMotionProps<"section"> {
  /** Brightens the border and adds a glow on hover. */
  interactive?: boolean;
}

// The border is an inset ring, not a CSS border, so it never changes the card's box size.
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <motion.section
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "rounded-xl bg-card ring-1 ring-inset ring-card-border transition-[box-shadow] duration-200 ease-out",
        interactive && "hover:shadow-glow-accent hover:ring-card-border-hover",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.section>
  );
});

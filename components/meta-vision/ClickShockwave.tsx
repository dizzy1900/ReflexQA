"use client";

import { motion } from "framer-motion";

interface ClickShockwaveProps {
  /** Delay before the ring starts, in seconds. */
  delay?: number;
  onDone: () => void;
}

/** One expanding ring, centered on the cursor tip. Inherits color from its parent. */
export function ClickShockwave({ delay = 0, onDone }: ClickShockwaveProps) {
  return (
    <motion.span
      data-shockwave
      initial={{ opacity: 0.9, scale: 0.15 }}
      animate={{ opacity: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={onDone}
      className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-2 border-current shadow-[0_0_16px_currentColor]"
      aria-hidden
    />
  );
}

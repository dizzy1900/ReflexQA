"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import { cn } from "../../lib/cn";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const ROLL = { type: "spring", stiffness: 300, damping: 30, mass: 0.7 } as const;

function Digit({ digit, instant }: { digit: number; instant: boolean }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden" aria-hidden>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={instant ? { duration: 0 } : ROLL}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] text-center leading-none">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

interface OdometerProps {
  /** Animated value. Digits roll as it changes. */
  value: MotionValue<number>;
  /** The settled value, announced to screen readers instead of every intermediate frame. */
  label: string;
  className?: string;
}

/** Mechanical digit wheels with thousands separators. Columns are keyed from the right so they persist as the number grows. */
export function Odometer({ value, label, className }: OdometerProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [current, setCurrent] = useState(() => Math.max(0, Math.round(value.get())));
  useMotionValueEvent(value, "change", (v) => setCurrent(Math.max(0, Math.round(v))));

  const chars = current.toLocaleString("en-US").split("");

  return (
    <span role="img" aria-label={label} className={cn("inline-flex h-[1em] items-center font-mono tabular-nums leading-none", className)}>
      {chars.map((char, index) => {
        const fromRight = chars.length - 1 - index;
        return char === "," ? (
          <span key={`sep-${fromRight}`} className="inline-block h-[1em] w-[0.34em] text-center leading-none text-fg-subtle" aria-hidden>
            ,
          </span>
        ) : (
          <Digit key={`d-${fromRight}`} digit={Number(char)} instant={reduceMotion} />
        );
      })}
    </span>
  );
}

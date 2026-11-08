"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type MotionValue } from "framer-motion";
import { cn } from "../../lib/cn";
import { spring, springPop } from "../../lib/motion";
import { useAgentStore } from "../../store/useAgentStore";
import { ClickShockwave } from "./ClickShockwave";
import { toneStyles, type VisionTone } from "./visionTheme";

interface GhostCursorProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  tone: VisionTone;
}

export function GhostCursor({ x, y, tone }: GhostCursorProps) {
  const visible = useAgentStore((s) => s.agentStatus !== "idle");
  const isClicking = useAgentStore((s) => s.cursor.isClicking);
  const targetLabel = useAgentStore((s) => s.cursor.targetLabel);
  const styles = toneStyles[tone];

  const [rings, setRings] = useState<number[]>([]);
  const nextRing = useRef(0);
  const wasClicking = useRef(false);

  // Each press (rising edge) spawns a primary and a delayed echo ring.
  useEffect(() => {
    if (isClicking && !wasClicking.current) {
      const primary = nextRing.current++;
      const echo = nextRing.current++;
      setRings((current) => [...current, primary, echo]);
    }
    wasClicking.current = isClicking;
  }, [isClicking]);

  const removeRing = (id: number) => setRings((current) => current.filter((ring) => ring !== id));

  return (
    <motion.div className="absolute left-0 top-0" style={{ x, y }}>
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="cursor"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={springPop}
            data-ghost-cursor
            className={cn("relative transition-colors duration-300 ease-out", styles.text)}
          >
            <motion.span
              animate={{ scale: isClicking ? 1.7 : 1, opacity: isClicking ? 1 : 0.7 }}
              transition={spring}
              className="hidden"
              aria-hidden
            />

            {rings.map((id, index) => (
              <ClickShockwave key={id} delay={index % 2 === 1 ? 0.12 : 0} onDone={() => removeRing(id)} />
            ))}

            <motion.svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              animate={{ scale: isClicking ? 0.86 : 1 }}
              transition={spring}
              style={{ originX: "3px", originY: "2px" }}
              className="relative -left-[3px] -top-[2px] overflow-visible"
              aria-hidden
            >
              <path
                d="M3 2 L3 20 L7.6 15.8 L10.8 23 L14 21.6 L10.9 14.5 L17.4 14.2 Z"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </motion.svg>

            <AnimatePresence mode="wait">
              {targetLabel ? (
                <motion.span
                  key={targetLabel}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={spring}
                  className="absolute left-5 top-5 whitespace-nowrap rounded bg-background/85 px-1.5 py-1 font-mono text-[10px] leading-none text-current ring-1 ring-inset ring-current/30"
                >
                  {targetLabel}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

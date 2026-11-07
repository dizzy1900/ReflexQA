import type { Variants } from "framer-motion";

export const spring = { type: "spring", stiffness: 400, damping: 30, mass: 0.8 } as const;
export const springSoft = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } as const;
export const springPop = { type: "spring", stiffness: 500, damping: 24, mass: 0.7 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: 4, transition: { duration: 0.15, ease: "easeOut" } },
};

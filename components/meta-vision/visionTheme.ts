import type { AgentStatus, BoxStatus } from "../../store/useAgentStore";

export type VisionTone = "nominal" | "fail" | "healed";

/** `evaluating` has no color of its own: it is nominal cyan plus a scan animation. */
export const boxTone: Record<BoxStatus, VisionTone> = {
  nominal: "nominal",
  evaluating: "nominal",
  failed: "fail",
  healed: "healed",
};

/** The agent reads as "failed" from the regression until the OCR fallback re-grounds the target. */
export function agentTone(status: AgentStatus): VisionTone {
  if (status === "regression_tripped" || status === "subq_healing") return "fail";
  if (status === "healed_execution" || status === "success") return "healed";
  return "nominal";
}

interface ToneStyle {
  /** Sets `currentColor` for borders, icons and canvas strokes. */
  text: string;
  tint: string;
  glow: string;
  ring: string;
  halo: string;
  solid: string;
}

export const toneStyles: Record<VisionTone, ToneStyle> = {
  nominal: {
    text: "text-vision-nominal",
    tint: "bg-vision-nominal/[0.05]",
    glow: "shadow-glow-vision-nominal",
    ring: "ring-vision-nominal/40",
    halo: "bg-vision-nominal/25",
    solid: "bg-vision-nominal",
  },
  fail: {
    text: "text-vision-fail",
    tint: "bg-vision-fail/[0.07]",
    glow: "shadow-glow-vision-fail",
    ring: "ring-vision-fail/45",
    halo: "bg-vision-fail/25",
    solid: "bg-vision-fail",
  },
  healed: {
    text: "text-vision-healed",
    tint: "bg-vision-healed/[0.06]",
    glow: "shadow-glow-vision-healed",
    ring: "ring-vision-healed/40",
    halo: "bg-vision-healed/25",
    solid: "bg-vision-healed",
  },
};

export const BOX_STATUS_LABEL: Record<BoxStatus, string> = {
  nominal: "Nominal",
  evaluating: "Evaluating",
  failed: "Failed",
  healed: "Healed",
};

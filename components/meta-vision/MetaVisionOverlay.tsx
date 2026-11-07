"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TARGET_BOX_ID, TARGET_VIEWPORT, useAgentStore } from "../../store/useAgentStore";
import { BoundingReticle } from "./BoundingReticle";
import { CursorTrail } from "./CursorTrail";
import { GhostCursor } from "./GhostCursor";
import { useCursorSpring } from "./useCursorSpring";
import { agentTone } from "./visionTheme";

interface MetaVisionOverlayProps {
  /** Screen pixels per target pixel. Pass the `scale` that `TargetAppSandbox` hands to its `overlay` render prop. */
  scale: number;
}

/**
 * Inspection layer for the Target app: bounding reticles, OCR readout, ghost cursor and trail.
 * Fill the sandbox's overlay slot with it:
 *
 *   <TargetAppSandbox overlay={({ scale }) => <MetaVisionOverlay scale={scale} />} />
 */
export function MetaVisionOverlay({ scale }: MetaVisionOverlayProps) {
  const boxes = useAgentStore((s) => s.boundingBoxes);
  const observing = useAgentStore((s) => s.agentStatus === "observing");
  const tone = useAgentStore((s) => agentTone(s.agentStatus));
  const { x, y } = useCursorSpring(scale);

  const width = TARGET_VIEWPORT.w * scale;
  const height = TARGET_VIEWPORT.h * scale;

  return (
    <section aria-hidden className="absolute inset-0 overflow-hidden" data-meta-vision-overlay>
      <CursorTrail x={x} y={y} width={width} height={height} tone={tone} />

      <AnimatePresence>
        {observing ? (
          <motion.span
            key="scan-beam"
            initial={{ top: "-4%", opacity: 0 }}
            animate={{ top: "104%", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut", opacity: { duration: 0.3 } }}
            className="absolute inset-x-0 h-16 -translate-y-1/2 bg-gradient-to-b from-transparent via-vision-nominal/15 to-transparent"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {boxes.map((box) => (
          <BoundingReticle key={box.id} box={box} scale={scale} isTarget={box.id === TARGET_BOX_ID} />
        ))}
      </AnimatePresence>

      <GhostCursor x={x} y={y} tone={tone} />
    </section>
  );
}

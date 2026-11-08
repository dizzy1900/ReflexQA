"use client";

import { ScanEye } from "lucide-react";
import { LiveFrameFeed } from "../../components/meta-vision/LiveFrameFeed";
import { useAgentStore } from "../../store/useAgentStore";
import { MetaVisionOverlay } from "../../components/meta-vision/MetaVisionOverlay";
import { MultimodalReasoningPanel } from "../../components/meta-vision/MultimodalReasoningPanel";
import { TargetAppSandbox } from "../../components/target/TargetAppSandbox";
import { Badge } from "../../components/ui/Badge";
import { PaneHeader } from "../../components/ui/PaneHeader";

/**
 * Column 2: the agent's view. A read-only copy of the target page is the camera feed, and the
 * Meta Vision overlay is drawn over it. The overlay needs the feed's scale, which is why this is a client module.
 */
export function MetaVisionPane() {
  const live = useAgentStore((s) => s.mode === "live");
  const frame = useAgentStore((s) => s.liveFrame);
  const replay = useAgentStore((s) => s.liveReplay);
  const metaModel = useAgentStore((s) => s.liveModels?.meta ?? "muse-spark");
  const atRest = useAgentStore((s) => s.mode !== "live" && s.agentStatus === "idle" && !s.isPlaying);
  return (
    <section aria-labelledby="pane-vision-title" className="flex min-h-0 min-w-0 flex-col gap-2 lg:overflow-y-auto">
      <PaneHeader
        id="pane-vision-title"
        title="Meta Vision"
        icon={<ScanEye />}
        aside={
          <Badge tone="neutral">
            {live ? `${replay ? "Recorded run" : "Live"} · ${metaModel}` : "Perception feed"}
          </Badge>
        }
      />
      {live && frame ? (
        <LiveFrameFeed frame={frame} />
      ) : atRest || live ? (
        <figure className="flex aspect-[16/10] w-full shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-card ring-1 ring-inset ring-card-border">
          <ScanEye className="h-5 w-5 text-fg-subtle" aria-hidden />
          <figcaption className="text-[13px] text-fg-muted">No frames yet</figcaption>
          <p className="text-xs text-fg-subtle">The Driver&apos;s screenshots stream here during a run.</p>
        </figure>
      ) : (
        <TargetAppSandbox mirror overlay={({ scale }) => <MetaVisionOverlay scale={scale} />} className="shrink-0" />
      )}
      <MultimodalReasoningPanel className="shrink-0" />
    </section>
  );
}

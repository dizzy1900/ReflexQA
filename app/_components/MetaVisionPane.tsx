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
  return (
    <section aria-labelledby="pane-vision-title" className="flex min-h-0 min-w-0 flex-col gap-2 lg:overflow-y-auto">
      <PaneHeader
        id="pane-vision-title"
        title="Meta Vision"
        icon={<ScanEye />}
        aside={
          <Badge tone={live ? "success" : "info"} pulse>
            {live ? `${replay ? "Recorded run" : "Live"} · ${metaModel}` : "Perception feed"}
          </Badge>
        }
      />
      {live && frame ? (
        <LiveFrameFeed frame={frame} />
      ) : (
        <TargetAppSandbox mirror overlay={({ scale }) => <MetaVisionOverlay scale={scale} />} className="shrink-0" />
      )}
      <MultimodalReasoningPanel className="shrink-0" />
    </section>
  );
}

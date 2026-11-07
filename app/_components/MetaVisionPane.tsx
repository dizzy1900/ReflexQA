"use client";

import { ScanEye } from "lucide-react";
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
  return (
    <section aria-labelledby="pane-vision-title" className="flex min-h-0 min-w-0 flex-col gap-2 lg:overflow-y-auto">
      <PaneHeader
        id="pane-vision-title"
        title="Meta Vision"
        icon={<ScanEye />}
        aside={
          <Badge tone="info" pulse>
            Perception feed
          </Badge>
        }
      />
      <TargetAppSandbox mirror overlay={({ scale }) => <MetaVisionOverlay scale={scale} />} className="shrink-0" />
      <MultimodalReasoningPanel className="shrink-0" />
    </section>
  );
}

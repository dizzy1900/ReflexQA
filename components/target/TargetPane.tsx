"use client";

import { AppWindow } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { PaneHeader } from "../ui/PaneHeader";
import { ReactTestCaseCard } from "./ReactTestCaseCard";
import { TargetAppSandbox } from "./TargetAppSandbox";
import { TargetInspector } from "./TargetInspector";

/** Column 1: the software under test. React's DOM test suite during a live React run, the checkout otherwise. */
export function TargetPane({ className }: { className?: string }) {
  // React leads: at rest the pane introduces React's suite; the checkout only appears while its scripted demo plays.
  const reactRun = useAgentStore(
    (s) =>
      (s.mode === "live" && (s.liveCase !== null || s.liveCatalogSize > 0 || (s.liveRunning && !s.liveReplay))) ||
      (s.mode !== "live" && s.agentStatus === "idle" && !s.isPlaying),
  );

  return (
    <section aria-labelledby="pane-target-title" className={className}>
      <PaneHeader
        id="pane-target-title"
        title={reactRun ? "Target · react/react" : "Target App"}
        icon={<AppWindow />}
        aside={
          reactRun ? (
            <Badge tone="info" pulse>
              React DOM QA suite
            </Badge>
          ) : (
            <Badge tone="success" pulse>
              Interactive
            </Badge>
          )
        }
      />
      {reactRun ? (
        <ReactTestCaseCard className="shrink-0" />
      ) : (
        <>
          <TargetAppSandbox chaosControls={false} className="shrink-0" />
          <TargetInspector className="shrink-0" />
        </>
      )}
    </section>
  );
}

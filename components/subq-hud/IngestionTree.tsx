"use client";

import { FileCode2, FolderGit2, Network, ScrollText, Workflow, type LucideIcon } from "lucide-react";
import { SUBQ_PARSE_MS, useAgentStore } from "../../store/useAgentStore";
import { Badge } from "../ui/Badge";
import { HudPanel } from "./HudPanel";
import { IngestionTreeNode } from "./IngestionTreeNode";
import { formatInt, REPO_ARTIFACTS, type RepoArtifact } from "./subqModel";

/** Seconds between consecutive nodes lighting up at 1x playback. */
const STAGGER_SEC = 0.2;

const ICONS: Record<RepoArtifact["kind"], LucideIcon> = {
  source: FileCode2,
  state: Workflow,
  trace: ScrollText,
};

export function IngestionTree() {
  const passId = useAgentStore((s) => s.hudFlashId);
  const speed = useAgentStore((s) => s.playbackSpeed);
  const reconciled = passId > 0;
  const stagger = STAGGER_SEC / speed;

  return (
    <HudPanel
      id="subq-ingestion-title"
      title="Live Trace & Codebase Ingestion"
      icon={Network}
      aside={
        <Badge tone={reconciled ? "success" : "neutral"} pulse={false}>
          {reconciled ? `Whole repo reconciled · ${SUBQ_PARSE_MS}ms` : "Awaiting snap"}
        </Badge>
      }
    >
      <ul aria-label="Ingested repository artifacts" className="flex flex-col gap-1.5">
        <IngestionTreeNode
          icon={FolderGit2}
          reconciled={reconciled}
          passId={passId}
          delaySec={0}
          queuedLabel="Queued"
          doneLabel="Synced"
        >
          <span className="text-fg">Repository snapshot</span>
        </IngestionTreeNode>

        <li>
          <ul className="ml-6 flex flex-col gap-1.5 pl-5">
            {REPO_ARTIFACTS.map((artifact, index) => (
              <IngestionTreeNode
                key={artifact.id}
                branch
                icon={ICONS[artifact.kind]}
                reconciled={reconciled}
                passId={passId}
                delaySec={(index + 1) * stagger}
                queuedLabel="Queued"
                doneLabel="Ingested"
              >
                <span className="text-fg-subtle">{artifact.dir}</span>
                <span className="inline-block text-fg">{artifact.name}</span>
                {artifact.lines ? (
                  <span className="whitespace-nowrap tabular-nums text-fg-muted"> ({formatInt(artifact.lines)} lines)</span>
                ) : null}
              </IngestionTreeNode>
            ))}
          </ul>
        </li>
      </ul>
    </HudPanel>
  );
}

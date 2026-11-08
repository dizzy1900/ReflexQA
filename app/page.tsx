import { Zap } from "lucide-react";
import { DirectorDock } from "../components/director/DirectorDock";
import { SelfHealingPrModal } from "../components/director/SelfHealingPrModal";
import { TerminalLog } from "../components/director/TerminalLog";
import { TopBar } from "../components/director/TopBar";
import { SubquadraticHud } from "../components/subq-hud/SubquadraticHud";
import { TargetPane } from "../components/target/TargetPane";
import { Badge } from "../components/ui/Badge";
import { PaneHeader } from "../components/ui/PaneHeader";
import { MetaVisionPane } from "./_components/MetaVisionPane";

const PANE = "flex min-h-0 min-w-0 flex-col gap-2 lg:overflow-y-auto";

/**
 * The command center. From lg up it fits the viewport: three panes at 35 / 35 / 30, the execution
 * log underneath, and the Director dock floating over a reserved strip at the bottom.
 * Below lg the panes stack and the page scrolls.
 */
export default function Page() {
  return (
    <main className="flex min-h-dvh flex-col bg-background lg:h-dvh lg:overflow-hidden">
      <TopBar />

      <div className="grid min-h-0 flex-1 gap-3 px-3 pb-2 pt-3 lg:grid-cols-[minmax(0,35fr)_minmax(0,35fr)_minmax(0,30fr)]">
        <TargetPane className={PANE} />

        <MetaVisionPane />

        <section aria-labelledby="pane-subq-title" className={PANE}>
          <PaneHeader
            id="pane-subq-title"
            title="Subquadratic Snap"
            icon={<Zap />}
            aside={<span className="text-[11px] text-fg-subtle">Whole-trace memory at linear cost</span>}
          />
          <SubquadraticHud showHeader={false} className="shrink-0" />
        </section>
      </div>

      <TerminalLog className="mx-3 mb-2 shrink-0" />
      {/* Keeps the floating dock from covering the log. */}
      <span aria-hidden className="h-14 shrink-0 sm:h-[4.5rem]" />

      <DirectorDock />
      <SelfHealingPrModal />
    </main>
  );
}

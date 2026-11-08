import type { EngineEvent } from "../../../lib/engine/events";
import { runCampaign } from "../../../lib/engine/loop";
import { loadRecording, saveRecording, type RecordedEvent } from "../../../lib/engine/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Longest pause kept when replaying a recording, so dead air from slow calls doesn't drag the demo. */
const MAX_REPLAY_GAP_MS = 2500;

/**
 * GET /api/run?generations=4&fresh=1 streams a real campaign as Server-Sent Events.
 * GET /api/run?replay=1 streams the last recorded real campaign (no API spend).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const replay = url.searchParams.get("replay") === "1";
  const generations = Math.min(6, Math.max(1, Number(url.searchParams.get("generations") ?? 4) || 4));
  const fresh = url.searchParams.get("fresh") !== "0";
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: EngineEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      try {
        if (replay) {
          const recording = await loadRecording();
          if (!recording) {
            send({ type: "error", message: "No recorded live run yet. Run a live campaign first." });
          } else {
            let last = recording[0]?.t ?? 0;
            for (const { t, event } of recording) {
              if (request.signal.aborted) break;
              await sleep(Math.min(MAX_REPLAY_GAP_MS, Math.max(0, t - last)));
              last = t;
              send(event);
            }
          }
        } else {
          const started = Date.now();
          const recorded: RecordedEvent[] = [];
          const emit = (event: EngineEvent) => {
            recorded.push({ t: Date.now() - started, event });
            send(event);
          };
          try {
            await runCampaign({ origin: url.origin, generations, fresh, emit, signal: request.signal });
          } catch (err) {
            emit({ type: "error", message: (err as Error).message });
          }
          // Only complete runs become the replay, so a crashed or cancelled run never overwrites a good one.
          if (recorded.some((r) => r.event.type === "campaign_end")) await saveRecording(recorded);
        }
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}

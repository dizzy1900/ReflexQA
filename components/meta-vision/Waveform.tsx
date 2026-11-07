"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../lib/cn";
import { useAgentStore, type AgentStatus } from "../../store/useAgentStore";
import { toneStyles, type VisionTone } from "./visionTheme";

/** How loud the signal is for each agent status. Failure and healing run hottest. */
const LEVEL: Record<AgentStatus, number> = {
  idle: 0.12,
  observing: 0.45,
  analyzing: 0.55,
  action_attempted: 0.6,
  regression_tripped: 0.85,
  subq_healing: 1,
  healed_execution: 0.6,
  success: 0.3,
};

const BARS = 56;
const HEIGHT = 56;

export function Waveform({ tone, className }: { tone: VisionTone; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let time = 0;
    let level = LEVEL.idle;
    let last = performance.now();
    let frame = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const { agentStatus, isPlaying, playbackSpeed } = useAgentStore.getState();
      // Paused runs freeze the signal; the idle board keeps a slow shimmer so it still reads as live.
      const speed = reduceMotion ? 0 : agentStatus === "idle" ? 0.35 : isPlaying ? playbackSpeed : 0;
      time += dt * speed;
      level += (LEVEL[agentStatus] - level) * Math.min(1, dt * 5);

      const color = getComputedStyle(canvas).color;
      const mid = HEIGHT / 2;
      const gap = width / BARS;
      // Higher activity also raises the frequency, so a regression looks jagged rather than just louder.
      const jitter = 1 + level * 1.6;

      ctx.clearRect(0, 0, width, HEIGHT);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      for (let i = 0; i < BARS; i++) {
        const p = i / (BARS - 1);
        const envelope = Math.sin(p * Math.PI);
        const wave =
          Math.sin(i * 0.55 * jitter + time * 5.2) * 0.5 +
          Math.sin(i * 0.23 + time * 3.1) * 0.35 +
          Math.sin(i * 1.3 * jitter - time * 7.4) * 0.15;
        const amplitude = (0.12 + Math.abs(wave) * level * 0.88) * envelope;
        const barHeight = Math.max(2, amplitude * (HEIGHT - 6));
        ctx.globalAlpha = 0.35 + amplitude * 0.65;
        ctx.fillRect(i * gap + gap * 0.25, mid - barHeight / 2, gap * 0.5, barHeight);
      }

      // Thin signal line over the bars: the "audio" channel next to the "visual" bars.
      ctx.globalAlpha = 0.9;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let px = 0; px <= width; px += 3) {
        const p = px / width;
        const y =
          mid + Math.sin(p * 14 * jitter + time * 6) * Math.sin(p * Math.PI) * level * (HEIGHT / 2 - 6) * 0.55;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("block w-full transition-colors duration-300 ease-out", toneStyles[tone].text, className)}
      style={{ height: HEIGHT }}
    />
  );
}

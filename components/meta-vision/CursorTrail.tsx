"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "../../lib/cn";
import { toneStyles, type VisionTone } from "./visionTheme";

interface CursorTrailProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  width: number;
  height: number;
  tone: VisionTone;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

const TRAIL_MS = 420;
const MIN_STEP_PX = 0.4;

/**
 * Luminous comet tail. Redraws per frame, so it lives on a canvas and runs only
 * while the cursor is moving or the tail is still fading.
 */
export function CursorTrail({ x, y, width, height, tone }: CursorTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const points: TrailPoint[] = [];
    let frame = 0;

    const draw = (now: number) => {
      frame = 0;
      const cx = x.get();
      const cy = y.get();
      const last = points[points.length - 1];
      if (!last || Math.hypot(cx - last.x, cy - last.y) > MIN_STEP_PX) points.push({ x: cx, y: cy, t: now });
      while (points.length > 0 && now - points[0].t > TRAIL_MS) points.shift();

      ctx.clearRect(0, 0, width, height);
      // The color is read from CSS so the trail follows the status tone, including mid-transition.
      const color = getComputedStyle(canvas).color;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.globalCompositeOperation = "lighter";

      for (let i = 1; i < points.length; i++) {
        const life = 1 - (now - points[i].t) / TRAIL_MS;
        if (life <= 0) continue;
        ctx.globalAlpha = life * life * 0.8;
        ctx.lineWidth = 1 + life * 3.5;
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }

      // Stop once the tail has faded and nothing is moving; any spring change wakes it again.
      if (points.length > 1) frame = requestAnimationFrame(draw);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const unsubscribeX = x.on("change", wake);
    const unsubscribeY = y.on("change", wake);

    return () => {
      unsubscribeX();
      unsubscribeY();
      cancelAnimationFrame(frame);
    };
  }, [x, y, width, height]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("absolute left-0 top-0 transition-colors duration-300 ease-out", toneStyles[tone].text)}
      style={{ width, height }}
    />
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { TARGET_VIEWPORT, useAgentStore } from "../../store/useAgentStore";

// Canvas fills can't read Tailwind classes, so the palette mirrors the success, accent, info and warning tokens.
const COLORS = ["#ededed", "#a1a1a1", "#6e6e6e", "#3fb27f", "#ffffff"];
const PARTICLE_COUNT = 140;
const GRAVITY = 900;
const ORIGIN = { x: TARGET_VIEWPORT.w / 2, y: TARGET_VIEWPORT.h / 2 - 40 };

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  life: number;
  color: string;
}

function spawnBurst(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const direction = Math.random() * Math.PI * 2;
    const speed = 260 + Math.random() * 520;
    return {
      x: ORIGIN.x,
      y: ORIGIN.y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed - 260,
      size: 4 + Math.random() * 6,
      spin: (Math.random() - 0.5) * 14,
      angle: Math.random() * Math.PI,
      life: 1.4 + Math.random() * 0.9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  });
}

export function SuccessParticles() {
  const burstId = useAgentStore((s) => s.particleBurstId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = TARGET_VIEWPORT.w * dpr;
    canvas.height = TARGET_VIEWPORT.h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, TARGET_VIEWPORT.w, TARGET_VIEWPORT.h);

    if (burstId === 0 || reduceMotion) return;

    let particles = spawnBurst();
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, TARGET_VIEWPORT.w, TARGET_VIEWPORT.h);

      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.vy += GRAVITY * dt;
        p.vx *= 1 - 1.4 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        p.life -= dt;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (particles.length > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [burstId, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50"
      style={{ width: TARGET_VIEWPORT.w, height: TARGET_VIEWPORT.h }}
    />
  );
}

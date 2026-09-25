"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * "Magic wand" burst wherever a visitor clicks or taps (Cristian's ask,
 * 2026-09-25: "como cuando Harry Potter hacía magia con su varita").
 *
 * One full-screen <canvas> overlay, no library: a short-lived burst of
 * glowing sparks (brand ember/tide/chalk + a warm gold), a few
 * four-point twinkles and an expanding ring. `pointer-events: none`, so
 * it never blocks the button being clicked, and the animation loop only
 * runs while particles are alive — zero cost when idle, which matters on
 * the phones most of this site's traffic comes from.
 *
 * Off under `prefers-reduced-motion` (same rule as Reveal and the
 * ticker) and on /admin, where it would just be noise on a work tool.
 */

const COLORS = ["#f2241a", "#1fb8e0", "#f3f1ea", "#ffc857"];
const SPARKS_PER_BURST = 30;
const TWINKLES_PER_BURST = 7;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: "spark" | "twinkle" | "ring" | "flash";
}

export function MagicClick() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const disabled = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const particles: Particle[] = [];
    let frame: number | null = null;
    let lastTime = 0;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pick<T>(items: readonly T[]): T {
      return items[Math.floor(Math.random() * items.length)];
    }

    function burst(x: number, y: number) {
      particles.push({ x, y, vx: 0, vy: 0, life: 0, maxLife: 0.35, size: 38, color: "#ffc857", kind: "flash" });
      particles.push({ x, y, vx: 0, vy: 0, life: 0, maxLife: 0.55, size: 6, color: "#ffc857", kind: "ring" });
      for (let i = 0; i < SPARKS_PER_BURST; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 320;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          life: 0,
          maxLife: 0.5 + Math.random() * 0.5,
          size: 0.8 + Math.random() * 1.6,
          color: pick(COLORS),
          kind: "spark",
        });
      }
      for (let i = 0; i < TWINKLES_PER_BURST; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 60;
        particles.push({
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          vx: 0,
          vy: -20 - Math.random() * 30,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.5,
          size: 5 + Math.random() * 6,
          color: pick(COLORS),
          kind: "twinkle",
        });
      }
      if (frame === null) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    function drawTwinkle(p: Particle, alpha: number) {
      if (!ctx) return;
      const s = p.size * (0.4 + Math.sin((p.life / p.maxLife) * Math.PI) * 0.8);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - s);
      ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y);
      ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
      ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y);
      ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function tick(now: number) {
      if (!ctx) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const t = p.life / p.maxLife;
        const alpha = 1 - t;

        if (p.kind === "flash") {
          // Bright core where the "wand" touched — white-hot to gold, gone in a blink.
          const radius = p.size * (0.4 + t);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
          glow.addColorStop(0.3, `rgba(255,200,87,${alpha * 0.7})`);
          glow.addColorStop(1, "rgba(255,200,87,0)");
          ctx.globalAlpha = 1;
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        if (p.kind === "ring") {
          ctx.globalAlpha = alpha * 0.8;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2 * (1 - t) + 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 + t * 70, 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }

        if (p.kind === "twinkle") {
          p.y += p.vy * dt;
          drawTwinkle(p, alpha);
          continue;
        }

        // Spark: drag + a little gravity, drawn as a short glowing streak.
        p.vx *= 1 - 2.2 * dt;
        p.vy = p.vy * (1 - 2.2 * dt) + 260 * dt;
        const px = p.x;
        const py = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Streak length scales with speed so fast sparks read as trails of light.
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px - (p.x - px) * 2, py - (p.y - py) * 2);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (particles.length > 0) {
        frame = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        frame = null;
      }
    }

    function onPointerDown(event: PointerEvent) {
      burst(event.clientX, event.clientY);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [disabled]);

  if (disabled) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] h-full w-full"
    />
  );
}

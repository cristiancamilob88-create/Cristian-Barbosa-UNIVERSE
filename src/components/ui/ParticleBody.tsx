"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Cristian's body as thousands of points of light that break apart into
 * a 3D cloud as you scroll and reassemble when you scroll back (his ask,
 * 2026-09-25: "como si estuvieran desarmando todo mi cuerpo, algo bien
 * poderoso" — Etapa A, no 3D model needed).
 *
 * How: the background-removed photo (public/brand/cristian-cutout.webp,
 * cut out locally with the open-source rembg/isnet model) is sampled
 * into a grid of colored points once, in the browser. A tiny raw-WebGL
 * program (no three.js — nothing new to download beyond ~5 KB of this
 * file) moves every point from its spot in the photo along its own
 * random 3D direction, with a swirl and perspective, driven by scroll
 * progress through a pinned section. Points near the finger/cursor are
 * pushed aside while he's assembled.
 *
 * Budget: fewer points on small screens, rendering only while the
 * section is on screen, DPR capped at 2. Under prefers-reduced-motion,
 * or without WebGL, the plain cutout photo shows instead — nobody gets
 * an empty box.
 */

const IMAGE_SRC = "/brand/cristian-cutout.webp";

const VERTEX_SHADER = `
attribute vec2 aTarget;
attribute vec3 aColor;
attribute vec4 aRand;
uniform float uProgress;
uniform float uTime;
uniform vec2 uScale;
uniform vec2 uPointer;
uniform float uPointSize;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float delay = aRand.w * 0.45;
  float t = smoothstep(delay, delay + 0.55, uProgress);

  vec3 p = vec3(aTarget, 0.0);
  p.xy += 0.006 * vec2(sin(uTime * 1.7 + aRand.w * 40.0), cos(uTime * 1.3 + aRand.x * 40.0));

  vec2 away = p.xy - uPointer;
  float d2 = dot(away, away);
  p.xy += normalize(away + 1e-5) * 0.12 * exp(-d2 * 45.0) * (1.0 - t);

  p += aRand.xyz * vec3(1.35, 1.25, 1.2) * t;
  float angle = t * 2.4 * (aRand.w - 0.5);
  float c = cos(angle), s = sin(angle);
  p.xz = mat2(c, -s, s, c) * p.xz;
  p.y += t * 0.35 * sin(uTime * 0.8 + aRand.x * 6.0);

  float persp = 1.0 / clamp(1.0 - p.z * 0.45, 0.35, 3.0);
  gl_Position = vec4(p.xy * uScale * persp, 0.0, 1.0);
  gl_PointSize = uPointSize * persp * (1.0 - 0.25 * t);

  vec3 energy = aRand.w > 0.5 ? vec3(0.95, 0.14, 0.10) : vec3(0.12, 0.72, 0.88);
  vColor = mix(min(aColor * 1.25, vec3(1.0)), energy, t * 0.85);
  vAlpha = 1.0 - t * 0.45;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float edge = smoothstep(0.5, 0.2, d);
  gl_FragColor = vec4(vColor, vAlpha * edge);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface PointCloud {
  targets: Float32Array;
  colors: Float32Array;
  rands: Float32Array;
  count: number;
  aspect: number;
  step: number;
  width: number;
}

/** Samples the cutout into a grid of opaque points, sized to hit roughly `maxPoints`. */
function samplePoints(img: HTMLImageElement, maxPoints: number): PointCloud {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, width, height).data;

  let opaque = 0;
  for (let i = 3; i < data.length; i += 16) if (data[i] > 128) opaque++;
  opaque *= 4;
  const step = Math.max(2, Math.ceil(Math.sqrt(opaque / maxPoints)));

  const targets: number[] = [];
  const colors: number[] = [];
  const rands: number[] = [];
  const aspect = width / height;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      targets.push(((x / width) - 0.5) * 1.8 * aspect, (0.5 - y / height) * 1.8);
      colors.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
      // Random unit-ish 3D direction + a 0..1 value used for delay/hue.
      const theta = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const r = Math.sqrt(1 - z * z);
      const len = 0.4 + Math.random() * 0.8;
      rands.push(Math.cos(theta) * r * len, Math.sin(theta) * r * len, z * len, Math.random());
    }
  }
  return {
    targets: new Float32Array(targets),
    colors: new Float32Array(colors),
    rands: new Float32Array(rands),
    count: targets.length / 2,
    aspect,
    step,
    width,
  };
}

export function ParticleBody({ children }: { children?: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    // Deferred, not a synchronous setState in the effect body: the
    // fallback swap happens on the next frame, after this commit.
    const fail = () => requestAnimationFrame(() => setFallback(true));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fail();
      return;
    }
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: true });
    if (!section || !canvas || !gl) {
      fail();
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      fail();
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      fail();
      return;
    }
    gl.useProgram(program);

    const u = {
      progress: gl.getUniformLocation(program, "uProgress"),
      time: gl.getUniformLocation(program, "uTime"),
      scale: gl.getUniformLocation(program, "uScale"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      pointSize: gl.getUniformLocation(program, "uPointSize"),
    };

    let cloud: PointCloud | null = null;
    let visible = false;
    let frame: number | null = null;
    let disposed = false;
    const pointer = { x: 9, y: 9 };
    const start = performance.now();

    function bindAttribute(name: string, values: Float32Array, size: number) {
      if (!gl || !program) return;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    function resize() {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function progress(): number {
      if (!section) return 0;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const raw = travel > 0 ? -rect.top / travel : 0;
      // Hold assembled for the first 12% of the scroll, fully apart by 88%.
      return Math.min(1, Math.max(0, (raw - 0.12) / 0.76));
    }

    function render(now: number) {
      frame = null;
      if (!gl || !canvas || !cloud || disposed) return;
      const p = progress();
      const canvasAspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      // Fit the figure to ~88% of the height, or the width on narrow screens.
      const fitByHeight = 0.88 / 0.9;
      const fitByWidth = (0.92 * canvasAspect) / (0.9 * cloud.aspect);
      const fit = Math.min(fitByHeight, fitByWidth);
      const pixelsPerUnit = (canvas.height / 2) * fit;
      const pointSize = Math.max(1.5, (cloud.step / cloud.width) * 1.8 * cloud.aspect * pixelsPerUnit * 1.7);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.progress, p);
      gl.uniform1f(u.time, (now - start) / 1000);
      gl.uniform2f(u.scale, fit / canvasAspect, fit);
      gl.uniform2f(u.pointer, pointer.x, pointer.y);
      gl.uniform1f(u.pointSize, pointSize);
      gl.drawArrays(gl.POINTS, 0, cloud.count);

      if (overlayRef.current) {
        const reveal = Math.min(1, Math.max(0, (p - 0.45) / 0.35));
        overlayRef.current.style.opacity = String(reveal);
        overlayRef.current.style.transform = `translateY(${(1 - reveal) * 24}px)`;
      }
      if (visible) frame = requestAnimationFrame(render);
    }

    function kick() {
      if (frame === null && visible) frame = requestAnimationFrame(render);
    }

    function onPointerMove(event: PointerEvent) {
      if (!canvas || !cloud) return;
      const rect = canvas.getBoundingClientRect();
      const canvasAspect = rect.width / Math.max(1, rect.height);
      const fit = Math.min(0.88 / 0.9, (0.92 * canvasAspect) / (0.9 * cloud.aspect));
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      pointer.x = (nx * canvasAspect) / fit;
      pointer.y = ny / fit;
    }
    function onPointerLeave() {
      pointer.x = 9;
      pointer.y = 9;
    }

    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      if (disposed || !gl) return;
      const maxPoints = window.innerWidth < 768 ? 9000 : 18000;
      cloud = samplePoints(img, maxPoints);
      bindAttribute("aTarget", cloud.targets, 2);
      bindAttribute("aColor", cloud.colors, 3);
      bindAttribute("aRand", cloud.rands, 4);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      resize();
      kick();
    };
    img.onerror = fail;
    img.src = IMAGE_SRC;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        kick();
      },
      { rootMargin: "100px" },
    );
    observer.observe(section);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (frame !== null) cancelAnimationFrame(frame);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  if (fallback) {
    return (
      <section className="relative flex flex-col items-center gap-8 border-y border-steel-dim/40 py-16">
        <Image src={IMAGE_SRC} alt="Cristian Barbosa" width={374} height={450} className="h-auto w-64" />
        {children}
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[220vh] border-b border-steel-dim/40" aria-label="Cristian Barbosa">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full touch-pan-y" />
        <div
          ref={overlayRef}
          className="pointer-events-none relative px-6 text-center opacity-0"
        >
          {children}
        </div>
      </div>
    </section>
  );
}

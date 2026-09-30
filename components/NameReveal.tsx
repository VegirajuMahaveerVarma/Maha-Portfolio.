"use client";

import { useEffect, useRef, useState } from "react";

const LANGUAGES = [
  "అక్షరం", "महावे", "文字", "文字", "글자", "حرف", "Русский", "Ελληνικά",
  "தமிழ்", "മലയാളം", "ಕನ್ನಡ", "বাংলা", "తెలుగు", "हिन्दी", "日本語", "한국어",
  "العربية", "中文", "English", "Español", "Français", "Deutsch", "Italiano",
];

const NAME = "VEGIRAJU MAHAVEER VARMA";

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function NameReveal() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    const start = performance.now();
    let targetPoints: { x: number; y: number }[] = [];
    let particles: Particle[] = [];
    let resizeTimer: number | undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    class Particle {
      x = 0;
      y = 0;
      tx = 0;
      ty = 0;
      size = 1;
      alpha = 0;
      glyph = "";
      delay = 0;
      drift = Math.random() * Math.PI * 2;

      constructor(i: number) {
        this.reset(i);
      }

      reset(i: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = 7 + Math.random() * 13;
        this.alpha = 0.08 + Math.random() * 0.55;
        const source = LANGUAGES[i % LANGUAGES.length];
        this.glyph = source.charAt(i % Math.max(1, source.length));
        this.delay = Math.random() * 0.5;
      }
    }

    function makeTargets() {
      const off = document.createElement("canvas");
      const offCtx = off.getContext("2d");
      if (!offCtx) return [];

      off.width = Math.max(1, Math.floor(width * dpr));
      off.height = Math.max(1, Math.floor(height * dpr));
      offCtx.scale(dpr, dpr);

      const isSmall = width < 720;
      const maxWidth = Math.min(width * 0.9, isSmall ? 650 : 1180);
      let fontSize = isSmall ? 46 : 92;

      while (fontSize > 30) {
        offCtx.font = `700 ${fontSize}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`;
        if (offCtx.measureText(NAME).width <= maxWidth) break;
        fontSize -= 2;
      }

      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillStyle = "#ffffff";
      offCtx.fillText(NAME, width / 2, height / 2);

      const image = offCtx.getImageData(0, 0, off.width, off.height).data;
      const step = Math.max(3, Math.floor(dpr * (isSmall ? 3.2 : 3.6)));
      const points: { x: number; y: number }[] = [];

      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const alpha = image[(y * off.width + x) * 4 + 3];
          if (alpha > 140) points.push({ x: x / dpr, y: y / dpr });
        }
      }

      return points;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      targetPoints = makeTargets();
      const targetCount = targetPoints.length || 1200;
      const count = Math.max(
        900,
        Math.min(2600, targetCount + Math.floor((width * height) / 11000)),
      );

      particles = Array.from({ length: count }, (_, i) => new Particle(i));
      particles.forEach((p, i) => {
        const target = targetPoints.length
          ? targetPoints[i % targetPoints.length]
          : { x: width / 2, y: height / 2 };
        p.tx = target.x;
        p.ty = target.y;
      });
    }

    function draw(now: number) {
      const elapsed = (now - start) / 1000;
      const t = Math.min(1, elapsed / (prefersReducedMotion ? 0.5 : 7));
      const morphStart = prefersReducedMotion ? 0 : 0.16;
      const morphProgress = Math.max(0, Math.min(1, (t - morphStart) / (1 - morphStart)));
      const eased = easeInOutCubic(morphProgress);

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7,
      );
      gradient.addColorStop(0, "rgba(255,255,255,0.035)");
      gradient.addColorStop(0.45, "rgba(160,190,255,0.012)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const target = targetPoints.length
          ? targetPoints[i % targetPoints.length]
          : { x: width / 2, y: height / 2 };

        p.tx = target.x;
        p.ty = target.y;

        const chaos = 1 - eased;
        const driftX = Math.sin(now * 0.00032 + p.drift) * (10 + 34 * chaos);
        const driftY = Math.cos(now * 0.00025 + p.drift * 1.7) * (8 + 30 * chaos);
        const attraction = 0.012 + eased * 0.24;

        p.x += (p.tx + driftX - p.x) * attraction;
        p.y += (p.ty + driftY - p.y) * attraction;

        if (prefersReducedMotion) {
          p.x = p.tx;
          p.y = p.ty;
        }

        const visibility = Math.min(1, Math.max(0, (t - p.delay * 0.08) * 1.8));
        const finalAlpha = Math.min(0.92, (0.24 + p.alpha * 1.15) * visibility * (0.45 + eased * 0.85));
        const glyph = eased > 0.86 ? "•" : p.glyph;

        ctx.font = `${Math.max(8, p.size * (0.7 + eased * 0.35))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillStyle = `rgba(245, 247, 255, ${finalAlpha})`;
        ctx.fillText(glyph, p.x, p.y);
      }

      if (eased > 0.72) {
        const isSmall = width < 720;
        const maxWidth = Math.min(width * 0.9, isSmall ? 650 : 1180);
        let fontSize = isSmall ? 44 : 88;
        while (fontSize > 30) {
          ctx.font = `700 ${fontSize}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`;
          if (ctx.measureText(NAME).width <= maxWidth) break;
          fontSize -= 2;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const nameAlpha = Math.min(1, (eased - 0.72) / 0.28);
        ctx.shadowBlur = 28 * nameAlpha;
        ctx.shadowColor = `rgba(235, 242, 255, ${0.3 * nameAlpha})`;
        ctx.fillStyle = `rgba(248, 249, 255, ${0.95 * nameAlpha})`;
        ctx.fillText(NAME, width / 2, height / 2);
        ctx.shadowBlur = 0;
      }

      if (!prefersReducedMotion && t < 1) {
        const scanY = (now * 0.035) % (height + 100) - 50;
        const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        scan.addColorStop(0, "rgba(255,255,255,0)");
        scan.addColorStop(0.5, "rgba(255,255,255,0.035)");
        scan.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = scan;
        ctx.fillRect(0, scanY - 30, width, 60);
      }

      if (t >= 0.92) setComplete(true);
      frame = requestAnimationFrame(draw);
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

    resize();
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <main className={`reveal ${complete ? "is-complete" : ""}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="frame-meta" aria-hidden="true">
        <span>01 / 01</span>
        <span>IDENTITY</span>
      </div>

      <section className="identity" aria-label="Introduction">
        <p className="eyebrow">A STORY IN PROGRESS</p>
        <h1>
          <span className="sr-only">Vegiraju Mahaveer Varma</span>
        </h1>
        <p className="name-fallback" aria-hidden="true">VEGIRAJU MAHAVEER VARMA</p>
        <p className="enter-prompt" aria-hidden={!complete}>
          <span>SCROLL TO ENTER</span>
          <i />
        </p>
      </section>

      <div className="signature" aria-hidden="true">VMV / 2026</div>
    </main>
  );
}

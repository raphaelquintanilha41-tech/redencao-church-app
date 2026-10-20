import { useEffect, useRef } from 'react';
import type { PrayerScene } from '../lib/guided-prayer';

// Cenas de fundo pintadas e animadas no próprio telemóvel (canvas):
// pôr do sol no mar, amanhecer nas montanhas, céu dourado e céu estrelado.
// Sem imagens para descarregar e sem direitos de autor.

type Draw = (c: CanvasRenderingContext2D, w: number, h: number, t: number, seed: Seed) => void;

interface Seed {
  stars: { x: number; y: number; r: number; p: number }[];
  clouds: { x: number; y: number; s: number; v: number; a: number }[];
}

function makeSeed(): Seed {
  let s = 1234567;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return {
    stars: Array.from({ length: 180 }, () => ({ x: rnd(), y: rnd() * 0.75, r: 0.4 + rnd() * 1.3, p: rnd() * Math.PI * 2 })),
    clouds: Array.from({ length: 7 }, () => ({ x: rnd(), y: 0.12 + rnd() * 0.35, s: 0.6 + rnd() * 0.9, v: 0.004 + rnd() * 0.006, a: 0.08 + rnd() * 0.12 })),
  };
}

function grad(c: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

function clouds(c: CanvasRenderingContext2D, w: number, h: number, t: number, seed: Seed, rgb: string) {
  for (const cl of seed.clouds) {
    const x = (((cl.x + t * cl.v) % 1.4) - 0.2) * w;
    const y = cl.y * h;
    const rw = w * 0.32 * cl.s;
    c.save();
    c.translate(x, y);
    c.scale(1, 0.28);
    glow(c, 0, 0, rw, `rgba(${rgb},${cl.a})`);
    glow(c, rw * 0.45, rw * 0.1, rw * 0.7, `rgba(${rgb},${cl.a * 0.8})`);
    c.restore();
  }
}

const mar: Draw = (c, w, h, t, seed) => {
  const hz = h * 0.6;
  c.fillStyle = grad(c, 0, hz, [
    [0, '#1b2140'],
    [0.45, '#5b4160'],
    [0.78, '#c97a5e'],
    [1, '#f3c08a'],
  ]);
  c.fillRect(0, 0, w, hz);
  clouds(c, w, h, t, seed, '255,190,170');
  const sx = w * 0.5;
  const sr = Math.min(w, h) * 0.07;
  glow(c, sx, hz, Math.max(w, h) * 0.45, 'rgba(255,190,120,0.45)');
  c.fillStyle = 'rgba(255,226,180,0.95)';
  c.beginPath();
  c.arc(sx, hz - sr * 0.35, sr, Math.PI, 0);
  c.fill();
  // Mar
  c.fillStyle = grad(c, hz, h, [
    [0, '#6b5160'],
    [0.25, '#3a3048'],
    [1, '#0a0d18'],
  ]);
  c.fillRect(0, hz, w, h - hz);
  // Reflexo do sol a cintilar
  for (let i = 0; i < 70; i++) {
    const y = hz + 3 + i * ((h - hz) / 70);
    const spread = sr * (0.8 + i * 0.09);
    const a = (0.55 - i / 140) * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7));
    if (a <= 0) continue;
    const off = Math.sin(t * 0.8 + i) * spread * 0.25;
    c.fillStyle = `rgba(255,214,160,${a})`;
    c.fillRect(sx - spread / 2 + off, y, spread * (0.4 + 0.6 * Math.abs(Math.sin(i * 3.1 + t))), 1.6);
  }
  // Ondas suaves
  c.strokeStyle = 'rgba(255,220,200,0.07)';
  c.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const y = hz + ((i + (t * 0.15) % 1) / 14) * (h - hz);
    c.beginPath();
    for (let x = 0; x <= w; x += 12) c.lineTo(x, y + Math.sin(x * 0.02 + t + i) * 2);
    c.stroke();
  }
};

function ridge(c: CanvasRenderingContext2D, w: number, h: number, base: number, amp: number, k: number, col: string) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w; x += 6) {
    const u = x / w;
    const y =
      base -
      amp * (0.55 * Math.sin(u * 6.2 * k + k) + 0.3 * Math.sin(u * 13.7 * k + 2 * k) + 0.15 * Math.sin(u * 29 * k + 3 * k));
    c.lineTo(x, y * h);
  }
  c.lineTo(w, h);
  c.closePath();
  c.fill();
}

const montanhas: Draw = (c, w, h, t, seed) => {
  c.fillStyle = grad(c, 0, h * 0.7, [
    [0, '#121a36'],
    [0.5, '#4c3d64'],
    [0.85, '#d98d72'],
    [1, '#f6cf95'],
  ]);
  c.fillRect(0, 0, w, h);
  glow(c, w * 0.62, h * 0.56, Math.max(w, h) * 0.5, 'rgba(255,200,140,0.40)');
  c.fillStyle = 'rgba(255,232,190,0.9)';
  c.beginPath();
  c.arc(w * 0.62, h * 0.57, Math.min(w, h) * 0.05, 0, Math.PI * 2);
  c.fill();
  clouds(c, w, h, t, seed, '255,200,190');
  const layers: [number, number, number, string][] = [
    [0.6, 0.06, 1.3, 'rgba(126,94,128,0.85)'],
    [0.67, 0.07, 0.9, 'rgba(84,64,98,0.92)'],
    [0.75, 0.08, 1.7, 'rgba(52,42,72,0.96)'],
    [0.85, 0.07, 1.1, '#1b1a30'],
  ];
  layers.forEach(([b, a, k, col], i) => {
    ridge(c, w, h, b, a, k, col);
    // Névoa a passar entre as camadas
    const my = (b - 0.02) * h;
    const mx = ((t * (0.01 + i * 0.004)) % 1) * w;
    c.save();
    c.translate(mx, my);
    c.scale(1, 0.12);
    glow(c, 0, 0, w * 0.5, 'rgba(255,225,215,0.10)');
    glow(c, -w, 0, w * 0.5, 'rgba(255,225,215,0.10)');
    c.restore();
  });
};

const aurora: Draw = (c, w, h, t, seed) => {
  c.fillStyle = grad(c, 0, h, [
    [0, '#2a2140'],
    [0.35, '#7a5a5e'],
    [0.7, '#d9a46c'],
    [1, '#3d2c22'],
  ]);
  c.fillRect(0, 0, w, h);
  // Raios de luz a rodar devagar a partir do alto
  const cx = w * 0.5;
  const cy = -h * 0.15;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const ang = Math.PI / 2 + (i - 4) * 0.13 + Math.sin(t * 0.07 + i) * 0.04;
    const a = 0.05 + 0.04 * Math.sin(t * 0.5 + i * 1.3);
    const len = h * 1.4;
    const spread = 0.035;
    c.fillStyle = `rgba(255,228,170,${a})`;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(ang - spread) * len, cy + Math.sin(ang - spread) * len);
    c.lineTo(cx + Math.cos(ang + spread) * len, cy + Math.sin(ang + spread) * len);
    c.closePath();
    c.fill();
  }
  c.restore();
  clouds(c, w, h, t, seed, '255,235,210');
  glow(c, cx, h * 0.05, Math.max(w, h) * 0.5, 'rgba(255,236,190,0.35)');
  // Colinas escuras em baixo
  ridge(c, w, h, 0.86, 0.04, 0.8, 'rgba(40,28,24,0.9)');
  ridge(c, w, h, 0.92, 0.03, 1.4, '#140e0c');
};

const estrelas: Draw = (c, w, h, t, seed) => {
  c.fillStyle = grad(c, 0, h, [
    [0, '#03050f'],
    [0.6, '#101a3a'],
    [1, '#22264a'],
  ]);
  c.fillRect(0, 0, w, h);
  // Faixa da Via Láctea
  c.save();
  c.translate(w * 0.5, h * 0.35);
  c.rotate(-0.5);
  c.scale(1, 0.18);
  glow(c, 0, 0, Math.max(w, h) * 0.7, 'rgba(160,170,230,0.18)');
  c.restore();
  for (const s of seed.stars) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 + s.p));
    c.fillStyle = `rgba(255,248,230,${a})`;
    c.beginPath();
    c.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    c.fill();
  }
  // Estrela cadente de vez em quando
  const cyc = t % 14;
  if (cyc < 1.2) {
    const p = cyc / 1.2;
    const x0 = w * 0.2 + p * w * 0.35;
    const y0 = h * 0.12 + p * h * 0.12;
    const g = c.createLinearGradient(x0, y0, x0 - 60, y0 - 20);
    g.addColorStop(0, `rgba(255,255,255,${0.8 * (1 - p)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = g;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0 - 60, y0 - 20);
    c.stroke();
  }
  glow(c, w * 0.5, h * 0.95, w * 0.8, 'rgba(214,180,115,0.18)');
  ridge(c, w, h, 0.88, 0.05, 1.2, '#070912');
};

const DRAW: Record<PrayerScene, Draw> = { mar, montanhas, aurora, estrelas };

export function PrayerBackground({ scene, still = false }: { scene: PrayerScene; still?: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;
    const seed = makeSeed();
    const draw = DRAW[scene];
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // ~30 fps chega e poupa bateria
      last = now;
      const r = canvas.getBoundingClientRect();
      draw(c, r.width, r.height, (now - start) / 1000, seed);
    };
    if (still || reduce) {
      const r = canvas.getBoundingClientRect();
      draw(c, r.width, r.height, 3, seed);
    } else {
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [scene, still]);

  return <canvas ref={ref} className="oracao-bg" aria-hidden="true" />;
}

import { useEffect, useRef } from 'react';
import type { PrayerScene } from '../lib/guided-prayer';

// Cenas de fundo pintadas e animadas no próprio telemóvel (canvas):
// mar, lago, campo, deserto, floresta, montanhas, nuvens, luar, estrelas e raios de luz.
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

// Silhueta de pinheiros (triângulos sobrepostos) numa faixa do ecrã.
function pines(c: CanvasRenderingContext2D, w: number, h: number, base: number, size: number, k: number, col: string) {
  c.fillStyle = col;
  c.fillRect(0, base * h, w, h - base * h);
  const step = size * w * 0.45;
  for (let x = -step, i = 0; x < w + step; x += step, i++) {
    const jitter = Math.sin(i * 12.9898 * k) * 0.5 + 0.5;
    const th = size * h * (0.7 + jitter * 0.6);
    const tw = th * 0.32;
    const bx = x + Math.sin(i * 7.1 * k) * step * 0.3;
    const by = base * h + 2;
    c.beginPath();
    for (let lvl = 0; lvl < 4; lvl++) {
      const ty = by - th * (0.25 + lvl * 0.25);
      const ww = tw * (1 - lvl * 0.2);
      c.moveTo(bx, ty - th * 0.3);
      c.lineTo(bx - ww, ty + th * 0.12);
      c.lineTo(bx + ww, ty + th * 0.12);
      c.closePath();
    }
    c.fill();
    c.fillRect(bx - tw * 0.08, by - th * 0.2, tw * 0.16, th * 0.2);
  }
}

function mistBand(c: CanvasRenderingContext2D, w: number, y: number, t: number, speed: number, a: number, rgb = '255,240,230') {
  const mx = ((t * speed) % 1) * w;
  c.save();
  c.translate(mx, y);
  c.scale(1, 0.1);
  glow(c, 0, 0, w * 0.6, `rgba(${rgb},${a})`);
  glow(c, -w, 0, w * 0.6, `rgba(${rgb},${a})`);
  c.restore();
}

const lago: Draw = (c, w, h, t, seed) => {
  const hz = h * 0.58;
  c.fillStyle = grad(c, 0, hz, [
    [0, '#1d2c4c'],
    [0.5, '#5d7397'],
    [0.82, '#e3b59a'],
    [1, '#f7dcb4'],
  ]);
  c.fillRect(0, 0, w, hz);
  clouds(c, w, h, t, seed, '255,225,215');
  const sx = w * 0.32;
  glow(c, sx, hz, Math.max(w, h) * 0.4, 'rgba(255,214,170,0.40)');
  c.fillStyle = 'rgba(255,238,205,0.95)';
  c.beginPath();
  c.arc(sx, hz - Math.min(w, h) * 0.02, Math.min(w, h) * 0.045, 0, Math.PI * 2);
  c.fill();
  // Colinas do outro lado do lago
  ridge(c, w, h, 0.57, 0.035, 0.7, 'rgba(58,72,98,0.95)');
  ridge(c, w, h, 0.585, 0.02, 1.6, '#2a3550');
  // Água: o céu espelhado, mais escuro em baixo
  c.fillStyle = grad(c, hz, h, [
    [0, '#c9a690'],
    [0.2, '#58698a'],
    [1, '#0d1424'],
  ]);
  c.fillRect(0, hz, w, h - hz);
  // Reflexo do sol
  for (let i = 0; i < 40; i++) {
    const y = hz + 4 + i * ((h - hz) / 40);
    const a = (0.4 - i / 100) * (0.5 + 0.5 * Math.sin(t * 1.6 + i * 2.1));
    if (a <= 0) continue;
    const spread = Math.min(w, h) * (0.05 + i * 0.004);
    c.fillStyle = `rgba(255,232,200,${a})`;
    c.fillRect(sx - spread / 2 + Math.sin(t * 0.6 + i) * spread * 0.2, y, spread, 1.2);
  }
  // Névoa sobre a água
  mistBand(c, w, hz + h * 0.02, t, 0.012, 0.22);
  mistBand(c, w, hz + h * 0.09, t, 0.008, 0.12);
};

const campo: Draw = (c, w, h, t, seed) => {
  const hz = h * 0.6;
  c.fillStyle = grad(c, 0, hz, [
    [0, '#2b3b6b'],
    [0.45, '#8a7a8e'],
    [0.8, '#f0b878'],
    [1, '#ffe2a8'],
  ]);
  c.fillRect(0, 0, w, hz);
  clouds(c, w, h, t, seed, '255,215,180');
  const sx = w * 0.68;
  glow(c, sx, hz - h * 0.03, Math.max(w, h) * 0.55, 'rgba(255,205,130,0.50)');
  c.fillStyle = 'rgba(255,240,200,0.97)';
  c.beginPath();
  c.arc(sx, hz - h * 0.03, Math.min(w, h) * 0.06, 0, Math.PI * 2);
  c.fill();
  ridge(c, w, h, 0.6, 0.015, 0.6, 'rgba(120,90,70,0.6)');
  // Campo dourado
  c.fillStyle = grad(c, hz, h, [
    [0, '#c99a52'],
    [0.4, '#8a5f2c'],
    [1, '#2a1a0e'],
  ]);
  c.fillRect(0, hz, w, h - hz);
  // Espigas a ondular com o vento, mais altas à frente
  c.lineCap = 'round';
  const rows = 9;
  for (let r = 0; r < rows; r++) {
    const depth = r / (rows - 1);
    const y = hz + (h - hz) * (0.05 + depth * 0.97);
    const len = 6 + depth * h * 0.07;
    const gap = 5 + depth * 9;
    c.strokeStyle = `rgba(${Math.round(255 - depth * 120)},${Math.round(205 - depth * 110)},${Math.round(120 - depth * 70)},${0.35 + depth * 0.5})`;
    c.lineWidth = 0.8 + depth * 1.6;
    c.beginPath();
    for (let x = -gap + (r % 2) * gap * 0.5; x < w + gap; x += gap) {
      const sway = Math.sin(t * 1.3 + x * 0.012 - r * 0.6) * len * 0.35;
      c.moveTo(x, y);
      c.quadraticCurveTo(x + sway * 0.4, y - len * 0.6, x + sway, y - len);
    }
    c.stroke();
  }
};

const deserto: Draw = (c, w, h, t, seed) => {
  c.fillStyle = grad(c, 0, h * 0.65, [
    [0, '#1a1638'],
    [0.45, '#5a3a62'],
    [0.8, '#d77c58'],
    [1, '#f3b77c'],
  ]);
  c.fillRect(0, 0, w, h);
  // Primeiras estrelas no alto
  for (const s of seed.stars.slice(0, 60)) {
    if (s.y > 0.3) continue;
    const a = 0.2 + 0.5 * Math.abs(Math.sin(t * 0.7 + s.p));
    c.fillStyle = `rgba(255,245,230,${a})`;
    c.fillRect(s.x * w, s.y * h, s.r, s.r);
  }
  const sx = w * 0.42;
  const sy = h * 0.62;
  glow(c, sx, sy, Math.max(w, h) * 0.5, 'rgba(255,170,110,0.45)');
  c.fillStyle = 'rgba(255,215,160,0.95)';
  c.beginPath();
  c.arc(sx, sy, Math.min(w, h) * 0.07, Math.PI, 0);
  c.fill();
  // Dunas: curvas suaves com lado iluminado e lado em sombra
  const dune = (base: number, amp: number, k: number, ph: number, lit: string, dark: string) => {
    const g = c.createLinearGradient(0, base * h - amp * h, w, base * h);
    g.addColorStop(0, lit);
    g.addColorStop(1, dark);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) {
      const u = x / w;
      const y = base - amp * (0.6 * Math.sin(u * Math.PI * k + ph) + 0.4 * Math.sin(u * Math.PI * k * 2.3 + ph * 2));
      c.lineTo(x, y * h);
    }
    c.lineTo(w, h);
    c.closePath();
    c.fill();
  };
  dune(0.66, 0.03, 1.4, 0.5, '#b0624a', '#5a2e33');
  dune(0.74, 0.045, 1.1, 2.1, '#8c4a3c', '#3a1e26');
  dune(0.86, 0.05, 0.9, 4.0, '#5e3029', '#1c0f14');
  // Areia levada pelo vento
  mistBand(c, w, h * 0.7, t, 0.02, 0.10, '255,200,160');
};

const floresta: Draw = (c, w, h, t) => {
  c.fillStyle = grad(c, 0, h, [
    [0, '#16323a'],
    [0.45, '#3f6a64'],
    [0.75, '#a9b58e'],
    [1, '#1a2a24'],
  ]);
  c.fillRect(0, 0, w, h);
  glow(c, w * 0.75, h * 0.05, Math.max(w, h) * 0.6, 'rgba(255,240,190,0.35)');
  pines(c, w, h, 0.62, 0.16, 1.3, 'rgba(70,104,96,0.75)');
  mistBand(c, w, h * 0.6, t, 0.01, 0.22, '230,245,230');
  pines(c, w, h, 0.72, 0.22, 2.1, 'rgba(38,64,58,0.9)');
  mistBand(c, w, h * 0.7, t, 0.014, 0.16, '230,245,230');
  // Raios de luz entre as árvores
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const a = 0.04 + 0.03 * Math.sin(t * 0.4 + i * 1.9);
    const x0 = w * (0.55 + i * 0.09);
    c.fillStyle = `rgba(255,245,200,${a})`;
    c.beginPath();
    c.moveTo(x0, -10);
    c.lineTo(x0 + w * 0.05, -10);
    c.lineTo(x0 - w * 0.35, h);
    c.lineTo(x0 - w * 0.45, h);
    c.closePath();
    c.fill();
  }
  c.restore();
  pines(c, w, h, 0.86, 0.3, 3.3, '#0e1a17');
  // Partículas de luz a flutuar
  for (let i = 0; i < 26; i++) {
    const x = ((i * 0.137 + t * 0.01 * (1 + (i % 3))) % 1) * w;
    const y = (0.2 + ((i * 0.293) % 0.6)) * h + Math.sin(t * 0.8 + i) * 8;
    const a = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.9 + i * 2.3));
    c.fillStyle = `rgba(255,250,215,${a})`;
    c.beginPath();
    c.arc(x, y, 1.2, 0, Math.PI * 2);
    c.fill();
  }
};

const nuvens: Draw = (c, w, h, t) => {
  c.fillStyle = grad(c, 0, h * 0.7, [
    [0, '#0f1c44'],
    [0.5, '#3b5b9a'],
    [0.85, '#e6b98a'],
    [1, '#fff0cf'],
  ]);
  c.fillRect(0, 0, w, h);
  const sx = w * 0.5;
  const sy = h * 0.53;
  glow(c, sx, sy, Math.max(w, h) * 0.6, 'rgba(255,220,160,0.45)');
  c.fillStyle = 'rgba(255,246,220,0.97)';
  c.beginPath();
  c.arc(sx, sy, Math.min(w, h) * 0.055, 0, Math.PI * 2);
  c.fill();
  // Mar de nuvens: três camadas de novelos, iluminadas por cima, a passar devagar
  const layers: [number, number, number, string, string][] = [
    [0.66, 0.006, 0.07, '#fde6c8', '#d7b9b4'],
    [0.76, 0.009, 0.09, '#f1d9cf', '#a99ab8'],
    [0.88, 0.013, 0.11, '#d9cbe0', '#6f6a96'],
  ];
  layers.forEach(([base, v, size, top, bottom], li) => {
    const r = w * size + h * 0.02;
    const y0 = base * h;
    const g = c.createLinearGradient(0, y0 - r, 0, y0 + h * 0.18);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.beginPath();
    const off = ((t * v) % 1) * w;
    for (let x = -2 * r + (off % (r * 1.3)); x < w + 2 * r; x += r * 1.3) {
      const k = Math.sin((x - off) * 0.013 + li * 2);
      c.moveTo(x + r, y0);
      c.arc(x, y0 - k * r * 0.25, r * (0.85 + 0.25 * k), 0, Math.PI * 2);
    }
    c.rect(0, y0, w, h - y0);
    c.fill();
    // Brilho do sol no topo das nuvens mais próximas do horizonte
    if (li === 0) glow(c, sx, y0 - r * 0.5, w * 0.5, 'rgba(255,236,200,0.35)');
  });
};

const luar: Draw = (c, w, h, t, seed) => {
  const hz = h * 0.62;
  c.fillStyle = grad(c, 0, hz, [
    [0, '#040814'],
    [0.6, '#0f1d3d'],
    [1, '#2a3a63'],
  ]);
  c.fillRect(0, 0, w, hz);
  for (const s of seed.stars) {
    if (s.y * h > hz - 10) continue;
    const a = 0.25 + 0.6 * Math.abs(Math.sin(t * 0.6 + s.p));
    c.fillStyle = `rgba(235,240,255,${a})`;
    c.beginPath();
    c.arc(s.x * w, s.y * h, s.r * 0.9, 0, Math.PI * 2);
    c.fill();
  }
  const mx = w * 0.7;
  const my = h * 0.22;
  const mr = Math.min(w, h) * 0.065;
  glow(c, mx, my, mr * 7, 'rgba(200,215,255,0.22)');
  c.fillStyle = '#f4f1e6';
  c.beginPath();
  c.arc(mx, my, mr, 0, Math.PI * 2);
  c.fill();
  // Sombras suaves na superfície da lua
  c.fillStyle = 'rgba(190,190,180,0.35)';
  for (const [dx, dy, r] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.35, 0.12]] as const) {
    c.beginPath();
    c.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
    c.fill();
  }
  clouds(c, w, h, t, seed, '150,170,220');
  // Mar escuro com o caminho prateado da lua
  c.fillStyle = grad(c, hz, h, [
    [0, '#1d2a4a'],
    [1, '#03060e'],
  ]);
  c.fillRect(0, hz, w, h - hz);
  for (let i = 0; i < 60; i++) {
    const y = hz + 3 + i * ((h - hz) / 60);
    const spread = mr * (0.6 + i * 0.08);
    const a = (0.5 - i / 130) * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.9));
    if (a <= 0) continue;
    const off = Math.sin(t * 0.7 + i) * spread * 0.25;
    c.fillStyle = `rgba(225,232,255,${a})`;
    c.fillRect(mx - spread / 2 + off, y, spread * (0.4 + 0.6 * Math.abs(Math.sin(i * 3.1 + t))), 1.4);
  }
};

const DRAW: Record<PrayerScene, Draw> = { mar, montanhas, aurora, estrelas, lago, campo, deserto, floresta, nuvens, luar };

/** Pinta um fotograma parado da cena (usado na imagem de partilha). */
// eslint-disable-next-line react-refresh/only-export-components
export function paintPrayerScene(c: CanvasRenderingContext2D, w: number, h: number, scene: PrayerScene, t = 3) {
  (DRAW[scene] ?? mar)(c, w, h, t, makeSeed());
}

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

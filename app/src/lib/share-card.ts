// ── Partilha bonita de passagens bíblicas ─────────────────────────────
// Gera imagens 1080×1350 (formato 4:5, ideal para WhatsApp/Instagram) com a
// identidade da Redenção Church: fundo azul-noite, dourado, logo e rodapé.
// Capítulos longos são divididos em várias imagens numeradas (1/3, 2/3…).

export interface ShareVerse {
  verse: number;
  text: string;
}

export interface ScripturePassage {
  bookName: string;
  chapter: number;
  verses: ShareVerse[];
  translation?: string;
  /** Link que abre a passagem na app (com os versículos marcados). */
  url?: string;
}

const W = 1080;
const H = 1350;
const PAD = 84;
const NAVY_TOP = '#0E1A31';
const NAVY_BOTTOM = '#070D19';
const GOLD = '#D6B473';
const GOLD_LIGHT = '#F1DDAE';
const TEXT = '#EDE7DB';
const MUTED = '#8E9AB2';
const FONT = 'Arimo, Arial, Helvetica, sans-serif';
const LOGO_URL = '/redencao-logo.jpeg';

export function passageReference(p: ScripturePassage): string {
  const nums = p.verses.map((v) => v.verse);
  if (nums.length === 1) return `${p.bookName} ${p.chapter}:${nums[0]}`;
  const contiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  if (contiguous && nums.length > 0) {
    // Capítulo inteiro → "Salmos 40"; trecho → "Salmos 40:1-5"
    return nums[0] === 1 && p.verses.length > 3 ? `${p.bookName} ${p.chapter}` : `${p.bookName} ${p.chapter}:${nums[0]}-${nums[nums.length - 1]}`;
  }
  return `${p.bookName} ${p.chapter}:${nums.join(',')}`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ensureFonts(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`400 36px ${FONT}`),
      document.fonts.load(`700 64px ${FONT}`),
    ]);
  } catch {
    /* sem a fonte da app usa Arial — continua legível */
  }
}

type Line = { num: number | null; text: string };

/** Quebra os versículos em linhas que cabem na largura disponível. */
function layoutLines(ctx: CanvasRenderingContext2D, verses: ShareVerse[], width: number, numWidth: number): Line[] {
  const lines: Line[] = [];
  for (const v of verses) {
    const words = v.text.trim().replace(/\s+/g, ' ').split(' ');
    let current = '';
    let first = true;
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > width - numWidth && current) {
        lines.push({ num: first ? v.verse : null, text: current });
        first = false;
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push({ num: first ? v.verse : null, text: current });
    lines.push({ num: null, text: '' }); // espaço entre versículos
  }
  if (lines.length && lines[lines.length - 1].text === '') lines.pop();
  return lines;
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, NAVY_TOP);
  g.addColorStop(1, NAVY_BOTTOM);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // brilho dourado suave no topo
  const glow = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, 700);
  glow.addColorStop(0, 'rgba(214,180,115,0.18)');
  glow.addColorStop(1, 'rgba(214,180,115,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // moldura dourada fina
  ctx.strokeStyle = 'rgba(214,180,115,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);
}

function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, cx: number, cy: number, r: number) {
  ctx.save();
  // aro dourado
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, '#FFF1C9');
  ring.addColorStop(0.5, '#C99A48');
  ring.addColorStop(1, '#7A5A22');
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (logo) ctx.drawImage(logo, cx - r, cy - r, r * 2, r * 2);
  else {
    ctx.fillStyle = NAVY_TOP;
    ctx.fill();
  }
  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, title: string, subtitle: string): number {
  drawLogo(ctx, logo, W / 2, 132, 58);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = GOLD;
  ctx.font = `700 24px ${FONT}`;
  ctx.letterSpacing = '6px';
  ctx.fillText('REDENÇÃO CHURCH', W / 2, 238);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = `700 60px ${FONT}`;
  ctx.fillText(title, W / 2, 318);

  ctx.fillStyle = MUTED;
  ctx.font = `400 26px ${FONT}`;
  ctx.fillText(subtitle, W / 2, 360);

  // divisor dourado com losango
  const y = 392;
  ctx.strokeStyle = 'rgba(214,180,115,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 160, y);
  ctx.lineTo(W / 2 - 14, y);
  ctx.moveTo(W / 2 + 14, y);
  ctx.lineTo(W / 2 + 160, y);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W / 2, y - 7);
  ctx.lineTo(W / 2 + 7, y);
  ctx.lineTo(W / 2, y + 7);
  ctx.lineTo(W / 2 - 7, y);
  ctx.closePath();
  ctx.fill();
  return y + 52;
}

function drawFooter(ctx: CanvasRenderingContext2D, page: number, total: number) {
  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = `400 24px ${FONT}`;
  ctx.fillText('Partilhado pela app Redenção Church · Carnaxide, Oeiras', W / 2, H - 82);
  if (total > 1) {
    ctx.fillStyle = GOLD;
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText(`${page}/${total}`, W / 2, H - 120);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), 'image/jpeg', 0.92),
  );
}

/** Desenha a passagem em uma ou mais imagens com a marca da igreja. */
export async function renderPassageCards(p: ScripturePassage): Promise<Blob[]> {
  await ensureFonts();
  const logo = await loadImage(LOGO_URL);
  const title = passageReference(p);
  const subtitle = p.translation ?? 'Bíblia Livre';
  const single = p.verses.length === 1;

  const measure = document.createElement('canvas').getContext('2d')!;
  // Um só versículo: letra grande e centrada. Capítulo: letra de leitura.
  const fontSize = single ? (p.verses[0].text.length > 260 ? 44 : 54) : 32;
  const lineH = Math.round(fontSize * (single ? 1.45 : 1.45));
  measure.font = `400 ${fontSize}px ${FONT}`;
  const textWidth = W - PAD * 2;
  const numWidth = single ? 0 : 58;

  const lines = single
    ? layoutLines(measure, [{ verse: 0, text: `“${p.verses[0].text.trim()}”` }], textWidth, 0).map((l) => ({ ...l, num: null }))
    : layoutLines(measure, p.verses, textWidth, numWidth);

  const top = 444;
  const bottom = H - 150;
  const avail = bottom - top;
  const gapH = Math.round(lineH * 0.45); // espaço entre versículos
  const heightOf = (l: Line) => (l.text === '' ? gapH : lineH);

  // Agrupa as linhas por versículo e enche cada página sem partir versículos
  // (só parte um versículo se ele sozinho não couber numa página).
  const blocks: Line[][] = [];
  for (const l of lines) {
    if (l.text === '') continue;
    if (l.num !== null || blocks.length === 0) blocks.push([l]);
    else blocks[blocks.length - 1].push(l);
  }
  const pages: Line[][] = [];
  let page: Line[] = [];
  let used = 0;
  const pushLine = (l: Line) => {
    page.push(l);
    used += heightOf(l);
  };
  for (const block of blocks) {
    const blockH = block.length * lineH + (page.length ? gapH : 0);
    if (page.length && used + blockH > avail) {
      pages.push(page);
      page = [];
      used = 0;
    }
    if (page.length) pushLine({ num: null, text: '' });
    for (const l of block) {
      if (used + lineH > avail && page.length) {
        pages.push(page);
        page = [];
        used = 0;
      }
      pushLine(l);
    }
  }
  if (page.length) pages.push(page);

  const blobs: Blob[] = [];
  for (let pi = 0; pi < pages.length; pi++) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    drawBackground(ctx);
    drawHeader(ctx, logo, title, subtitle);

    const pageLines = pages[pi];
    // centra verticalmente o bloco de texto na área disponível
    const blockH = pageLines.reduce((acc, l) => acc + heightOf(l), 0);
    let y = top + Math.max(0, Math.floor((avail - blockH) / 2)) + fontSize;

    for (const line of pageLines) {
      if (single) {
        ctx.textAlign = 'center';
        ctx.fillStyle = TEXT;
        ctx.font = `400 ${fontSize}px ${FONT}`;
        ctx.fillText(line.text, W / 2, y);
      } else {
        ctx.textAlign = 'left';
        if (line.num !== null) {
          ctx.fillStyle = GOLD;
          ctx.font = `700 ${Math.round(fontSize * 0.72)}px ${FONT}`;
          ctx.fillText(String(line.num), PAD, y - Math.round(fontSize * 0.28));
        }
        ctx.fillStyle = TEXT;
        ctx.font = `400 ${fontSize}px ${FONT}`;
        ctx.fillText(line.text, PAD + numWidth, y);
      }
      y += heightOf(line);
    }

    drawFooter(ctx, pi + 1, pages.length);
    blobs.push(await canvasToBlob(canvas));
  }
  return blobs;
}

/** Texto formatado para WhatsApp (negrito com *…*), usado como alternativa. */
export function passageToText(p: ScripturePassage): string {
  const title = passageReference(p);
  const body =
    p.verses.length === 1
      ? `“${p.verses[0].text.trim()}”`
      : p.verses.map((v) => `*${v.verse}* ${v.text.trim()}`).join('\n');
  return `📖 *${title}* (${p.translation ?? 'Bíblia Livre'})\n\n${body}\n\n— Redenção Church\nLer na app: ${p.url ?? window.location.origin}`;
}

/** Partilha só o texto formatado (com o link para a passagem). */
export async function sharePassageText(p: ScripturePassage): Promise<ShareOutcome> {
  const text = passageToText(p);
  try {
    if (navigator.share) {
      await navigator.share({ text, title: passageReference(p) });
      return 'shared';
    }
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** "1,2,3,7" → "1-3,7" (compacto para o link). */
export function versesParam(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j > i ? `${sorted[i]}-${sorted[j]}` : String(sorted[i]));
    i = j;
  }
  return parts.join(',');
}

/** "1-3,7" → Set{1,2,3,7} (ignora valores inválidos). */
export function parseVersesParam(param: string | null): Set<number> {
  const out = new Set<number>();
  if (!param) return out;
  for (const part of param.split(',')) {
    const m = part.trim().match(/^(\d{1,3})(?:-(\d{1,3}))?$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let n = Math.min(a, b); n <= Math.max(a, b) && n - a < 200; n++) out.add(n);
  }
  return out;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'retry' | 'failed';

/** Gera os ficheiros de imagem prontos a partilhar (pode ser feito antes do toque). */
export async function buildPassageFiles(p: ScripturePassage): Promise<File[]> {
  const title = passageReference(p);
  const blobs = await renderPassageCards(p);
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .toLowerCase();
  return blobs.map((b, i) => new File([b], `${slug}${blobs.length > 1 ? `-${i + 1}` : ''}.jpg`, { type: 'image/jpeg' }));
}

/**
 * Partilha a passagem como imagem(ns) com a marca da igreja. Se o aparelho
 * não suportar partilha de imagens, partilha (ou copia) o texto formatado.
 * `prebuilt` deve vir já gerado: alguns telemóveis (iPhone) só aceitam a
 * partilha se ela começar logo após o toque, sem esperar pelo desenho.
 * `justBuilt` = as imagens acabaram de ser desenhadas neste toque; se o
 * aparelho recusar por demora, devolve 'retry' (o 2.º toque já é imediato).
 */
export async function sharePassage(p: ScripturePassage, prebuilt?: File[] | null, justBuilt = false): Promise<ShareOutcome> {
  const title = passageReference(p);
  const caption = `📖 ${title} — Redenção Church\nLer na app: ${p.url ?? window.location.origin}`;
  try {
    const files = prebuilt ?? (await buildPassageFiles(p));
    if (navigator.canShare?.({ files })) {
      await navigator.share({ files, text: caption, title });
      return 'shared';
    }
  } catch (err) {
    const name = (err as DOMException)?.name;
    if (name === 'AbortError') return 'cancelled';
    // A partilha demorou demasiado depois do toque — as imagens já ficaram prontas.
    if (name === 'NotAllowedError' && (justBuilt || !prebuilt)) return 'retry';
    console.warn('[share-card] partilha de imagem falhou, a usar texto:', err);
  }

  const text = passageToText(p);
  try {
    if (navigator.share) {
      await navigator.share({ text, title });
      return 'shared';
    }
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

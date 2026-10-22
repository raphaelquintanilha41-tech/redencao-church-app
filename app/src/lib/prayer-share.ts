// ── Partilha da Oração guiada ──────────────────────────────────────────
// Gera uma imagem 1080×1350 (formato Status/Instagram) com a cena do dia,
// o logo da Redenção Church, o versículo da oração e o link para a app.
// A partilha usa a folha do sistema (WhatsApp, Instagram, Facebook, Telegram,
// Messenger, e-mail…); onde não existir, mostra ligações diretas por rede.
import type { GuidedPrayer, PrayerScene } from './guided-prayer';

const W = 1080;
const H = 1350;
const GOLD = '#D6B473';
const GOLD_LIGHT = '#F1DDAE';
const TEXT = '#FFF8EC';
const MUTED = '#C9C2B4';
const FONT = 'Arimo, Arial, Helvetica, sans-serif';
const LOGO_URL = '/redencao-logo.jpeg';

/** Fotos do Unsplash (licença livre) que correspondem às cenas animadas da app. */
const SCENE_PHOTO: Record<PrayerScene, string> = {
  mar: '1507525428034-b723cf961d3e',
  montanhas: '1490682143684-14369e18dce8',
  estrelas: '1528353518104-dbd48bee7bc4',
  aurora: '1519414442781-fbd745c5b497',
};

export const PRAYER_SHARE_URL = `${window.location.origin}/oracao-guiada`;
export const PRAYER_SHARE_TITLE = 'Oração guiada — Redenção Church';

export function prayerShareText(p: GuidedPrayer): string {
  const verse = p.steps.find((s) => s.verse)?.verse;
  const quote = verse ? `\n\n“${verse.text.trim()}”\n— ${verse.ref}` : '';
  return `🙏 *Oração guiada* · Redenção Church\nUm momento de 4–6 minutos para conversar com Deus, com música e um versículo para hoje.${quote}\n\nOre comigo na app: ${PRAYER_SHARE_URL}`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.trim().replace(/\s+/g, ' ').split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, cx: number, cy: number, r: number) {
  ctx.save();
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
    ctx.fillStyle = '#0E1A31';
    ctx.fill();
  }
  ctx.restore();
}

/** Desenha o cartão da oração guiada de hoje. */
export async function renderPrayerCard(p: GuidedPrayer): Promise<Blob> {
  try {
    await Promise.all([document.fonts.load(`400 40px ${FONT}`), document.fonts.load(`700 64px ${FONT}`)]);
  } catch {
    /* sem a fonte da app usa Arial */
  }
  const [logo, photo] = await Promise.all([
    loadImage(LOGO_URL),
    loadImage(`https://images.unsplash.com/photo-${SCENE_PHOTO[p.scene]}?w=1080&q=70&auto=format&fit=crop`),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Fundo: foto da cena com véu azul-noite (ou gradiente se a foto falhar).
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#0E1A31');
  base.addColorStop(1, '#070D19');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  if (photo) {
    const s = Math.max(W / photo.naturalWidth, H / photo.naturalHeight);
    const dw = photo.naturalWidth * s;
    const dh = photo.naturalHeight * s;
    ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const veil = ctx.createLinearGradient(0, 0, 0, H);
    veil.addColorStop(0, 'rgba(8,14,28,0.45)');
    veil.addColorStop(0.5, 'rgba(8,14,28,0.55)');
    veil.addColorStop(1, 'rgba(8,14,28,0.88)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.strokeStyle = 'rgba(214,180,115,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  drawLogo(ctx, logo, W / 2, 150, 64);
  ctx.fillStyle = GOLD;
  ctx.font = `700 24px ${FONT}`;
  ctx.letterSpacing = '6px';
  ctx.fillText('REDENÇÃO CHURCH', W / 2, 262);
  ctx.fillText('ORAÇÃO GUIADA', W / 2, 330);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = TEXT;
  ctx.font = `700 66px ${FONT}`;
  ctx.fillText('Iniciar uma conversa', W / 2, 430);
  ctx.fillText('com Deus', W / 2, 508);

  ctx.fillStyle = MUTED;
  ctx.font = `400 30px ${FONT}`;
  ctx.fillText('4–6 minutos · com música e um versículo para hoje', W / 2, 568);

  // Versículo do dia
  const verse = p.steps.find((s) => s.verse)?.verse;
  if (verse) {
    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = `400 40px ${FONT}`;
    const lines = wrap(ctx, `“${verse.text.trim()}”`, W - 200);
    const lineH = 56;
    const blockH = lines.length * lineH + 50;
    let y = 700 + Math.max(0, (420 - blockH) / 2) + 40;
    for (const l of lines) {
      ctx.fillText(l, W / 2, y);
      y += lineH;
    }
    ctx.fillStyle = GOLD;
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(verse.ref, W / 2, y + 10);
  }

  // Rodapé com o convite e o link
  ctx.fillStyle = TEXT;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText('Ore comigo na app Redenção Church', W / 2, H - 150);
  ctx.fillStyle = MUTED;
  ctx.font = `400 26px ${FONT}`;
  ctx.fillText(PRAYER_SHARE_URL.replace(/^https?:\/\//, ''), W / 2, H - 108);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), 'image/jpeg', 0.92),
  );
}

export type PrayerShareOutcome = 'shared' | 'cancelled' | 'unsupported' | 'failed';

/**
 * Abre a folha de partilha do sistema com a imagem e o texto. Devolve
 * 'unsupported' quando o browser não tem partilha de ficheiros (ex.: desktop),
 * para o ecrã mostrar as ligações por rede.
 */
export async function sharePrayer(p: GuidedPrayer, prebuilt?: File | null): Promise<PrayerShareOutcome> {
  const text = prayerShareText(p);
  try {
    const file = prebuilt ?? new File([await renderPrayerCard(p)], 'oracao-guiada.jpg', { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: PRAYER_SHARE_TITLE });
      return 'shared';
    }
    if (typeof navigator.share === 'function') {
      await navigator.share({ text, title: PRAYER_SHARE_TITLE, url: PRAYER_SHARE_URL });
      return 'shared';
    }
    return 'unsupported';
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
    return typeof navigator.share === 'function' ? 'failed' : 'unsupported';
  }
}

/** Ligações diretas por rede, para quando não há folha de partilha do sistema. */
export function prayerShareLinks(p: GuidedPrayer): { name: string; href: string }[] {
  const text = encodeURIComponent(prayerShareText(p));
  const url = encodeURIComponent(PRAYER_SHARE_URL);
  const title = encodeURIComponent(PRAYER_SHARE_TITLE);
  return [
    { name: 'WhatsApp', href: `https://wa.me/?text=${text}` },
    { name: 'Telegram', href: `https://t.me/share/url?url=${url}&text=${text}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { name: 'X (Twitter)', href: `https://twitter.com/intent/tweet?text=${title}&url=${url}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { name: 'E-mail', href: `mailto:?subject=${title}&body=${text}` },
  ];
}

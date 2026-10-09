// Partilha de eventos da Agenda (cartaz + texto com link para o evento na app).
import type { ChurchEvent } from './types';

export function eventLink(ev: Pick<ChurchEvent, 'id'>): string {
  return `${window.location.origin}/agenda?evento=${encodeURIComponent(ev.id)}`;
}

export function eventShareText(ev: ChurchEvent): string {
  const d = new Date(ev.event_date);
  const day = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const lines = [
    `📅 *${ev.title}*`,
    `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`,
  ];
  if (ev.location) lines.push(`📍 ${ev.location}`);
  lines.push('', `Veja na app: ${eventLink(ev)}`, '— Redenção Church');
  return lines.join('\n');
}

/** Cartaz do evento como ficheiro (para partilhar a imagem no WhatsApp). */
export async function buildEventFiles(ev: ChurchEvent): Promise<File[]> {
  if (!ev.image_url) return [];
  const res = await fetch(ev.image_url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const type = blob.type || 'image/jpeg';
  const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const slug = ev.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return [new File([blob], `${slug || 'evento'}.${ext}`, { type })];
}

export type EventShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Partilha o cartaz + texto. `files` deve vir já preparado (o iPhone só aceita
 * a partilha logo após o toque). Sem suporte a imagens, partilha só o texto.
 */
export async function shareEvent(ev: ChurchEvent, files: File[] | null): Promise<EventShareOutcome> {
  const text = eventShareText(ev);
  try {
    if (files && files.length && navigator.canShare?.({ files })) {
      await navigator.share({ files, text, title: ev.title });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ text, title: ev.title });
      return 'shared';
    }
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'cancelled';
    // Ex.: NotAllowedError por demora — tenta só o texto.
    try {
      if (navigator.share) {
        await navigator.share({ text, title: ev.title });
        return 'shared';
      }
    } catch (e2) {
      if ((e2 as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

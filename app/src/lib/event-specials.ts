// Celebrações especiais: num dia concreto, a celebração habitual ganha outro
// título e cartaz. Fica aqui (e não na base de dados) porque as celebrações
// semanais são renovadas automaticamente e a alteração passaria para a semana
// seguinte. Depois da data, a entrada deixa de ter efeito sozinha.
import { localDateKey } from './dates';
import type { ChurchEvent } from './types';

const SPECIALS: { date: string; category: string; title: string; image_url: string }[] = [
  {
    date: '2026-11-29',
    category: 'Celebração',
    title: 'Festividade de 2 anos de igreja',
    image_url: '/aniversario-2-anos.jpg',
  },
];

export function withSpecial(ev: ChurchEvent): ChurchEvent {
  const day = localDateKey(new Date(ev.event_date));
  const s = SPECIALS.find((x) => x.date === day && x.category === ev.category);
  return s ? { ...ev, title: s.title, image_url: s.image_url } : ev;
}

export function withSpecials(events: ChurchEvent[]): ChurchEvent[] {
  return events.map(withSpecial);
}

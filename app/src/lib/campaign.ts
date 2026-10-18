// Campanha de Obede-Edom — 3 meses na presença (Pastora Bianca Donato).
// Conteúdo fixo da campanha + cálculo da fase e da leitura do dia.
import { localDateKey } from './dates';

export interface CampaignPhase {
  number: number;
  name: string;
  start: string; // AAAA-MM-DD (inclusive)
  end: string; // AAAA-MM-DD (inclusive)
  book: string;
  bookAbbrev: string;
  chapters: number;
  tagline: string;
  description: string;
  keyVerseRef: string;
  keyVerseText: string;
  /** Versículo-chave na Bíblia da app: capítulo e versículo. */
  keyVerse: { chapter: number; verse: number };
}

export const CAMPAIGN = {
  title: 'Campanha de Obede-Edom',
  subtitle: '3 meses na presença',
  motto: 'Honre a presença. Viva o sobrenatural!',
  leader: 'Pastora Bianca Donato',
  poster: '/campanha-obede-edom.webp',
  fasts: ['2026-10-21', '2026-11-21', '2026-12-21'],
};

export const PHASES: CampaignPhase[] = [
  {
    number: 1,
    name: 'SHEKINAH',
    start: '2026-10-21',
    end: '2026-11-20',
    book: 'Êxodo',
    bookAbbrev: 'Êx',
    chapters: 40,
    tagline: 'A presença que habita.',
    description:
      'Estudar como Deus libertou Israel, estabeleceu Sua aliança, ordenou a construção do tabernáculo e manifestou Sua glória no meio do povo.',
    keyVerseRef: 'Êxodo 33:15',
    keyVerseText: 'Se a tua presença não for conosco, não nos faças subir daqui.',
    keyVerse: { chapter: 33, verse: 15 },
  },
  {
    number: 2,
    name: 'KADOSH',
    start: '2026-11-21',
    end: '2026-12-20',
    book: 'Levítico',
    bookAbbrev: 'Lv',
    chapters: 27,
    tagline: 'A santidade que transforma nossa maneira de viver.',
    description:
      'Compreender que Deus é santo e chama Seu povo a viver em consagração, reverência e obediência.',
    keyVerseRef: 'Levítico 19:2',
    keyVerseText: 'Santos sereis, porque eu, o Senhor, vosso Deus, sou santo.',
    keyVerse: { chapter: 19, verse: 2 },
  },
  {
    number: 3,
    name: 'DOXA',
    start: '2026-12-21',
    end: '2027-01-20',
    book: 'Atos dos Apóstolos',
    bookAbbrev: 'At',
    chapters: 28,
    tagline: 'A glória de Deus manifestada em vidas transformadas.',
    description:
      'Conhecer a ação do Espírito Santo na Igreja, produzindo ousadia, testemunho, comunhão e transformação.',
    keyVerseRef: 'Atos 1:8',
    keyVerseText: 'Mas recebereis poder, ao descer sobre vós o Espírito Santo.',
    keyVerse: { chapter: 1, verse: 8 },
  },
];

const DAY = 86400000;
const toUtc = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const daysBetween = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / DAY);

/** "21/10" */
export function shortDate(key: string): string {
  const [, m, d] = key.split('-');
  return `${d}/${m}`;
}

export function phaseStatus(p: CampaignPhase, today = localDateKey()): 'futura' | 'atual' | 'concluida' {
  if (today < p.start) return 'futura';
  if (today > p.end) return 'concluida';
  return 'atual';
}

/**
 * Plano sugerido: aproximadamente um capítulo por dia.
 * - Se o livro tem mais capítulos do que dias (Êxodo: 40 em 31), alguns dias
 *   levam 2 capítulos, repartidos ao longo do mês (ajuste do 1.º mês).
 * - Se tem menos (Levítico 27 em 30; Atos 28 em 31), lê-se 1 capítulo por dia
 *   e os últimos dias ficam para revisão das anotações.
 * Num dia de revisão `to < from`.
 */
export function readingForDay(p: CampaignPhase, today = localDateKey()): { day: number; totalDays: number; from: number; to: number } | null {
  if (phaseStatus(p, today) !== 'atual') return null;
  const totalDays = daysBetween(p.start, p.end) + 1;
  const i = daysBetween(p.start, today);
  if (p.chapters >= totalDays) {
    const from = Math.floor((i * p.chapters) / totalDays) + 1;
    const to = Math.floor(((i + 1) * p.chapters) / totalDays);
    return { day: i + 1, totalDays, from, to };
  }
  if (i < p.chapters) return { day: i + 1, totalDays, from: i + 1, to: i + 1 };
  return { day: i + 1, totalDays, from: p.chapters + 1, to: p.chapters };
}

/** Resumo do plano de leitura de cada fase (para mostrar na campanha). */
export function planSummary(p: CampaignPhase): string {
  const totalDays = daysBetween(p.start, p.end) + 1;
  if (p.chapters > totalDays) {
    const doubles = p.chapters - totalDays;
    return `${p.chapters} capítulos em ${totalDays} dias: 1 por dia e, em ${doubles} dias, 2 capítulos.`;
  }
  if (p.chapters < totalDays) {
    const rest = totalDays - p.chapters;
    return `1 capítulo por dia durante ${p.chapters} dias; os últimos ${rest} dias são para revisão.`;
  }
  return `1 capítulo por dia.`;
}

/** As três práticas diárias sugeridas para a campanha. */
export const PRACTICES = [
  { icon: '🙏', title: 'Oração antes da leitura', text: 'Peça ao Espírito Santo que abra o seu entendimento antes de abrir a Bíblia.' },
  { icon: '✍️', title: 'Anotação', text: 'Anote o que Deus está ensinando pela Palavra — use "Nota" nos versículos da Bíblia da app.' },
  { icon: '👣', title: 'Aplicação prática', text: 'Escolha uma atitude concreta para viver durante o dia a partir do que leu.' },
];

export interface CampaignToday {
  phase: CampaignPhase | null; // fase atual (ou a próxima, se ainda não começou)
  state: 'antes' | 'durante' | 'depois';
  daysToStart: number;
  reading: ReturnType<typeof readingForDay>;
  isFastDay: boolean;
  nextFast: string | null;
}

export function campaignToday(today = localDateKey()): CampaignToday {
  const first = PHASES[0];
  const last = PHASES[PHASES.length - 1];
  const nextFast = CAMPAIGN.fasts.find((f) => f >= today) ?? null;
  const isFastDay = CAMPAIGN.fasts.includes(today);
  if (today < first.start) {
    return { phase: first, state: 'antes', daysToStart: daysBetween(today, first.start), reading: null, isFastDay, nextFast };
  }
  if (today > last.end) {
    return { phase: null, state: 'depois', daysToStart: 0, reading: null, isFastDay, nextFast };
  }
  const phase = PHASES.find((p) => phaseStatus(p, today) === 'atual') ?? null;
  return { phase, state: 'durante', daysToStart: 0, reading: phase ? readingForDay(phase, today) : null, isFastDay, nextFast };
}

export function chaptersLabel(from: number, to: number): string {
  if (to < from) return '';
  return from === to ? `capítulo ${from}` : `capítulos ${from}–${to}`;
}

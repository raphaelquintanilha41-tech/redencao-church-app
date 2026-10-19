// Leitura em áudio da Bíblia (português do Brasil) com a voz do próprio
// telemóvel (Web Speech API). Sem custos, sem servidor e sem ficheiros.
// Lê versículo a versículo: assim dá para destacar o que está a ser lido,
// saltar versículos e evitar o corte de falas longas de alguns Android.
import { useCallback, useEffect, useRef, useState } from 'react';

const RATE_KEY = 'redencao_bible_audio_rate';
export const AUDIO_RATES = [0.8, 1, 1.25, 1.5] as const;

export function audioSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function getRate(): number {
  try {
    const n = parseFloat(localStorage.getItem(RATE_KEY) ?? '');
    if ((AUDIO_RATES as readonly number[]).includes(n)) return n;
  } catch {
    /* sem localStorage */
  }
  return 1;
}

function saveRate(r: number) {
  try {
    localStorage.setItem(RATE_KEY, String(r));
  } catch {
    /* sem localStorage */
  }
}

// Voz masculina por defeito. Nomes conhecidos de vozes pt-BR masculinas:
// iPhone/Mac (Felipe), Windows/Edge (Antonio, Daniel, Donato, Fabio, Humberto,
// Julio, Nicolau, Valerio, Thiago) e Google/Android (variante "ptd").
const MALE = [/antonio/i, /daniel/i, /felipe/i, /donato/i, /f[aá]bio/i, /humberto/i, /j[uú]lio/i, /nicolau/i, /val[eé]rio/i, /thiago/i, /ptd/i, /\bmale\b/i, /masculin/i];
const FEMALE = [/luciana/i, /francisca/i, /maria/i, /thalita/i, /fernanda/i, /leila/i, /yara/i, /brenda/i, /giovanna/i, /let[ií]cia/i, /manuela/i, /elza/i, /raquel/i, /afs/i, /pte/i, /female/i, /feminin/i];
// Qualidade: vozes neurais / "naturais" / online soam melhor.
const QUALITY = [/natural/i, /neural/i, /online/i, /enhanced|melhorada|premium/i, /google/i];

const VOICE_KEY = 'redencao_bible_audio_voice';

function norm(lang: string) {
  return lang.replace('_', '-').toLowerCase();
}

export function isMaleVoice(v: SpeechSynthesisVoice): boolean {
  return MALE.some((re) => re.test(v.name)) && !FEMALE.some((re) => re.test(v.name));
}

function score(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (isMaleVoice(v)) s += 100;
  else if (!FEMALE.some((re) => re.test(v.name))) s += 10; // género desconhecido
  const q = QUALITY.findIndex((re) => re.test(v.name));
  if (q >= 0) s += 10 - q;
  if (norm(v.lang) === 'pt-br') s += 5;
  return s;
}

/** Vozes em português disponíveis, da preferida (masculina, melhor qualidade) para a pior. */
export function ptVoices(): SpeechSynthesisVoice[] {
  if (!audioSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  const br = voices.filter((v) => norm(v.lang) === 'pt-br');
  const pool = br.length ? br : voices.filter((v) => norm(v.lang).startsWith('pt'));
  return [...pool].sort((a, b) => score(b) - score(a));
}

function savedVoiceName(): string | null {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

export function saveVoiceName(name: string) {
  try {
    localStorage.setItem(VOICE_KEY, name);
  } catch {
    /* sem localStorage */
  }
}

export function pickPtBrVoice(): SpeechSynthesisVoice | null {
  const list = ptVoices();
  if (!list.length) return null;
  const saved = savedVoiceName();
  return list.find((v) => v.name === saved) ?? list[0];
}

/** Limpa marcas do texto que não devem ser lidas em voz alta. */
export function speakableText(text: string): string {
  return text
    .replace(/[[\]{}¶*†‡]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface AudioItem {
  /** Identificador do versículo (para destacar); null = anúncio do capítulo. */
  id: number | null;
  text: string;
}

export type AudioStatus = 'idle' | 'playing' | 'paused' | 'ended';

/**
 * Leitor da lista `items`. `pause` cancela e guarda a posição (o pause nativo
 * falha em vários Android); `resume` recomeça o versículo atual.
 */
export function useBibleAudio(items: AudioItem[]) {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [index, setIndex] = useState(0);
  const [rate, setRateState] = useState(getRate);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [voiceCount, setVoiceCount] = useState(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const rateRef = useRef(rate);
  rateRef.current = rate;
  // Cada leitura tem um número; respostas de leituras antigas são ignoradas.
  const runRef = useRef(0);
  // Guarda a fala atual: no Chrome, sem referência, o onend pode nunca chegar.
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!audioSupported()) return;
    const update = () => {
      setVoiceName(pickPtBrVoice()?.name ?? null);
      setVoiceCount(ptVoices().length);
    };
    update();
    window.speechSynthesis.addEventListener?.('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', update);
  }, []);

  const speakFrom = useCallback((start: number) => {
    if (!audioSupported()) return;
    const synth = window.speechSynthesis;
    const run = ++runRef.current;
    synth.cancel();
    const list = itemsRef.current;
    if (start >= list.length) {
      setStatus('ended');
      return;
    }
    const voice = pickPtBrVoice();
    const say = (i: number) => {
      if (run !== runRef.current) return;
      if (i >= list.length) {
        setStatus('ended');
        return;
      }
      setIndex(i);
      const u = new SpeechSynthesisUtterance(list[i].text);
      u.lang = 'pt-BR';
      if (voice) u.voice = voice;
      u.rate = rateRef.current;
      utterRef.current = u;
      u.onend = () => say(i + 1);
      u.onerror = (e) => {
        // "interrupted"/"canceled" = nós próprios parámos; o resto salta à frente.
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        say(i + 1);
      };
      synth.speak(u);
    };
    setStatus('playing');
    say(start);
  }, []);

  const pause = useCallback(() => {
    runRef.current++;
    if (audioSupported()) window.speechSynthesis.cancel();
    setStatus('paused');
  }, []);

  const stop = useCallback(() => {
    runRef.current++;
    if (audioSupported()) window.speechSynthesis.cancel();
    setStatus('idle');
    setIndex(0);
  }, []);

  const setRate = useCallback(
    (r: number) => {
      setRateState(r);
      rateRef.current = r;
      saveRate(r);
      if (status === 'playing') speakFrom(index);
    },
    [status, index, speakFrom],
  );

  /** Passa para a próxima voz em português instalada no aparelho. */
  const nextVoice = useCallback(() => {
    const list = ptVoices();
    if (list.length < 2) return;
    const cur = pickPtBrVoice();
    const i = list.findIndex((v) => v.name === cur?.name);
    const next = list[(i + 1) % list.length];
    saveVoiceName(next.name);
    setVoiceName(next.name);
    if (status === 'playing') speakFrom(index);
  }, [status, index, speakFrom]);

  const voiceIsMale = (() => {
    const v = pickPtBrVoice();
    return v ? isMaleVoice(v) : false;
  })();

  // Ao sair do ecrã, cala-se.
  useEffect(
    () => () => {
      runRef.current++;
      if (audioSupported()) window.speechSynthesis.cancel();
    },
    [],
  );

  return { status, index, rate, voiceName, voiceCount, voiceIsMale, nextVoice, speakFrom, pause, stop, setRate };
}

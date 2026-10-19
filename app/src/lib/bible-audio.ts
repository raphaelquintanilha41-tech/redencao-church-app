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

// Vozes de melhor qualidade primeiro (neurais / "naturais" / Google).
const PREFERRED = [/natural/i, /neural/i, /online/i, /google/i, /luciana/i, /francisca/i, /thalita/i, /felipe/i, /fernanda/i];

function norm(lang: string) {
  return lang.replace('_', '-').toLowerCase();
}

export function pickPtBrVoice(): SpeechSynthesisVoice | null {
  if (!audioSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const br = voices.filter((v) => norm(v.lang) === 'pt-br');
  const pool = br.length ? br : voices.filter((v) => norm(v.lang).startsWith('pt'));
  if (!pool.length) return null;
  for (const re of PREFERRED) {
    const v = pool.find((x) => re.test(x.name));
    if (v) return v;
  }
  return pool.find((v) => v.localService) ?? pool[0];
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
    const update = () => setVoiceName(pickPtBrVoice()?.name ?? null);
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

  // Ao sair do ecrã, cala-se.
  useEffect(
    () => () => {
      runRef.current++;
      if (audioSupported()) window.speechSynthesis.cancel();
    },
    [],
  );

  return { status, index, rate, voiceName, speakFrom, pause, stop, setRate };
}

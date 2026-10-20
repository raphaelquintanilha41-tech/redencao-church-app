// Música ambiente gerada no próprio telemóvel (Web Audio API): pads suaves
// em Ré maior, sinos ocasionais e um leve "mar" ao fundo. Original, sem
// direitos de autor, sem ficheiros para descarregar.

type Ctx = AudioContext;

const NOTE = (n: string): number => {
  // n como "D3", "F#4"
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  if (!m) return 440;
  const base: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const semis = base[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
};

// Dmaj9 → Bm9 → Gmaj9 → Asus4 (progressão calma de adoração)
const CHORDS: { bass: string; notes: string[] }[] = [
  { bass: 'D2', notes: ['D3', 'A3', 'C#4', 'E4', 'F#4'] },
  { bass: 'B1', notes: ['B2', 'F#3', 'A3', 'C#4', 'D4'] },
  { bass: 'G1', notes: ['G2', 'D3', 'F#3', 'A3', 'B3'] },
  { bass: 'A1', notes: ['A2', 'E3', 'A3', 'B3', 'D4'] },
];
const BELLS = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'A4'];

const CHORD_SECONDS = 10;

function makeImpulse(ctx: Ctx, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

function makeNoise(ctx: Ctx, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // Ruído "rosa" aproximado (mais suave que o branco).
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
  }
  return buf;
}

export class AmbientMusic {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private timer: number | null = null;
  private nextChordAt = 0;
  private nextBellAt = 0;
  private chordIndex = 0;
  private muted = false;
  private volume = 1;

  static supported(): boolean {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  /** Tem de ser chamado dentro de um toque do utilizador (regra dos navegadores). */
  start() {
    if (this.ctx || !AmbientMusic.supported()) return;
    // iPhone: toca mesmo com o botão de silêncio ligado (Safari 16.4+).
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch {
      /* ignorar */
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    this.master = master;

    // Bus com reverb (sala grande) + sinal direto.
    const bus = ctx.createGain();
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 4.5);
    const wet = ctx.createGain();
    wet.gain.value = 0.7;
    const dry = ctx.createGain();
    dry.gain.value = 0.45;
    bus.connect(dry).connect(master);
    bus.connect(reverb).connect(wet).connect(master);
    this.bus = bus;
    this.reverb = reverb;

    // "Mar" muito suave: ruído filtrado com ondulação lenta.
    const noise = ctx.createBufferSource();
    noise.buffer = makeNoise(ctx, 6);
    noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 420;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain).connect(ng.gain);
    noise.connect(nf).connect(ng).connect(master);
    noise.start();
    lfo.start();

    const now = ctx.currentTime;
    master.gain.setTargetAtTime(this.muted ? 0 : this.volume, now, 1.5);
    this.nextChordAt = now + 0.1;
    this.nextBellAt = now + 4;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 500);
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.bus) return;
    const ahead = ctx.currentTime + 1.5;
    while (this.nextChordAt < ahead) {
      this.playChord(CHORDS[this.chordIndex % CHORDS.length], this.nextChordAt);
      this.chordIndex++;
      this.nextChordAt += CHORD_SECONDS;
    }
    while (this.nextBellAt < ahead) {
      this.playBell(BELLS[Math.floor(Math.random() * BELLS.length)], this.nextBellAt);
      this.nextBellAt += 3 + Math.random() * 5;
    }
  }

  private playChord(chord: { bass: string; notes: string[] }, t: number) {
    const ctx = this.ctx!;
    const bus = this.bus!;
    const attack = 3.5;
    const end = t + CHORD_SECONDS + 3; // sobrepõe com o próximo acorde
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.6;
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.linearRampToValueAtTime(1100, t + CHORD_SECONDS / 2);
    filter.frequency.linearRampToValueAtTime(600, end);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + attack);
    env.gain.setValueAtTime(1, end - 4);
    env.gain.linearRampToValueAtTime(0, end);
    filter.connect(env).connect(bus);

    for (const n of chord.notes) {
      const f = NOTE(n);
      for (const [type, detune, vol] of [
        ['sawtooth', -6, 0.036],
        ['triangle', 7, 0.06],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = vol;
        o.connect(g).connect(filter);
        o.start(t);
        o.stop(end + 0.1);
      }
    }
    // Baixo suave
    const b = ctx.createOscillator();
    b.type = 'sine';
    b.frequency.value = NOTE(chord.bass);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0, t);
    bg.gain.linearRampToValueAtTime(0.16, t + attack);
    bg.gain.setValueAtTime(0.16, end - 4);
    bg.gain.linearRampToValueAtTime(0, end);
    b.connect(bg).connect(this.master!);
    b.start(t);
    b.stop(end + 0.1);
  }

  private playBell(n: string, t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = NOTE(n);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = NOTE(n) * 2.01;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(this.reverb!);
    o.start(t);
    o2.start(t);
    o.stop(t + 4.6);
    o2.stop(t + 4.6);
  }

  pause() {
    this.ctx?.suspend().catch(() => undefined);
  }

  resume() {
    this.ctx?.resume().catch(() => undefined);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.4);
  }

  isMuted() {
    return this.muted;
  }

  /** Baixa o volume e fecha o áudio. */
  stop(fadeSeconds = 1.5) {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    try {
      this.master?.gain.setTargetAtTime(0, ctx.currentTime, fadeSeconds / 4);
    } catch {
      /* ignorar */
    }
    this.ctx = null;
    window.setTimeout(() => ctx.close().catch(() => undefined), fadeSeconds * 1000 + 200);
  }
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AmbientMusic } from '../lib/ambient-music';
import { submitPrayerRequest } from '../lib/caminhada';
import { fetchGuidedPrayer, guidedPrayerFor, type GuidedPrayer } from '../lib/guided-prayer';
import { prayerShareLinks, prayerShareText, renderPrayerCard, sharePrayer } from '../lib/prayer-share';
import { PrayerBackground } from './PrayerBackground';

type Phase = 'intro' | 'playing' | 'done';

/**
 * Oração guiada (ecrã inteiro): texto que avança sozinho, música ambiente e
 * cena animada de fundo. Toque à direita / deslize para cima = avançar;
 * toque à esquerda / deslize para baixo = voltar.
 */
export function OracaoGuiadaScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prayer, setPrayer] = useState<GuidedPrayer>(() => guidedPrayerFor());
  const steps = prayer.steps;

  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0); // ms dentro do passo atual
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareLinksOpen, setShareLinksOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareFileRef = useRef<File | null>(null);
  const phaseRef = useRef<Phase>('intro');
  phaseRef.current = phase;

  // Roteiro escrito para hoje (só troca enquanto ainda está na abertura).
  useEffect(() => {
    let alive = true;
    fetchGuidedPrayer().then((p) => {
      if (alive && phaseRef.current === 'intro') setPrayer(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Imagem de partilha pronta antes do toque (o iPhone só partilha se for imediato).
  useEffect(() => {
    let alive = true;
    shareFileRef.current = null;
    renderPrayerCard(prayer)
      .then((b) => {
        if (alive) shareFileRef.current = new File([b], 'oracao-guiada.jpg', { type: 'image/jpeg' });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [prayer]);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const outcome = await sharePrayer(prayer, shareFileRef.current);
      if (outcome === 'unsupported') setShareLinksOpen(true);
      else if (outcome === 'failed') showToast('Não foi possível partilhar.');
    } finally {
      setSharing(false);
    }
  };

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(prayerShareText(prayer));
      showToast('Texto copiado.');
    } catch {
      showToast('Não foi possível copiar.');
    }
  };

  const musicRef = useRef<AmbientMusic | null>(null);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);
  const touchY = useRef<number | null>(null);

  const step = steps[index];
  const holding = paused || sheetOpen;

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2600);
  };

  const keepAwake = async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
      wakeRef.current = (await nav.wakeLock?.request('screen')) ?? null;
    } catch {
      /* sem wake lock */
    }
  };
  const releaseAwake = () => {
    wakeRef.current?.release().catch(() => undefined);
    wakeRef.current = null;
  };

  const begin = () => {
    // O áudio tem de começar dentro do toque do utilizador.
    if (AmbientMusic.supported()) {
      const m = new AmbientMusic();
      m.setMuted(muted);
      m.start();
      musicRef.current = m;
    }
    keepAwake();
    setIndex(0);
    setElapsed(0);
    setPaused(false);
    setPhase('playing');
  };

  const finish = useCallback(() => {
    setPhase('done');
    releaseAwake();
    const m = musicRef.current;
    musicRef.current = null;
    // Deixa a música soar mais uns segundos e desvanece.
    window.setTimeout(() => m?.stop(4), 5000);
  }, []);

  const go = useCallback(
    (to: number) => {
      if (to < 0) to = 0;
      if (to >= steps.length) {
        finish();
        return;
      }
      setIndex(to);
      setElapsed(0);
    },
    [steps.length, finish],
  );

  // Relógio: avança sozinho quando o tempo do passo termina.
  useEffect(() => {
    if (phase !== 'playing' || holding) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setElapsed((e) => e + dt);
    }, 200);
    return () => window.clearInterval(id);
  }, [phase, holding]);

  useEffect(() => {
    if (phase === 'playing' && elapsed >= step.seconds * 1000) go(index + 1);
  }, [elapsed, phase, step.seconds, index, go]);

  // Pausa / retoma a música junto com a oração.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (paused) musicRef.current?.pause();
    else musicRef.current?.resume();
  }, [paused, phase]);

  // Sair da app (ecrã bloqueado, outra app) = pausa.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && phase === 'playing') setPaused(true);
      if (!document.hidden && phase === 'playing' && !paused) keepAwake();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase, paused]);

  // Ao sair do ecrã: cala a música e liberta o ecrã.
  useEffect(
    () => () => {
      musicRef.current?.stop(0.5);
      musicRef.current = null;
      releaseAwake();
    },
    [],
  );

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    musicRef.current?.setMuted(m);
  };

  const close = () => {
    musicRef.current?.stop(0.8);
    musicRef.current = null;
    releaseAwake();
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return;
    const x = e.clientX / window.innerWidth;
    if (x < 0.3) go(index - 1);
    else go(index + 1);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const y0 = touchY.current;
    touchY.current = null;
    const y1 = e.changedTouches[0]?.clientY;
    if (y0 === null || y1 === undefined || phase !== 'playing') return;
    const dy = y1 - y0;
    if (Math.abs(dy) < 60) return;
    e.preventDefault(); // evita o "toque" a seguir ao deslizar
    if (dy < 0) go(index + 1);
    else go(index - 1);
  };

  const sendPrayer = async () => {
    if (!user || !draft.trim()) return;
    setSending(true);
    try {
      await submitPrayerRequest(user.id, {
        category: 'Espiritual',
        content: draft.trim(),
        is_anonymous: false,
        is_confidential: true,
      });
      setDraft('');
      setSheetOpen(false);
      showToast('Pedido enviado à equipe de oração (confidencial).');
    } catch (err) {
      showToast(`Não foi possível enviar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSending(false);
    }
  };

  const stepProgress = Math.min(1, elapsed / (step.seconds * 1000));
  const breathIn = Math.floor(elapsed / 4000) % 2 === 0;

  return (
    <div className={`oracao-screen${holding ? ' oracao-held' : ''}`}>
      <PrayerBackground scene={prayer.scene} />
      <div className="oracao-shade" />

      {phase === 'intro' && (
        <div className="oracao-intro">
          <button type="button" className="oracao-icon-btn oracao-close" onClick={close} aria-label="Fechar">
            ✕
          </button>
          <button type="button" className="oracao-icon-btn oracao-share" onClick={share} aria-label="Partilhar" disabled={sharing}>
            <ShareIcon />
          </button>
          <span className="oracao-kicker">ORAÇÃO GUIADA</span>
          <h1 className="oracao-intro-title">Iniciar uma conversa com Deus</h1>
          <p className="oracao-intro-sub">{Math.round(prayer.totalSeconds / 60)}–{Math.round(prayer.totalSeconds / 60) + 2} minutos · com música</p>
          <ol className="oracao-intro-steps">
            <li>Respire e acalme o coração</li>
            <li>Honre a Deus</li>
            <li>Entregue as suas preocupações</li>
            <li>Agradeça</li>
          </ol>
          <button type="button" className="oracao-start" onClick={begin}>
            ▶ Começar
          </button>
          <p className="oracao-intro-tip">Dica: use fones de ouvido e encontre um lugar tranquilo.</p>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <div className="oracao-top">
            <button type="button" className="oracao-icon-btn" onClick={close} aria-label="Fechar">
              ✕
            </button>
            {musicRef.current && (
              <button type="button" className="oracao-icon-btn" onClick={toggleMute} aria-label={muted ? 'Ligar música' : 'Desligar música'}>
                {muted ? <SpeakerOff /> : <SpeakerOn />}
              </button>
            )}
          </div>

          <div className="oracao-stage" onClick={onTap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="oracao-content" key={index}>
              <span className="oracao-kicker">{step.section}</span>

              {step.breath && (
                <div className="oracao-breath" aria-hidden="true">
                  <span className="oracao-breath-circle" />
                  <span className="oracao-breath-label">{breathIn ? 'Inspire…' : 'Expire…'}</span>
                </div>
              )}

              {step.lines?.map((l, i) => (
                <p key={i} className={`oracao-line${step.lines!.length === 1 && l.length > 120 ? ' oracao-line-long' : ''}`} style={{ animationDelay: `${0.3 + i * 1.6}s` }}>
                  {l}
                </p>
              ))}

              {step.verse && (
                <blockquote className="oracao-verse">
                  <p>{step.verse.text}</p>
                  <cite>{step.verse.ref}</cite>
                </blockquote>
              )}

              {step.question && <p className="oracao-question">{step.question}</p>}
              {step.guidance && <p className="oracao-guidance">{step.guidance}</p>}

              {step.addPrayer && (
                <button
                  type="button"
                  className="oracao-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetOpen(true);
                  }}
                >
                  ✍️ Adicionar oração
                </button>
              )}

              {index === steps.length - 1 && (
                <button
                  type="button"
                  className="oracao-amen"
                  onClick={(e) => {
                    e.stopPropagation();
                    finish();
                  }}
                >
                  Amém
                </button>
              )}
            </div>
          </div>

          <div className="oracao-progress" aria-label={`Passo ${index + 1} de ${steps.length}`}>
            {steps.map((_, i) => (
              <span key={i} className="oracao-progress-seg">
                <span
                  className="oracao-progress-fill"
                  style={{ height: `${i < index ? 100 : i === index ? stepProgress * 100 : 0}%` }}
                />
              </span>
            ))}
          </div>

          <button
            type="button"
            className="oracao-icon-btn oracao-play"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Continuar' : 'Pausar'}
          >
            {paused ? '▶' : '❚❚'}
          </button>
          {paused && <div className="oracao-paused-hint">Em pausa — toque em ▶ para continuar</div>}
        </>
      )}

      {phase === 'done' && (
        <div className="oracao-done">
          <span className="oracao-kicker">ORAÇÃO GUIADA</span>
          <h1 className="oracao-done-title">Amém. 🙏</h1>
          <p className="oracao-done-text">Obrigado por passar este tempo com Deus. Leve esta paz para o resto do seu dia.</p>
          <div className="oracao-done-actions">
            <button type="button" className="oracao-start" onClick={() => navigate('/palavra-do-dia')}>
              Ler a Palavra do dia
            </button>
            <button type="button" className="oracao-ghost" onClick={share} disabled={sharing}>
              Partilhar nas redes
            </button>
            <button type="button" className="oracao-ghost" onClick={begin}>
              Orar de novo
            </button>
            <button type="button" className="oracao-ghost" onClick={() => navigate('/')}>
              Voltar ao Início
            </button>
          </div>
        </div>
      )}

      {shareLinksOpen && (
        <div className="oracao-sheet-backdrop" onClick={() => setShareLinksOpen(false)}>
          <div className="oracao-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Partilhar">
            <h2>Partilhar a Oração guiada</h2>
            <p>Escolha a rede. No telemóvel, a imagem vai junto; aqui vai o texto com o link.</p>
            <div className="oracao-share-grid">
              {prayerShareLinks(prayer).map((l) => (
                <a key={l.name} className="oracao-ghost oracao-share-link" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.name}
                </a>
              ))}
              <button type="button" className="oracao-ghost oracao-share-link" onClick={copyShareText}>
                Copiar texto
              </button>
            </div>
            <div className="oracao-sheet-actions">
              <button type="button" className="oracao-ghost" onClick={() => setShareLinksOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {sheetOpen && (
        <div className="oracao-sheet-backdrop" onClick={() => setSheetOpen(false)}>
          <div className="oracao-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Adicionar oração">
            <h2>A sua oração</h2>
            <p>Escreva com as suas palavras. Pode guardá-la só entre você e Deus, ou enviá-la à equipe de oração.</p>
            <textarea
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Senhor, eu Te entrego…"
              autoFocus
            />
            <div className="oracao-sheet-actions">
              <button type="button" className="oracao-start" onClick={sendPrayer} disabled={sending || !draft.trim() || !user}>
                {sending ? 'A enviar…' : 'Enviar à equipe de oração'}
              </button>
              <button
                type="button"
                className="oracao-ghost"
                onClick={() => {
                  setSheetOpen(false);
                  setDraft('');
                }}
              >
                Orei — continuar
              </button>
            </div>
            <small>O pedido enviado é confidencial: só a equipe pastoral o vê.</small>
          </div>
        </div>
      )}

      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

function SpeakerOn() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}

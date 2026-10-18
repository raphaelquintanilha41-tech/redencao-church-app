import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAMPAIGN,
  PHASES,
  campaignToday,
  chaptersLabel,
  phaseStatus,
  shortDate,
  type CampaignPhase,
} from '../lib/campaign';

const bibleLink = (abbrev: string, chapter: number, verse?: number) =>
  `/biblia/${encodeURIComponent(abbrev)}/${chapter}${verse ? `?v=${verse}` : ''}`;

/** Ecrã da Campanha de Obede-Edom (3 meses na presença). */
export function CampanhaScreen() {
  const navigate = useNavigate();
  const today = campaignToday();
  const filesRef = useRef<File[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Cartaz preparado para a partilha (o iPhone exige partilha logo após o toque).
  useEffect(() => {
    fetch(CAMPAIGN.poster)
      .then((r) => r.blob())
      .then((b) => {
        filesRef.current = [new File([b], 'campanha-obede-edom.webp', { type: b.type || 'image/webp' })];
      })
      .catch(() => {});
  }, []);

  const share = async () => {
    const text = [
      `🔥 *${CAMPAIGN.title} — ${CAMPAIGN.subtitle}*`,
      CAMPAIGN.motto,
      '',
      ...PHASES.map((p) => `${p.number}. *${p.name}* (${shortDate(p.start)} a ${shortDate(p.end)}) — ${p.book}`),
      '',
      `🕐 Jejum de 24h: ${CAMPAIGN.fasts.map(shortDate).join(' | ')}`,
      '📖 Leitura da Palavra e 🙏 oração todos os dias',
      '',
      `Acompanhe na app: ${window.location.origin}/campanha`,
      '— Redenção Church',
    ].join('\n');
    const files = filesRef.current;
    try {
      if (files && navigator.canShare?.({ files })) {
        await navigator.share({ files, text, title: CAMPAIGN.title });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text, title: CAMPAIGN.title });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
      try {
        if (navigator.share) {
          await navigator.share({ text, title: CAMPAIGN.title });
          return;
        }
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Texto da campanha copiado — cole no WhatsApp.');
    } catch {
      showToast('Não foi possível compartilhar neste aparelho.');
    }
  };

  const r = today.reading;
  const phase = today.phase;

  return (
    <div className="static-screen campanha-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/')}>
          ← Início
        </button>
        <h1 className="igreja-title">Campanha</h1>
      </header>

      <img className="campanha-poster" src={CAMPAIGN.poster} alt="Campanha Obede-Edom — As três glórias" />

      <section className="card-navy campanha-hero">
        <span className="home-verse-kicker">CAMPANHA</span>
        <h2 className="campanha-title">{CAMPAIGN.title}</h2>
        <p className="campanha-subtitle">{CAMPAIGN.subtitle}</p>
        <p className="campanha-motto">{CAMPAIGN.motto}</p>

        {/* Hoje na campanha */}
        <div className="campanha-today">
          {today.state === 'antes' && phase && (
            <>
              <strong>
                Começa {today.daysToStart === 1 ? 'amanhã' : `daqui a ${today.daysToStart} dias`} — {shortDate(phase.start)}
              </strong>
              <span>
                1.º mês: {phase.name} · {phase.book}. No dia {shortDate(phase.start)} há jejum de 24h.
              </span>
            </>
          )}
          {today.state === 'durante' && phase && r && (
            <>
              <strong>
                {phase.name} · dia {r.day} de {r.totalDays}
              </strong>
              {r.to >= r.from ? (
                <span>
                  Leitura de hoje: {phase.book}, {chaptersLabel(r.from, r.to)}.
                </span>
              ) : (
                <span>Hoje sem capítulo novo: medite no versículo-chave e no último capítulo lido.</span>
              )}
              {today.isFastDay && <span className="campanha-fast-today">🕐 Hoje é dia de jejum de 24h.</span>}
              <button
                type="button"
                className="btn-primary campanha-today-btn"
                onClick={() =>
                  navigate(bibleLink(phase.bookAbbrev, r.to >= r.from ? r.from : Math.max(1, r.from - 1)))
                }
              >
                {r.to >= r.from ? 'Ler agora' : 'Abrir a leitura'}
              </button>
            </>
          )}
          {today.state === 'depois' && <strong>Campanha concluída. Glória a Deus por cada vida transformada!</strong>}
        </div>

        <button type="button" className="btn-secondary campanha-share" onClick={share}>
          Compartilhar campanha
        </button>
      </section>

      {/* Os três pilares */}
      <div className="campanha-pillars">
        <div className="campanha-pillar">
          <span aria-hidden="true">🕐</span>
          <strong>Jejum de 24h</strong>
          <small>{CAMPAIGN.fasts.map(shortDate).join(' · ')}</small>
        </div>
        <div className="campanha-pillar">
          <span aria-hidden="true">📖</span>
          <strong>Leitura da Palavra</strong>
          <small>todos os dias</small>
        </div>
        <div className="campanha-pillar">
          <span aria-hidden="true">🙏</span>
          <strong>Oração</strong>
          <small>todos os dias</small>
        </div>
      </div>

      {PHASES.map((p) => (
        <PhaseCard key={p.number} phase={p} onOpen={(ch, v) => navigate(bibleLink(p.bookAbbrev, ch, v))} />
      ))}

      <p className="home-event-meta campanha-leader">{CAMPAIGN.leader}</p>
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

function PhaseCard({ phase: p, onOpen }: { phase: CampaignPhase; onOpen: (chapter: number, verse?: number) => void }) {
  const status = phaseStatus(p);
  return (
    <section className={`card campanha-phase campanha-phase-${status}`}>
      <div className="campanha-phase-head">
        <span className="campanha-phase-num">{p.number}</span>
        <div>
          <div className="campanha-phase-name">{p.name}</div>
          <div className="home-event-meta">
            {shortDate(p.start)} a {shortDate(p.end)}
            {status === 'atual' ? ' · em curso' : status === 'concluida' ? ' · concluída' : ''}
          </div>
        </div>
      </div>
      <div className="campanha-phase-book">
        {p.book} — {p.chapters} capítulos
      </div>
      <p className="campanha-phase-tagline">{p.tagline}</p>
      <p className="static-body-text">{p.description}</p>
      <blockquote className="campanha-keyverse">
        <span>Versículo-chave</span>
        “{p.keyVerseText}”
        <cite>{p.keyVerseRef}</cite>
      </blockquote>
      <div className="campanha-phase-actions">
        <button type="button" className="btn-secondary" onClick={() => onOpen(p.keyVerse.chapter, p.keyVerse.verse)}>
          Ver versículo-chave
        </button>
        <button type="button" className="btn-primary" onClick={() => onOpen(1)}>
          Abrir {p.book.split(' ')[0]}
        </button>
      </div>
    </section>
  );
}

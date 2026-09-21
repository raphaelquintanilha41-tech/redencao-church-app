import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyBaptismRequest, requestBaptism } from '../lib/caminhada';
import { fetchUpcomingEvents } from '../lib/home';
import type { ChurchEvent } from '../lib/types';

const baptismPoster = '/batismo-poster.jpg';

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
}
export function BatismoScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nextDate, setNextDate] = useState<ChurchEvent | null>(null);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.all([fetchUpcomingEvents(20), fetchMyBaptismRequest(user.id)])
      .then(([events, requested]) => {
        if (!mounted) return;
        setNextDate(events.find((e) => e.category === 'Batismo') ?? null);
        setAlreadyRequested(requested);
      })
      .catch((err) => console.error('[BatismoScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/batismo`;
    const quando = nextDate ? formatEventDate(nextDate.event_date) : null;
    const shareTitle = 'Batismo — Redenção Church';
    const shareText = quando
      ? `Vai haver batismo na Redenção Church: ${quando}.\n\nAbre na app e inscreve-te:`
      : 'Batismo na Redenção Church.\n\nAbre na app para saberes mais:';
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        showToast('Ligação copiada para a área de transferência.');
      } else {
        showToast('Partilha não é suportada neste navegador.');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        showToast('Não foi possível partilhar agora.');
      }
    }
  };
  const confirmar = async () => {
    if (!user) return;
    setSending(true);
    try {
      await requestBaptism(user.id);
      setAlreadyRequested(true);
    } catch (err) {
      setToast(`Falha ao enviar: ${err instanceof Error ? err.message : String(err)}`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Batismo</h1>
      </header>
      <img src={baptismPoster} alt="Batismo — Nova vida em Cristo" className="static-hero-image" />
      <section className="card perfil-section">
        <p className="static-body-text">
          O batismo nas águas é o passo público de quem decidiu seguir Jesus — um sinal de que a vida antiga morreu e
          uma vida nova começou (Romanos 6:4). Não salva por si só, mas é um ato de obediência e testemunho para
          quem já entregou o coração a Cristo.
        </p>
      </section>
      <section className="card-navy static-welcome-card">
        <div className="home-verse-header">
          <span className="home-verse-kicker">PRÓXIMA DATA</span>
          <button
            type="button"
            className="home-verse-share-btn"
            aria-label="Compartilhar o batismo"
            onClick={handleShare}
          >
            <ShareIcon />
          </button>
        </div>
        {loading ? (
          <p className="static-welcome-text">A carregar…</p>
        ) : nextDate ? (
          <>
            <div className="igreja-highlight-title">{nextDate.title}</div>
            <div className="igreja-highlight-meta">{formatEventDate(nextDate.event_date)}</div>
          </>
        ) : (
          <p className="home-event-meta">Nenhuma data de batismo agendada no momento.</p>
        )}
      </section>
      {alreadyRequested ? (
        <div className="caminhada-done-badge">Pedido de batismo enviado ✓</div>
      ) : (
        <button type="button" className="btn-primary agenda-cta" disabled={sending} onClick={confirmar}>
          {sending ? 'A enviar…' : 'Quero me batizar'}
        </button>
      )}
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 7.5L12 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

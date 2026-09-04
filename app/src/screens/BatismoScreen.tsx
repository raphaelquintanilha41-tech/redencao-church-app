import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyBaptismRequest, requestBaptism } from '../lib/caminhada';
import { fetchUpcomingEvents } from '../lib/home';
import type { ChurchEvent } from '../lib/types';
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
                        </button>button>
                        <h1 className="igreja-title">Batismo</h1>h1>
                </header>header>
                <section className="card perfil-section">
                        <p className="static-body-text">
                                  O batismo nas águas é o passo público de quem decidiu seguir Jesus — um sinal de que a vida antiga morreu e
                                  uma vida nova começou (Romanos 6:4). Não salva por si só, mas é um ato de obediência e testemunho para
                                  quem já entregou o coração a Cristo.
                        </p>p>
                </section>section>
                <section className="card-navy static-welcome-card">
                        <span className="home-verse-kicker">PRÓXIMA DATA</span>span>
                  {loading ? (
                      <p className="static-welcome-text">A carregar…</p>p>
                    ) : nextDate ? (
                      <>
                                  <div className="igreja-highlight-title">{nextDate.title}</div>div>
                                  <div className="igreja-highlight-meta">{formatEventDate(nextDate.event_date)}</div>div>
                      </>>
                    ) : (
                      <p className="home-event-meta">Nenhuma data de batismo agendada no momento.</p>p>
                        )}
                </section>section>
            {alreadyRequested ? (
                    <div className="caminhada-done-badge">Pedido de batismo enviado ✓</div>div>
                  ) : (
                    <button type="button" className="btn-primary agenda-cta" disabled={sending} onClick={confirmar}>
                      {sending ? 'A enviar…' : 'Quero me batizar'}
                    </button>button>
                )}
            {toast && <div className="rc-toast">{toast}</div>div>}
          </div>div>
        );
}
</></div>

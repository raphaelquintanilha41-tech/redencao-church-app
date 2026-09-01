import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAllEvents, fetchMyRegistrations, registerForEvent, unregisterFromEvent } from '../lib/agenda';
import type { ChurchEvent } from '../lib/types';

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
}

export function AgendaScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [registered, setRegistered] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('Todos');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    Promise.all([fetchAllEvents(), fetchMyRegistrations(user.id)])
      .then(([ev, regs]) => {
        if (!mounted) return;
        setEvents(ev);
        setRegistered(regs);
      })
      .catch((err) => {
        console.error('[AgendaScreen] falha ao carregar:', err);
        showToast('Não foi possível carregar a agenda agora.');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  const categories = useMemo(() => {
    const set = new Set(events.map((e) => e.category).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(set)];
  }, [events]);

  const filtered = useMemo(
    () => (category === 'Todos' ? events : events.filter((e) => e.category === category)),
    [events, category],
  );

  const toggleRegistration = async (eventId: string) => {
    if (!user) return;
    setBusyId(eventId);
    try {
      if (registered.has(eventId)) {
        await unregisterFromEvent(user.id, eventId);
        setRegistered((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      } else {
        await registerForEvent(user.id, eventId);
        setRegistered((prev) => new Set(prev).add(eventId));
      }
    } catch (err) {
      showToast(`Falha ao atualizar inscrição: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="agenda-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Agenda</h1>
      </header>

      <div className="biblia-tabs agenda-tabs">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`biblia-tab${category === c ? ' biblia-tab-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : filtered.length === 0 ? (
        <p className="home-event-meta biblia-loading-msg">Nenhum evento nesta categoria.</p>
      ) : (
        <div className="agenda-list">
          {filtered.map((ev) => {
            const isRegistered = registered.has(ev.id);
            return (
              <div key={ev.id} className="card agenda-card">
                <div className="agenda-card-date">{formatEventDate(ev.event_date)}</div>
                <div className="home-event-title">{ev.title}</div>
                {ev.location && <div className="home-event-meta">{ev.location}</div>}
                {ev.category && <span className="agenda-card-category">{ev.category}</span>}
                <button
                  type="button"
                  className={isRegistered ? 'btn-secondary agenda-cta' : 'btn-primary agenda-cta'}
                  disabled={busyId === ev.id}
                  onClick={() => toggleRegistration(ev.id)}
                >
                  {isRegistered ? 'Inscrição confirmada ✓' : 'Inscrever-me'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

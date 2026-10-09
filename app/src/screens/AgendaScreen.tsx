import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAllEvents, fetchMyRegistrations, registerForEvent, unregisterFromEvent } from '../lib/agenda';
import { buildEventFiles, shareEvent } from '../lib/event-share';
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
  // Link partilhado: /agenda?evento=<id> → destaca e mostra esse evento.
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('evento');
  // Cartazes preparados com antecedência para a partilha (iPhone).
  const filesRef = useRef<Map<string, File[]>>(new Map());

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

  // Prepara os cartazes para partilhar e leva ao evento do link, se houver.
  useEffect(() => {
    if (loading) return;
    for (const ev of events) {
      if (ev.image_url && !filesRef.current.has(ev.id)) {
        buildEventFiles(ev)
          .then((files) => filesRef.current.set(ev.id, files))
          .catch(() => {
            /* partilha só o texto */
          });
      }
    }
    if (focusId) {
      const t = window.setTimeout(() => {
        document.getElementById(`evento-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => window.clearTimeout(t);
    }
  }, [loading, events, focusId]);

  const handleShare = async (ev: ChurchEvent) => {
    const outcome = await shareEvent(ev, filesRef.current.get(ev.id) ?? null);
    if (outcome === 'copied') showToast('Texto do evento copiado — cole no WhatsApp.');
    else if (outcome === 'failed') showToast('Não foi possível compartilhar neste aparelho.');
  };

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
              <div
                key={ev.id}
                id={`evento-${ev.id}`}
                className={`card agenda-card${focusId === ev.id ? ' agenda-card-focus' : ''}`}
              >
                {ev.image_url && (
                  <img className="agenda-card-image" src={ev.image_url} alt={ev.title} loading="lazy" />
                )}
                <div className="agenda-card-date">{formatEventDate(ev.event_date)}</div>
                <div className="home-event-title">{ev.title}</div>
                {ev.location && <div className="home-event-meta">{ev.location}</div>}
                {ev.category && <span className="agenda-card-category">{ev.category}</span>}
                <div className="agenda-card-actions">
                  <button
                    type="button"
                    className={isRegistered ? 'btn-secondary agenda-cta' : 'btn-primary agenda-cta'}
                    disabled={busyId === ev.id}
                    onClick={() => toggleRegistration(ev.id)}
                  >
                    {isRegistered ? 'Inscrição confirmada ✓' : 'Inscrever-me'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary agenda-share-btn"
                    aria-label={`Compartilhar ${ev.title}`}
                    onClick={() => handleShare(ev)}
                  >
                    Compartilhar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

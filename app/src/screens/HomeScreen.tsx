import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchLastRead, type ReadingHistoryItem } from '../lib/bible';
import {
    fetchActiveReadingPlanProgress,
    fetchDailyVerse,
    fetchLatestSermon,
    fetchRecommendedDevotional,
    fetchTodayProgress,
    fetchUpcomingEvents,
    markTodayProgress,
} from '../lib/home';
import { fetchUnreadNotificationCount } from '../lib/notifications';
import { updateAppBadge } from '../lib/push';
import type {
    ChurchEvent,
    DailyVerse,
    Devotional,
    ReadingPlan,
    Sermon,
    UserDailyProgress,
    UserPlanProgress,
} from '../lib/types';

const logo = '/redencao-logo.jpeg';

function formatEventDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' }) +
          ' · ' +
          d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds} s`;
    const m = Math.round(seconds / 60);
    return `${m} min`;
}

export function HomeScreen() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const firstName = (profile?.full_name ?? user?.email ?? '').split(' ')[0];

  const [verse, setVerse] = useState<DailyVerse | null>(null);
    const [devotional, setDevotional] = useState<Devotional | null>(null);
    const [events, setEvents] = useState<ChurchEvent[]>([]);
    const [sermon, setSermon] = useState<Sermon | null>(null);
    const [plan, setPlan] = useState<{ plan: ReadingPlan; progress: UserPlanProgress } | null>(null);
    const [dailyProgress, setDailyProgress] = useState<UserDailyProgress | null>(null);
    const [lastRead, setLastRead] = useState<ReadingHistoryItem | null>(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [videoOpen, setVideoOpen] = useState(false);

  const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
        let mounted = true;
        if (!user) return;

                Promise.all([
                        fetchDailyVerse(),
                        fetchRecommendedDevotional(),
                        fetchUpcomingEvents(6),
                        fetchLatestSermon(),
                        fetchActiveReadingPlanProgress(user.id),
                        fetchTodayProgress(user.id),
                        fetchLastRead(user.id),
                      ])
          .then(([v, d, e, s, p, dp, lr]) => {
                    if (!mounted) return;
                    setVerse(v);
                    setDevotional(d);
                    setEvents(e);
                    setSermon(s);
                    setPlan(p);
                    setDailyProgress(dp);
                    setLastRead(lr);
          })
          .catch((err) => {
                    // eslint-disable-next-line no-console
                         console.error('[HomeScreen] falha ao carregar dados:', err);
                    showToast('Não foi possível carregar todo o conteúdo agora.');
          })
          .finally(() => mounted && setLoading(false));

                return () => {
                        mounted = false;
                };
  }, [user]);

  useEffect(() => {
        if (!user) return;
        let mounted = true;
        fetchUnreadNotificationCount(user.id)
          .then((n) => mounted && setUnreadNotifications(n))
          .catch((err) => console.error('[HomeScreen] falha ao carregar notificações:', err));
        return () => {
                mounted = false;
        };
  }, [user]);

  useEffect(() => {
        updateAppBadge(unreadNotifications);
  }, [unreadNotifications]);

  const toggleProgress = async (field: 'read_bible' | 'did_devotional') => {
        if (!user) return;
        const next = { ...dailyProgress, [field]: !dailyProgress?.[field] };
        try {
                const updated = await markTodayProgress(user.id, {
                          read_bible: next.read_bible ?? false,
                          did_devotional: next.did_devotional ?? false,
                });
                setDailyProgress(updated);
        } catch (err) {
                showToast(`Falha ao guardar: ${err instanceof Error ? err.message : String(err)}`);
        }
  };

  const nextEvent = events[0];

  return (
        <div className="home-screen">
              <header className="home-header">
                      <img src={logo} alt="Redenção Church" className="home-header-logo" />
                      <div className="home-header-greeting">
                                <div className="home-header-name">Olá, {firstName || 'membro'}</div>div>
                                <div className="home-header-tagline">Que a Palavra conduza o seu dia.</div>div>
                      </div>div>
                      <Link to="/notificacoes" className="home-header-icon-btn" aria-label="Notificações">
                                <BellIcon />
                        {unreadNotifications > 0 && <span className="home-notif-badge" />}
                      </Link>Link>
              </header>header>
        
          {loading ? (
                  <div className="home-loading">A carregar…</div>div>
                ) : (
                  <div className="home-content">
                    {/* Palavra do dia */}
                            <section className="card-navy home-verse-card">
                                        <span className="home-verse-kicker">PALAVRA DO DIA</span>span>
                                        <p className="home-verse-text">"{verse?.text ?? 'Sem versículo disponível hoje.'}"</p>p>
                              {verse && <span className="home-verse-ref">{verse.reference}</span>span>}
                                            <div className="home-verse-actions">
                                                          <button
                                                                            type="button"
                                                                            className="btn-secondary home-verse-btn"
                                                                            onClick={() => showToast('Favoritos chega numa próxima fase.')}
                                                                          >
                                                                          Salvar
                                                          </button>button>
                                                          <button
                                                                            type="button"
                                                                            className="btn-primary home-verse-btn"
                                                                            onClick={() => showToast('Leitura da Bíblia chega numa próxima fase.')}
                                                                          >
                                                                          Ler capítulo
                                                          </button>button>
                                            </div>div>
                            </section>section>
                  
                    {/* Seu momento com Deus */}
                            <section className="card home-section">
                                        <h3 className="home-section-title">Seu momento com Deus</h3>h3>
                                        <label className="home-checkitem">
                                                      <input
                                                                        type="checkbox"
                                                                        checked={dailyProgress?.read_bible ?? false}
                                                                        onChange={() => toggleProgress('read_bible')}
                                                                      />
                                                      <span>Li a Bíblia hoje</span>span>
                                        </label>label>
                                        <label className="home-checkitem">
                                                      <input
                                                                        type="checkbox"
                                                                        checked={dailyProgress?.did_devotional ?? false}
                                                                        onChange={() => toggleProgress('did_devotional')}
                                                                      />
                                                      <span>Fiz o devocional hoje</span>span>
                                        </label>label>
                            </section>section>
                  
                    {/* Continue de onde parou */}
                    {lastRead && (
                                <section className="card home-section">
                                              <h3 className="home-section-title">Continue de onde parou</h3>h3>
                                              <div className="home-plan-title">
                                                {lastRead.book_name} {lastRead.chapter}
                                              </div>div>
                                              <button
                                                                type="button"
                                                                className="btn-primary home-verse-btn"
                                                                onClick={() => navigate(`/biblia/${lastRead.book_abbrev}/${lastRead.chapter}`)}
                                                              >
                                                              Continuar leitura
                                              </button>button>
                                </section>section>
                            )}
                  
                    {/* Próximo encontro */}
                    {nextEvent && (
                                <section className="card home-section">
                                              <h3 className="home-section-title">Próximo encontro</h3>h3>
                                              <div className="home-event-title">{nextEvent.title}</div>div>
                                              <div className="home-event-meta">{formatEventDate(nextEvent.event_date)}</div>div>
                                  {nextEvent.location && <div className="home-event-meta">{nextEvent.location}</div>div>}
                                              <div className="home-verse-actions">
                                                              <button
                                                                                  type="button"
                                                                                  className="btn-secondary home-verse-btn"
                                                                                  onClick={() => showToast('Adicionar ao calendário chega numa próxima fase.')}
                                                                                >
                                                                                Calendário
                                                              </button>button>
                                                              <button
                                                                                  type="button"
                                                                                  className="btn-secondary home-verse-btn"
                                                                                  onClick={() => showToast('Direções chegam numa próxima fase.')}
                                                                                >
                                                                                Direções
                                                              </button>button>
                                              </div>div>
                                </section>section>
                            )}
                  
                    {/* Continue sua caminhada */}
                    {plan && (
                                <section className="card home-section">
                                              <h3 className="home-section-title">Continue sua caminhada</h3>h3>
                                              <div className="home-plan-title">{plan.plan.title}</div>div>
                                              <div className="home-progress-track">
                                                              <div
                                                                                  className="home-progress-fill"
                                                                                  style={{
                                                                                                        width: `${Math.min(100, Math.round((plan.progress.current_day / plan.plan.total_days) * 100))}%`,
                                                                                    }}
                                                                                />
                                              </div>div>
                                              <div className="home-event-meta">
                                                              Dia {plan.progress.current_day} de {plan.plan.total_days}
                                              </div>div>
                                </section>section>
                            )}
                  
                    {/* Para você */}
                    {devotional && (
                                <section className="card home-section">
                                              <h3 className="home-section-title">Para você</h3>h3>
                                              <div className="home-plan-title">{devotional.title}</div>div>
                                              <p className="home-event-meta">{devotional.summary}</p>p>
                                  {devotional.duration_minutes && (
                                                  <div className="home-event-meta">{devotional.duration_minutes} min de leitura</div>div>
                                              )}
                                </section>section>
                            )}
                  
                    {/* Última mensagem */}
                    {sermon && (
                                <section className="card home-section">
                                              <h3 className="home-section-title">Última mensagem</h3>h3>
                                              <button
                                                                type="button"
                                                                className="home-sermon-thumb"
                                                                style={sermon.thumbnail_url ? { backgroundImage: `url(${sermon.thumbnail_url})` } : undefined}
                                                                onClick={() =>
                                                                                    sermon.video_url
                                                                                      ? setVideoOpen(true)
                                                                                      : showToast('Reprodução de vídeo chega numa próxima fase.')
                                                                }
                                                              >
                                                              <PlayIcon />
                                                              <span className="home-sermon-duration">{formatDuration(sermon.duration_seconds)}</span>span>
                                              </button>button>
                                              <div className="home-plan-title">{sermon.title}</div>div>
                                  {sermon.series && <div className="home-event-meta">{sermon.series}</div>div>}
                                </section>section>
                            )}
                  
                    {/* Banner de oração */}
                            <button
                                          type="button"
                                          className="home-prayer-banner"
                                          onClick={() => showToast('Envio de pedidos de oração chega numa próxima fase.')}
                                        >
                                        Podemos orar por você?
                            </button>button>
                  
                    {/* Carrossel horizontal */}
                    {events.length > 0 && (
                                <section className="home-section">
                                              <h3 className="home-section-title home-carousel-title">Acontecendo na Redenção</h3>h3>
                                              <div className="home-carousel">
                                                {events.map((ev) => (
                                                    <div key={ev.id} className="home-carousel-card">
                                                                        <div className="home-carousel-date">{formatEventDate(ev.event_date)}</div>div>
                                                                        <div className="home-carousel-event-title">{ev.title}</div>div>
                                                      {ev.location && <div className="home-carousel-location">{ev.location}</div>div>}
                                                    </div>div>
                                                  ))}
                                              </div>div>
                                </section>section>
                            )}
                  </div>div>
              )}
        
          {toast && <div className="rc-toast">{toast}</div>div>}
        
          {videoOpen && sermon?.video_url && (
                  <div className="home-video-modal" onClick={() => setVideoOpen(false)}>
                            <button
                                          type="button"
                                          className="home-video-modal-close"
                                          aria-label="Fechar"
                                          onClick={() => setVideoOpen(false)}
                                        >
                                        <CloseIcon />
                            </button>button>
                            <video
                                          className="home-video-modal-player"
                                          src={sermon.video_url}
                                          poster={sermon.thumbnail_url ?? undefined}
                                          controls
                                          autoPlay
                                          playsInline
                                          onClick={(e) => e.stopPropagation()}
                                        />
                  </div>div>
              )}
        </div>div>
      );
}

function BellIcon() {
    return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9H18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>svg>
        );
}

function PlayIcon() {
    return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
          </svg>svg>
        );
}

function CloseIcon() {
    return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>svg>
        );
}
</div>

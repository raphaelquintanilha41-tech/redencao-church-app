import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationTarget,
  type AppNotification,
} from '../lib/notifications';
import { updateAppBadge } from '../lib/push';

function formatNotifiedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export function NotificacoesScreen() {
  const navigate = useNavigate();
  // Vindo de uma notificação push: /notificacoes?abrir=<id>
  const [searchParams] = useSearchParams();
  const openId = searchParams.get('abrir');
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetchNotifications(user.id)
      .then((data) => mounted && setItems(data))
      .catch((err) => console.error('[NotificacoesScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (loading) return;
    updateAppBadge(unreadCount);
  }, [unreadCount, loading]);

  const readOne = async (n: AppNotification) => {
    if (n.read_at) return;
    try {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i)));
    } catch (err) {
      showToast(`Falha ao marcar como lida: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Tocar numa notificação: marca como lida e leva à área correspondente.
  const openNotification = (n: AppNotification, replace = false) => {
    void readOne(n);
    const target = notificationTarget(n);
    if (target) navigate(target, { replace });
  };

  // Aberta a partir do push: abre logo o destino dessa notificação.
  useEffect(() => {
    if (loading || !openId) return;
    const n = items.find((i) => i.id === openId);
    if (n) openNotification(n, true);
    else navigate('/notificacoes', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, openId]);

  const readAll = async () => {
    if (!user || unreadCount === 0) return;
    setMarking(true);
    try {
      await markAllNotificationsRead(user.id);
      setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: new Date().toISOString() })));
      showToast('Todas marcadas como lidas.');
    } catch (err) {
      showToast(`Falha ao marcar todas: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <h1 className="igreja-title">Notificações</h1>
      </header>

      {!loading && unreadCount > 0 && (
        <div className="perfil-header-actions">
          <button type="button" className="perfil-link-btn" disabled={marking} onClick={readAll}>
            {marking ? 'A marcar…' : 'Marcar todas como lidas'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : items.length === 0 ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">Ainda não há notificações. Quando houver novidades, elas aparecem aqui.</p>
        </div>
      ) : (
        items.map((n) => (
          <section
            key={n.id}
            className={`card caminhada-cell-card${n.read_at ? '' : ' biblia-tab-active'}`}
            style={{ cursor: n.read_at && !notificationTarget(n) ? 'default' : 'pointer' }}
            onClick={() => openNotification(n)}
            role={notificationTarget(n) ? 'link' : undefined}
          >
            <span className="agenda-card-category">{n.read_at ? n.title : `● ${n.title}`}</span>
            {n.body && <p className="static-body-text">{n.body}</p>}
            <span className="home-event-meta notif-meta">
              {formatNotifiedAt(n.created_at)}
              {notificationTarget(n) && <span className="notif-open">Abrir ›</span>}
            </span>
          </section>
        ))
      )}
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

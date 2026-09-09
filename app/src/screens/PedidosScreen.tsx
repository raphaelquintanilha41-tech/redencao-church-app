import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyPrayerRequests, type PrayerRequest } from '../lib/caminhada';

const STATUS_LABELS: Record<string, string> = {
  recebido: 'Recebido',
  orando: 'Orando',
  acompanhado: 'Acompanhado',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PedidosScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetchMyPrayerRequests(user.id)
      .then((data) => mounted && setItems(data))
      .catch((err) => console.error('[PedidosScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <h1 className="igreja-title">Meus pedidos de oração</h1>
      </header>
      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : items.length === 0 ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">
            Ainda não enviou nenhum pedido de oração. Toque no botão abaixo para partilhar o que está no seu coração.
          </p>
        </div>
      ) : (
        items.map((p) => (
          <section key={p.id} className="card caminhada-cell-card">
            <span className="agenda-card-category">{p.category ?? 'Geral'}</span>
            <p className="static-body-text">{p.content}</p>
            <div className="perfil-header-actions">
              <span className="home-event-meta">{formatDate(p.created_at)}</span>
              <span className="home-event-meta">Status: {STATUS_LABELS[p.status] ?? p.status}</span>
            </div>
          </section>
        ))
      )}
      <button type="button" className="btn-primary agenda-cta" onClick={() => navigate('/preciso-de-oracao')}>
        + Novo pedido de oração
      </button>
    </div>
  );
}

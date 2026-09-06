import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchReadingHistory, type ReadingHistoryItem } from '../lib/bible';

function formatReadAt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function HistoricoScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetchReadingHistory(user.id)
      .then((data) => mounted && setItems(data))
      .catch((err) => console.error('[HistoricoScreen] falha ao carregar:', err))
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
        <h1 className="igreja-title">Histórico</h1>
      </header>
      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : items.length === 0 ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">
            Ainda não há histórico de leitura. Assim que você abrir um capítulo da Bíblia, ele aparece aqui.
          </p>
        </div>
      ) : (
        <div className="biblia-book-list">
          {items.map((h) => (
            <button
              key={h.id}
              type="button"
              className="biblia-book-row"
              onClick={() => navigate(`/biblia/${h.book_abbrev}/${h.chapter}`)}
            >
              <span className="biblia-book-name">
                {h.book_name} {h.chapter}
              </span>
              <span className="biblia-book-meta">{formatReadAt(h.read_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

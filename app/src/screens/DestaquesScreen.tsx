import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchHighlights, removeHighlight, type HighlightedVerse } from '../lib/bible';

export function DestaquesScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<HighlightedVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetchHighlights(user.id)
      .then((data) => mounted && setItems(data))
      .catch((err) => console.error('[DestaquesScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  const remove = async (verseId: number) => {
    if (!user) return;
    setBusyId(verseId);
    try {
      await removeHighlight(user.id, verseId);
      setItems((prev) => prev.filter((v) => v.id !== verseId));
      showToast('Destaque removido.');
    } catch (err) {
      showToast(`Falha ao remover: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <h1 className="igreja-title">Destaques</h1>
      </header>
      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : items.length === 0 ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">
            Ainda não tem versículos destacados. Abra um capítulo na Bíblia, selecione um versículo e toque numa cor
            para destacar.
          </p>
        </div>
      ) : (
        items.map((v) => (
          <section key={v.id} className="card caminhada-cell-card">
            <span className="agenda-card-category">
              <span
                className="biblia-color-swatch biblia-color-swatch-inline"
                style={{ background: v.highlight_color }}
                aria-hidden="true"
              />{' '}
              {v.book_name} {v.chapter}:{v.verse}
            </span>
            <p className="static-body-text">{v.text}</p>
            <div className="perfil-header-actions">
              <button
                type="button"
                className="perfil-link-btn"
                onClick={() => navigate(`/biblia/${v.book_abbrev}/${v.chapter}`)}
              >
                Ler capítulo
              </button>
              <button type="button" className="perfil-link-btn" disabled={busyId === v.id} onClick={() => remove(v.id)}>
                Remover
              </button>
            </div>
          </section>
        ))
      )}
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteNote, fetchNotes, type NoteWithVerse } from '../lib/bible';

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function NotasScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<NoteWithVerse[]>([]);
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
    fetchNotes(user.id)
      .then((data) => mounted && setItems(data))
      .catch((err) => console.error('[NotasScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  const remove = async (verseId: number) => {
    if (!user) return;
    setBusyId(verseId);
    try {
      await deleteNote(user.id, verseId);
      setItems((prev) => prev.filter((v) => v.id !== verseId));
      showToast('Nota removida.');
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
        <h1 className="igreja-title">Notas</h1>
      </header>
      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : items.length === 0 ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">
            Ainda não tem notas. Abra um capítulo na Bíblia, selecione um versículo e toque em "Nota" para escrever a
            primeira.
          </p>
        </div>
      ) : (
        items.map((v) => (
          <section key={v.id} className="card caminhada-cell-card">
            <span className="agenda-card-category">
              {v.book_name} {v.chapter}:{v.verse}
            </span>
            <p className="static-body-text">"{v.text}"</p>
            <p className="static-body-text">{v.note_content}</p>
            <div className="home-event-meta">Atualizado em {formatUpdatedAt(v.note_updated_at)}</div>
            <div className="perfil-header-actions">
              <button
                type="button"
                className="perfil-link-btn"
                onClick={() => navigate(`/biblia/${v.book_abbrev}/${v.chapter}`)}
              >
                Abrir capítulo
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

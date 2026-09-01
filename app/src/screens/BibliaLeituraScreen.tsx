import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAvailableChapters, fetchBookByAbbrev, fetchChapter } from '../lib/bible';
import { markTodayProgress } from '../lib/home';
import { getBibleFontSize, setBibleFontSize } from '../lib/preferences';
import type { BibleBook, BibleVerse } from '../lib/types';

const HIGHLIGHT_COLORS = ['#D6B473', '#8FBF8F', '#8FB4D9', '#D98F8F', '#C79ED9'];

export function BibliaLeituraScreen() {
  const { bookAbbrev = '', chapter: chapterParam = '1' } = useParams();
  const chapter = parseInt(chapterParam, 10) || 1;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState<BibleBook | null>(null);
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSizeState] = useState(getBibleFontSize);
  const setFontSize = (updater: number | ((s: number) => number)) => {
    setFontSizeState((prev) => {
      const next = typeof updater === 'function' ? (updater as (s: number) => number)(prev) : updater;
      setBibleFontSize(next);
      return next;
    });
  };
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setSelectedVerse(null);
    fetchBookByAbbrev(bookAbbrev)
      .then(async (b) => {
        if (!mounted || !b) return;
        setBook(b);
        const chapters = await fetchAvailableChapters(b.id);
        if (!mounted) return;
        setAvailableChapters(chapters);
        if (chapters.includes(chapter)) {
          const v = await fetchChapter(b.id, chapter);
          if (mounted) setVerses(v);
        } else {
          setVerses([]);
        }
      })
      .catch((err) => console.error('[BibliaLeitura] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [bookAbbrev, chapter]);

  const markChapterRead = async () => {
    if (!user) return;
    try {
      await markTodayProgress(user.id, { read_bible: true });
      showToast('Capítulo marcado como lido.');
    } catch (err) {
      showToast(`Falha ao marcar: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const copyVerse = (v: BibleVerse) => {
    const ref = `${book?.name} ${v.chapter}:${v.verse}`;
    const content = `"${v.text.trim()}" — ${ref}`;
    navigator.clipboard
      ?.writeText(content)
      .then(() => showToast('Versículo copiado.'))
      .catch(() => showToast('Não foi possível copiar.'));
    setSelectedVerse(null);
  };

  const shareVerse = async (v: BibleVerse) => {
    const ref = `${book?.name} ${v.chapter}:${v.verse}`;
    const content = `"${v.text.trim()}" — ${ref}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
      } catch {
        // usuário cancelou o compartilhamento — sem ação necessária.
      }
    } else {
      navigator.clipboard?.writeText(content);
      showToast('Compartilhamento não suportado aqui — copiado para a área de transferência.');
    }
    setSelectedVerse(null);
  };

  if (loading) {
    return <div className="biblia-leitura-screen biblia-loading-msg">A carregar…</div>;
  }

  if (!book) {
    return (
      <div className="biblia-leitura-screen">
        <p className="home-event-meta">Livro "{bookAbbrev}" não encontrado.</p>
        <button type="button" className="btn-secondary" onClick={() => navigate('/biblia')}>
          Voltar ao índice
        </button>
      </div>
    );
  }

  const chapterAvailable = availableChapters.includes(chapter);

  return (
    <div className="biblia-leitura-screen">
      <header className="biblia-leitura-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/biblia')}>
          ← Bíblia
        </button>
        <div className="biblia-leitura-title">
          {book.name} {chapter}
        </div>
        <div className="biblia-font-controls">
          <button type="button" onClick={() => setFontSize((s) => Math.max(14, s - 1))} aria-label="Diminuir fonte">
            A-
          </button>
          <button type="button" onClick={() => setFontSize((s) => Math.min(26, s + 1))} aria-label="Aumentar fonte">
            A+
          </button>
        </div>
      </header>

      {availableChapters.length > 0 && (
        <div className="biblia-chapter-strip">
          {availableChapters.map((c) => (
            <button
              key={c}
              type="button"
              className={`biblia-chapter-chip${c === chapter ? ' biblia-chapter-chip-active' : ''}`}
              onClick={() => navigate(`/biblia/${bookAbbrev}/${c}`)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {!chapterAvailable ? (
        <div className="biblia-chapter-missing">
          <p>
            O texto de {book.name} {chapter} ainda não foi importado — a importação da Bíblia está em andamento.
          </p>
          {availableChapters.length > 0 && (
            <p className="home-event-meta">
              Capítulos já disponíveis de {book.name}: {availableChapters.join(', ')}.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="biblia-verses" style={{ fontSize }}>
            {verses.map((v) => (
              <span
                key={v.id}
                className={`biblia-verse${selectedVerse === v.id ? ' biblia-verse-selected' : ''}`}
                onClick={() => setSelectedVerse(selectedVerse === v.id ? null : v.id)}
              >
                <sup className="biblia-verse-num">{v.verse}</sup>
                {v.text}{' '}
              </span>
            ))}
          </div>
          <button type="button" className="btn-primary biblia-mark-read-btn" onClick={markChapterRead}>
            Marcar capítulo como lido
          </button>
        </>
      )}

      {selectedVerse && (
        <div className="biblia-action-bar">
          <div className="biblia-color-swatches">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="biblia-color-swatch"
                style={{ background: c }}
                aria-label="Destacar"
                onClick={() => showToast('Destaques chegam numa próxima fase.')}
              />
            ))}
          </div>
          <div className="biblia-action-buttons">
            <button type="button" onClick={() => showToast('Favoritos chegam numa próxima fase.')}>
              Favoritar
            </button>
            <button type="button" onClick={() => showToast('Notas chegam numa próxima fase.')}>
              Nota
            </button>
            <button
              type="button"
              onClick={() => {
                const v = verses.find((v) => v.id === selectedVerse);
                if (v) copyVerse(v);
              }}
            >
              Copiar
            </button>
            <button
              type="button"
              onClick={() => {
                const v = verses.find((v) => v.id === selectedVerse);
                if (v) shareVerse(v);
              }}
            >
              Compartilhar
            </button>
          </div>
        </div>
      )}

      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  addFavorite,
  deleteNote,
  fetchAvailableChapters,
  fetchBookByAbbrev,
  fetchChapter,
  fetchFavoritedVerseIds,
  fetchHighlightedVerseColors,
  fetchNote,
  fetchNotedVerseIds,
  logReadingHistory,
  removeFavorite,
  removeHighlight,
  saveNote,
  setHighlight,
} from '../lib/bible';
import { markTodayProgress } from '../lib/home';
import { getBibleFontSize, setBibleFontSize } from '../lib/preferences';
import { buildPassageFiles, passageReference, passageToText, sharePassage } from '../lib/share-card';
import type { ScripturePassage } from '../lib/share-card';
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
  // Vários versículos podem ser selecionados (toque para marcar/desmarcar).
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sharing, setSharing] = useState(false);
  // Imagens geradas com antecedência: o iPhone só aceita a partilha se ela
  // começar logo após o toque, sem esperar pelo desenho das imagens.
  const prebuiltRef = useRef<{ key: string; files: File[] } | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());
  const [notedIds, setNotedIds] = useState<Set<number>>(new Set());
  const [highlightedColors, setHighlightedColors] = useState<Map<number, string>>(new Map());
  const [noteEditorVerse, setNoteEditorVerse] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setSelectedIds(new Set());
    setNoteEditorVerse(null);
    setNoteDraft('');
    setFavoritedIds(new Set());
    setNotedIds(new Set());
    setHighlightedColors(new Map());
    fetchBookByAbbrev(bookAbbrev)
      .then(async (b) => {
        if (!mounted || !b) return;
        setBook(b);
        const chapters = await fetchAvailableChapters(b.id);
        if (!mounted) return;
        setAvailableChapters(chapters);
        if (chapters.includes(chapter)) {
          const v = await fetchChapter(b.id, chapter);
          if (!mounted) return;
          setVerses(v);
          if (user) {
            const verseIds = v.map((verse) => verse.id);
            const [favIds, noteIds, highlightColors] = await Promise.all([
              fetchFavoritedVerseIds(user.id, verseIds),
              fetchNotedVerseIds(user.id, verseIds),
              fetchHighlightedVerseColors(user.id, verseIds),
            ]);
            if (mounted) {
              setFavoritedIds(favIds);
              setNotedIds(noteIds);
              setHighlightedColors(highlightColors);
            }
            logReadingHistory(user.id, b.id, chapter).catch((err) =>
              console.error('[BibliaLeitura] falha ao registar histórico:', err),
            );
          }
        } else {
          setVerses([]);
        }
      })
      .catch((err) => console.error('[BibliaLeitura] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // Depender de `user?.id` (e não do objeto `user`): cada refresh de token cria
    // um novo objeto e recarregava o capítulo, limpava a seleção e duplicava o
    // registo em reading_history.
  }, [bookAbbrev, chapter, user?.id]);

  const toggleFavorite = async (verseId: number) => {
    if (!user) return;
    const wasFavorited = favoritedIds.has(verseId);
    try {
      if (wasFavorited) {
        await removeFavorite(user.id, verseId);
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          next.delete(verseId);
          return next;
        });
        showToast('Removido dos favoritos.');
      } else {
        await addFavorite(user.id, verseId);
        setFavoritedIds((prev) => new Set(prev).add(verseId));
        showToast('Adicionado aos favoritos.');
      }
    } catch (err) {
      showToast(`Falha ao favoritar: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const toggleHighlight = async (verseId: number, color: string) => {
    if (!user) return;
    const wasSameColor = highlightedColors.get(verseId) === color;
    try {
      if (wasSameColor) {
        await removeHighlight(user.id, verseId);
        setHighlightedColors((prev) => {
          const next = new Map(prev);
          next.delete(verseId);
          return next;
        });
        showToast('Destaque removido.');
      } else {
        await setHighlight(user.id, verseId, color);
        setHighlightedColors((prev) => new Map(prev).set(verseId, color));
        showToast('Versículo destacado.');
      }
    } catch (err) {
      showToast(`Falha ao destacar: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const openNoteEditor = async (verseId: number) => {
    setNoteEditorVerse(verseId);
    setNoteDraft('');
    if (!user) return;
    try {
      const note = await fetchNote(user.id, verseId);
      setNoteDraft(note?.content ?? '');
    } catch (err) {
      showToast(`Falha ao carregar nota: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const closeNoteEditor = () => {
    setNoteEditorVerse(null);
    setNoteDraft('');
  };

  const submitNote = async (verseId: number) => {
    if (!user) return;
    setSavingNote(true);
    try {
      await saveNote(user.id, verseId, noteDraft);
      const hasContent = noteDraft.trim().length > 0;
      setNotedIds((prev) => {
        const next = new Set(prev);
        if (hasContent) next.add(verseId);
        else next.delete(verseId);
        return next;
      });
      showToast(hasContent ? 'Nota guardada.' : 'Nota removida.');
      closeNoteEditor();
    } catch (err) {
      showToast(`Falha ao guardar nota: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingNote(false);
    }
  };

  const removeNoteForVerse = async (verseId: number) => {
    if (!user) return;
    setSavingNote(true);
    try {
      await deleteNote(user.id, verseId);
      setNotedIds((prev) => {
        const next = new Set(prev);
        next.delete(verseId);
        return next;
      });
      showToast('Nota removida.');
      closeNoteEditor();
    } catch (err) {
      showToast(`Falha ao remover nota: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingNote(false);
    }
  };

  const markChapterRead = async () => {
    if (!user) return;
    try {
      await markTodayProgress(user.id, { read_bible: true });
      showToast('Capítulo marcado como lido.');
    } catch (err) {
      showToast(`Falha ao marcar: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const selectedVerses = useMemo(
    () => verses.filter((v) => selectedIds.has(v.id)),
    [verses, selectedIds],
  );
  const singleSelected = selectedVerses.length === 1 ? selectedVerses[0].id : null;

  const toggleSelect = (verseId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(verseId)) next.delete(verseId);
      else next.add(verseId);
      return next;
    });
    setNoteEditorVerse(null);
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setNoteEditorVerse(null);
  };
  const selectAll = () => setSelectedIds(new Set(verses.map((v) => v.id)));

  const toPassage = (list: BibleVerse[]): ScripturePassage => ({
    bookName: book?.name ?? '',
    chapter,
    verses: list.map((v) => ({ verse: v.verse, text: v.text })),
  });
  const passageKey = (list: BibleVerse[]) => `${book?.id}:${chapter}:${list.map((v) => v.id).join(',')}`;

  // Prepara as imagens da seleção atual (ou do capítulo inteiro) em segundo plano.
  const prebuild = (list: BibleVerse[]) => {
    if (!book || list.length === 0) return;
    const key = passageKey(list);
    if (prebuiltRef.current?.key === key) return;
    buildPassageFiles(toPassage(list))
      .then((files) => {
        prebuiltRef.current = { key, files };
      })
      .catch(() => {
        /* gera no momento da partilha */
      });
  };
  useEffect(() => {
    const list = selectedVerses.length ? selectedVerses : verses;
    const t = window.setTimeout(() => prebuild(list), 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVerses, verses, book?.id, chapter]);

  const sharePassageOf = async (list: BibleVerse[]) => {
    if (!book || list.length === 0 || sharing) return;
    const key = passageKey(list);
    const ready = prebuiltRef.current?.key === key ? prebuiltRef.current.files : null;
    setSharing(true);
    if (!ready) showToast('A preparar as imagens…');
    try {
      let files = ready;
      if (!files) {
        files = await buildPassageFiles(toPassage(list));
        prebuiltRef.current = { key, files };
      }
      const outcome = await sharePassage(toPassage(list), files, !ready);
      if (outcome === 'retry') showToast('Imagens prontas — toque de novo em Compartilhar.');
      else if (outcome === 'copied') showToast('Texto copiado — cole no WhatsApp.');
      else if (outcome === 'failed') showToast('Não foi possível compartilhar neste aparelho.');
      else if (outcome === 'shared') clearSelection();
    } catch (err) {
      showToast(`Falha ao compartilhar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSharing(false);
    }
  };

  const copySelection = () => {
    if (selectedVerses.length === 0) return;
    const content = passageToText(toPassage(selectedVerses));
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(content)
        .then(() => showToast(selectedVerses.length > 1 ? 'Versículos copiados.' : 'Versículo copiado.'))
        .catch(() => showToast('Não foi possível copiar.'));
    } else {
      showToast('Não foi possível copiar neste navegador.');
    }
  };

  // Destacar / favoritar aplicam-se a todos os versículos selecionados.
  const highlightSelection = async (color: string) => {
    const allSame = selectedVerses.every((v) => highlightedColors.get(v.id) === color);
    for (const v of selectedVerses) {
      const has = highlightedColors.get(v.id) === color;
      if (allSame || !has) await toggleHighlight(v.id, color);
    }
  };
  const allFavorited = selectedVerses.length > 0 && selectedVerses.every((v) => favoritedIds.has(v.id));
  const favoriteSelection = async () => {
    for (const v of selectedVerses) {
      if (allFavorited || !favoritedIds.has(v.id)) await toggleFavorite(v.id);
    }
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
            Não encontramos o texto de {book.name} {chapter}.
          </p>
          {availableChapters.length > 0 && (
            <p className="home-event-meta">
              Capítulos disponíveis de {book.name}: {availableChapters.join(', ')}.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="biblia-verses" style={{ fontSize }}>
            {verses.map((v) => (
              <span
                key={v.id}
                className={`biblia-verse${selectedIds.has(v.id) ? ' biblia-verse-selected' : ''}${highlightedColors.has(v.id) ? ' biblia-verse-highlighted' : ''}`}
                style={highlightedColors.has(v.id) ? { backgroundColor: highlightedColors.get(v.id) } : undefined}
                onClick={() => toggleSelect(v.id)}
              >
                <sup className="biblia-verse-num">
                  {v.verse}
                  {favoritedIds.has(v.id) ? ' ★' : ''}
                  {notedIds.has(v.id) ? ' ✎' : ''}
                </sup>
                {v.text}{' '}
              </span>
            ))}
          </div>
          <div className="biblia-chapter-actions">
            <button type="button" className="btn-primary biblia-mark-read-btn" onClick={markChapterRead}>
              Marcar capítulo como lido
            </button>
            <button
              type="button"
              className="btn-secondary biblia-share-chapter-btn"
              onClick={() => sharePassageOf(verses)}
              disabled={sharing || verses.length === 0}
            >
              {sharing && selectedVerses.length === 0 ? 'A preparar…' : `Compartilhar ${book.name} ${chapter} inteiro`}
            </button>
          </div>
        </>
      )}

      {singleSelected !== null && noteEditorVerse === singleSelected && (
        <div className="biblia-action-bar">
          <div className="biblia-note-editor">
            <textarea
              className="biblia-note-textarea"
              rows={3}
              placeholder="Escreva sua nota sobre este versículo…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              autoFocus
            />
            <div className="biblia-note-editor-actions">
              <button type="button" onClick={closeNoteEditor} disabled={savingNote}>
                Cancelar
              </button>
              {notedIds.has(singleSelected) && (
                <button type="button" onClick={() => removeNoteForVerse(singleSelected)} disabled={savingNote}>
                  Excluir
                </button>
              )}
              <button type="button" onClick={() => submitNote(singleSelected)} disabled={savingNote}>
                {savingNote ? 'A guardar…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVerses.length > 0 && noteEditorVerse === null && (
        <div className="biblia-action-bar">
          <div className="biblia-selection-head">
            <span className="biblia-selection-ref">
              {passageReference(toPassage(selectedVerses))}
              <small>
                {selectedVerses.length === 1 ? '1 versículo' : `${selectedVerses.length} versículos`} · toque noutros para juntar
              </small>
            </span>
            <span className="biblia-selection-links">
              {selectedVerses.length < verses.length && (
                <button type="button" onClick={selectAll}>
                  Todos
                </button>
              )}
              <button type="button" onClick={clearSelection} aria-label="Limpar seleção">
                ✕
              </button>
            </span>
          </div>
          <div className="biblia-color-swatches">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`biblia-color-swatch${selectedVerses.every((v) => highlightedColors.get(v.id) === c) ? ' biblia-color-swatch-active' : ''}`}
                style={{ background: c }}
                aria-label="Destacar"
                onClick={() => highlightSelection(c)}
              />
            ))}
          </div>
          <div className="biblia-action-buttons">
            <button type="button" className={allFavorited ? 'biblia-action-active' : ''} onClick={favoriteSelection}>
              {allFavorited ? '★ Favoritado' : 'Favoritar'}
            </button>
            {singleSelected !== null && (
              <button
                type="button"
                className={notedIds.has(singleSelected) ? 'biblia-action-active' : ''}
                onClick={() => openNoteEditor(singleSelected)}
              >
                {notedIds.has(singleSelected) ? 'Editar nota' : 'Nota'}
              </button>
            )}
            <button type="button" onClick={copySelection}>
              Copiar
            </button>
            <button
              type="button"
              className="biblia-action-share"
              onClick={() => sharePassageOf(selectedVerses)}
              disabled={sharing}
            >
              {sharing ? 'A preparar…' : 'Compartilhar'}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

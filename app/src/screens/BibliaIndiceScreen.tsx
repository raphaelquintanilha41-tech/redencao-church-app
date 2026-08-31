import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBooks, searchVerses } from '../lib/bible';
import type { BibleBook } from '../lib/types';
import type { VerseSearchResult } from '../lib/bible';

export function BibliaIndiceScreen() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [tab, setTab] = useState<'VT' | 'NT'>('VT');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VerseSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchBooks()
      .then((b) => mounted && setBooks(b))
      .catch((err) => console.error('[BibliaIndice] falha ao carregar livros:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchVerses(trimmed)
        .then((r) => !cancelled && setResults(r))
        .catch((err) => {
          console.error('[BibliaIndice] busca falhou:', err);
          if (!cancelled) setResults([]);
        })
        .finally(() => !cancelled && setSearching(false));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const filteredBooks = useMemo(() => books.filter((b) => b.testament === tab), [books, tab]);

  return (
    <div className="biblia-index-screen">
      <header className="biblia-index-header">
        <h1 className="igreja-title">Bíblia</h1>
      </header>

      <input
        type="search"
        className="biblia-search-input"
        placeholder="Buscar palavra ou versículo…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query.trim() ? (
        <div className="biblia-search-results">
          {searching && <p className="home-event-meta">A buscar…</p>}
          {!searching && results && results.length === 0 && (
            <p className="home-event-meta">Nenhum resultado para "{query}".</p>
          )}
          {!searching &&
            results?.map((r) => (
              <button
                key={r.id}
                type="button"
                className="biblia-search-result"
                onClick={() => navigate(`/biblia/${r.book_abbrev}/${r.chapter}`)}
              >
                <span className="biblia-search-ref">
                  {r.book_name} {r.chapter}:{r.verse}
                </span>
                <span className="biblia-search-snippet">{r.text}</span>
              </button>
            ))}
        </div>
      ) : (
        <>
          <div className="biblia-tabs">
            <button
              type="button"
              className={`biblia-tab${tab === 'VT' ? ' biblia-tab-active' : ''}`}
              onClick={() => setTab('VT')}
            >
              Antigo Testamento
            </button>
            <button
              type="button"
              className={`biblia-tab${tab === 'NT' ? ' biblia-tab-active' : ''}`}
              onClick={() => setTab('NT')}
            >
              Novo Testamento
            </button>
          </div>

          {loading ? (
            <p className="home-event-meta biblia-loading-msg">A carregar…</p>
          ) : (
            <div className="biblia-book-list">
              {filteredBooks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="biblia-book-row"
                  onClick={() => navigate(`/biblia/${b.abbrev}/1`)}
                >
                  <span className="biblia-book-name">{b.name}</span>
                  <span className="biblia-book-meta">{b.chapter_count} capítulos</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

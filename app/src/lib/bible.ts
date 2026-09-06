import { supabase } from './supabaseClient';
import type { BibleBook, BibleNote, BibleVerse } from './types';

export async function fetchBooks(): Promise<BibleBook[]> {
  const { data, error } = await supabase.from('bible_books').select('*').order('position');
  if (error) throw error;
  return (data ?? []) as BibleBook[];
}

export interface VerseSearchResult extends BibleVerse {
  book_name: string;
  book_abbrev: string;
}

export async function searchVerses(query: string, limit = 30): Promise<VerseSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*, bible_books(name, abbrev)')
    .textSearch('text', trimmed, { type: 'websearch', config: 'portuguese' })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    book_name: row.bible_books?.name ?? '',
    book_abbrev: row.bible_books?.abbrev ?? '',
  }));
}

/**
 * Capítulos que já têm texto importado para um livro. A Bíblia completa
 * (66 livros, Almeida 1911) já foi importada, mas seguimos consultando
 * bible_verses diretamente em vez de confiar só em bible_books.chapter_count,
 * para não depender de manter as duas fontes sincronizadas.
 */
export async function fetchAvailableChapters(bookId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('chapter')
    .eq('book_id', bookId);
  if (error) throw error;
  const set = new Set((data ?? []).map((r: { chapter: number }) => r.chapter));
  return Array.from(set).sort((a, b) => a - b);
}

export async function fetchChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .order('verse');
  if (error) throw error;
  return (data ?? []) as BibleVerse[];
}

export async function fetchBookByAbbrev(abbrev: string): Promise<BibleBook | null> {
  const { data, error } = await supabase
    .from('bible_books')
    .select('*')
    .eq('abbrev', abbrev)
    .maybeSingle();
  if (error) throw error;
  return data as BibleBook | null;
}

// ── Favoritos ──────────────────────────────────────────────────────────

export async function fetchFavoritedVerseIds(userId: string, verseIds: number[]): Promise<Set<number>> {
  if (verseIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('favorites')
    .select('verse_id')
    .eq('user_id', userId)
    .in('verse_id', verseIds);
  if (error) throw error;
  return new Set((data ?? []).map((r: { verse_id: number }) => r.verse_id));
}

export async function fetchNotedVerseIds(userId: string, verseIds: number[]): Promise<Set<number>> {
  if (verseIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('bible_notes')
    .select('verse_id')
    .eq('user_id', userId)
    .in('verse_id', verseIds);
  if (error) throw error;
  return new Set((data ?? []).map((r: { verse_id: number }) => r.verse_id));
}

export async function addFavorite(userId: string, verseId: number): Promise<void> {
  const { error } = await supabase.from('favorites').insert({ user_id: userId, verse_id: verseId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, verseId: number): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('verse_id', verseId);
  if (error) throw error;
}

export interface FavoriteVerse extends BibleVerse {
  book_name: string;
  book_abbrev: string;
  favorited_at: string;
}

export async function fetchFavorites(userId: string): Promise<FavoriteVerse[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('created_at, bible_verses(*, bible_books(name, abbrev))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((row: any) => row.bible_verses)
    .map((row: any) => ({
      ...row.bible_verses,
      book_name: row.bible_verses.bible_books?.name ?? '',
      book_abbrev: row.bible_verses.bible_books?.abbrev ?? '',
      favorited_at: row.created_at,
    }));
}

// ── Notas ───────────────────────────────────────────────────────

export async function fetchNote(userId: string, verseId: number): Promise<BibleNote | null> {
  const { data, error } = await supabase
    .from('bible_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('verse_id', verseId)
    .maybeSingle();
  if (error) throw error;
  return data as BibleNote | null;
}

export async function saveNote(userId: string, verseId: number, content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) {
    await deleteNote(userId, verseId);
    return;
  }
  const { error } = await supabase
    .from('bible_notes')
    .upsert(
      { user_id: userId, verse_id: verseId, content: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,verse_id' },
    );
  if (error) throw error;
}

export async function deleteNote(userId: string, verseId: number): Promise<void> {
  const { error } = await supabase.from('bible_notes').delete().eq('user_id', userId).eq('verse_id', verseId);
  if (error) throw error;
}

export interface NoteWithVerse extends BibleVerse {
  book_name: string;
  book_abbrev: string;
  note_content: string;
  note_updated_at: string;
}

export async function fetchNotes(userId: string): Promise<NoteWithVerse[]> {
  const { data, error } = await supabase
    .from('bible_notes')
    .select('content, updated_at, bible_verses(*, bible_books(name, abbrev))')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((row: any) => row.bible_verses)
    .map((row: any) => ({
      ...row.bible_verses,
      book_name: row.bible_verses.bible_books?.name ?? '',
      book_abbrev: row.bible_verses.bible_books?.abbrev ?? '',
      note_content: row.content,
      note_updated_at: row.updated_at,
    }));
}

// ── Histórico de leitura ─────────────────────────────────────────────

export async function logReadingHistory(userId: string, bookId: number, chapter: number): Promise<void> {
  const { error } = await supabase.from('reading_history').insert({ user_id: userId, book_id: bookId, chapter });
  if (error) throw error;
}

export interface ReadingHistoryItem {
  id: string;
  book_id: number;
  book_name: string;
  book_abbrev: string;
  chapter: number;
  read_at: string;
}

function mapHistoryRow(row: any): ReadingHistoryItem {
  return {
    id: row.id,
    book_id: row.book_id,
    book_name: row.bible_books?.name ?? '',
    book_abbrev: row.bible_books?.abbrev ?? '',
    chapter: row.chapter,
    read_at: row.read_at,
  };
}

export async function fetchLastRead(userId: string): Promise<ReadingHistoryItem | null> {
  const { data, error } = await supabase
    .from('reading_history')
    .select('id, book_id, chapter, read_at, bible_books(name, abbrev)')
    .eq('user_id', userId)
    .order('read_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapHistoryRow(data) : null;
}

/**
 * Histórico de leitura, sem capítulos repetidos: mantemos só a leitura
 * mais recente de cada capítulo. Buscamos uma margem maior de linhas
 * (limit * 4) porque cada reabertura do mesmo capítulo gera uma linha nova.
 */
export async function fetchReadingHistory(userId: string, limit = 50): Promise<ReadingHistoryItem[]> {
  const { data, error } = await supabase
    .from('reading_history')
    .select('id, book_id, chapter, read_at, bible_books(name, abbrev)')
    .eq('user_id', userId)
    .order('read_at', { ascending: false })
    .limit(limit * 4);
  if (error) throw error;
  const seen = new Set<string>();
  const result: ReadingHistoryItem[] = [];
  for (const row of (data ?? []) as any[]) {
    const key = `${row.book_id}:${row.chapter}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(mapHistoryRow(row));
    if (result.length >= limit) break;
  }
  return result;
}

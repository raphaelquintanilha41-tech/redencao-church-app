import { supabase } from './supabaseClient';
import type { BibleBook, BibleVerse } from './types';

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
 * Capítulos que já têm texto importado para um livro. A importação da
 * Bíblia ainda está em andamento (ver README do projeto) — por isso não
 * confiamos apenas em bible_books.chapter_count, e sim no que existe de
 * verdade em bible_verses.
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

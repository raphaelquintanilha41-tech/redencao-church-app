import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { localDateKey } from '../lib/dates';
import { resolveDailyVerseRef, type ResolvedDailyVerse } from '../lib/home';
import { versesParam, type ScripturePassage } from '../lib/share-card';
import type { DailyVerse, Devotional } from '../lib/types';
import { PassageShareSheet } from './PassageShareSheet';

/**
 * Palavra do dia de uma data concreta (aberta a partir da notificação):
 * versículo + devocional "Para você" desse dia.
 * Rota: /palavra-do-dia/AAAA-MM-DD (sem data = hoje).
 */
export function PalavraDoDiaScreen() {
  const { date: dateParam } = useParams();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? '') ? (dateParam as string) : localDateKey();
  const navigate = useNavigate();

  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [verseRef, setVerseRef] = useState<ResolvedDailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [passage, setPassage] = useState<ScripturePassage | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      supabase.from('daily_verses').select('*').eq('active_date', date).maybeSingle(),
      supabase.from('devotionals').select('*').eq('active_date', date).maybeSingle(),
    ])
      .then(async ([v, d]) => {
        if (!alive) return;
        const dv = (v.data as DailyVerse | null) ?? null;
        setVerse(dv);
        setDevotional((d.data as Devotional | null) ?? null);
        if (dv) {
          const ref = await resolveDailyVerseRef(dv).catch(() => null);
          if (alive) setVerseRef(ref);
        }
      })
      .catch((err) => console.error('[PalavraDoDia] falha ao carregar:', err))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [date]);

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const readChapter = () => {
    if (!verseRef) return;
    navigate(
      `/biblia/${verseRef.bookAbbrev}/${verseRef.chapter}?v=${versesParam(verseRef.verses.map((v) => v.verse))}`,
    );
  };

  const share = () => {
    if (!verseRef) return;
    setPassage({
      bookName: verseRef.bookName,
      chapter: verseRef.chapter,
      verses: verseRef.verses,
      url: `${window.location.origin}/biblia/${verseRef.bookAbbrev}/${verseRef.chapter}?v=${versesParam(
        verseRef.verses.map((v) => v.verse),
      )}`,
    });
  };

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button
          type="button"
          className="biblia-back-btn"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        >
          ← Voltar
        </button>
        <h1 className="igreja-title">Palavra do dia</h1>
        <p className="home-event-meta palavra-dia-date">{dateLabel}</p>
      </header>

      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : !verse && !devotional ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">Não encontrámos a Palavra deste dia.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/')}>
            Ir para o Início
          </button>
        </div>
      ) : (
        <>
          {verse && (
            <section className="card-navy home-verse-card">
              <div className="home-verse-header">
                <span className="home-verse-kicker">PALAVRA DO DIA</span>
              </div>
              <p className="home-verse-text">"{verse.text}"</p>
              <span className="home-verse-ref">{verse.reference}</span>
              <div className="home-verse-actions">
                <button type="button" className="btn-secondary home-verse-btn" onClick={share} disabled={!verseRef}>
                  Compartilhar
                </button>
                <button type="button" className="btn-primary home-verse-btn" onClick={readChapter} disabled={!verseRef}>
                  Ler capítulo
                </button>
              </div>
            </section>
          )}

          {devotional && (
            <section className="card palavra-dia-devotional">
              <span className="home-verse-kicker">PARA VOCÊ</span>
              <h2 className="home-devotional-modal-title">{devotional.title}</h2>
              {(devotional.author || devotional.duration_minutes) && (
                <div className="home-event-meta">
                  {devotional.author}
                  {devotional.author && devotional.duration_minutes ? ' · ' : ''}
                  {devotional.duration_minutes ? `${devotional.duration_minutes} min de leitura` : ''}
                </div>
              )}
              <div className="home-devotional-modal-body">
                {(devotional.content ?? devotional.summary)
                  .split(/\n{2,}/)
                  .filter((p) => p.trim().length > 0)
                  .map((p, i) => (
                    <p key={i}>{p.trim()}</p>
                  ))}
              </div>
            </section>
          )}
        </>
      )}

      {passage && <PassageShareSheet passage={passage} onClose={() => setPassage(null)} onToast={showToast} />}
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

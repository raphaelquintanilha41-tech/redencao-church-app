// Destaque de abertura: um cartaz que aparece sempre que a app é aberta (ou
// volta ao ecrã depois de uns minutos em segundo plano), até à data do evento.
// Para trocar ou retirar o destaque, basta editar HIGHLIGHT.
//
// Vive ao nível da app (App.tsx) e não num ecrã: antes estava dentro da página
// inicial e perdia-se quando esse ecrã era montado de novo durante a abertura,
// ou quando a app abria noutro ecrã (ex.: a partir de uma notificação).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ImageViewer } from './ImageViewer';

const HIGHLIGHT = {
  image: '/aniversario-2-anos.jpg',
  title: 'Festividade de 2 anos de igreja',
  /** Deixa de aparecer a partir deste momento (hora local do aparelho). */
  until: new Date(2026, 10, 29, 14, 0, 0),
  shareText:
    '🎉 *Festividade de 2 anos — Redenção Church*\n' +
    'Domingo, 29 de novembro, às 10h\n' +
    '📍 Beco do Caetaninho 9, Carnaxide\n\n' +
    'Celebrando o que Deus tem feito e o que ainda vai fazer! Venha celebrar connosco.',
};

/** Volta a aparecer se a app esteve fora do ecrã pelo menos este tempo. */
const REOPEN_AFTER_MS = 3 * 60 * 1000;
/** Ecrãs onde o cartaz não deve interromper. */
const QUIET_ROUTES = ['/auth', '/onboarding', '/forgot-password', '/reset-password', '/oracao-guiada'];

// Fechado pelo utilizador nesta abertura da app (fora do React, para sobreviver
// a ecrãs que são montados de novo).
let dismissed = false;

export function HighlightPopup() {
  const { session, loading } = useAuth();
  const { pathname } = useLocation();
  const [, rerender] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);

  const active = Date.now() < HIGHLIGHT.until.getTime();
  const quiet = QUIET_ROUTES.some((r) => pathname.startsWith(r));
  const open = active && !dismissed && !loading && !!session && !quiet;

  // Reabre quando a app volta ao ecrã depois de um tempo em segundo plano.
  useEffect(() => {
    if (!active) return;
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt >= REOPEN_AFTER_MS) {
        dismissed = false;
        rerender((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [active]);

  // Imagem pronta antes do toque (o iPhone só partilha se for imediato).
  useEffect(() => {
    if (!open || fileRef.current) return;
    let alive = true;
    fetch(HIGHLIGHT.image)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        if (alive) fileRef.current = new File([b], 'redencao-church-2-anos.jpg', { type: b.type || 'image/jpeg' });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const close = useCallback(() => {
    dismissed = true;
    rerender((n) => n + 1);
  }, []);

  const share = async () => {
    const text = `${HIGHLIGHT.shareText}\n${window.location.origin}/agenda`;
    const files = fileRef.current ? [fileRef.current] : [];
    try {
      if (files.length && navigator.canShare?.({ files })) {
        await navigator.share({ files, text, title: HIGHLIGHT.title });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text, title: HIGHLIGHT.title });
        return;
      }
      await navigator.clipboard.writeText(text);
      setToast('Convite copiado. Cole onde quiser partilhar.');
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') setToast('Não foi possível partilhar.');
    }
  };

  return (
    <>
      {open && <ImageViewer src={HIGHLIGHT.image} alt={HIGHLIGHT.title} onClose={close} onShare={share} />}
      {toast && (
        <div className="rc-toast" style={{ zIndex: 130 }}>
          {toast}
        </div>
      )}
    </>
  );
}

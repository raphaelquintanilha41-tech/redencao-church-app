// Destaque de abertura: um cartaz que aparece uma vez sempre que a app é aberta,
// até à data do evento. Para trocar ou retirar o destaque, basta editar HIGHLIGHT.
import { useCallback, useEffect, useRef, useState } from 'react';
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

// Uma vez por abertura da app (não volta a aparecer ao navegar entre ecrãs).
let shownThisSession = false;

export function HighlightPopup({ onToast }: { onToast?: (msg: string) => void }) {
  const [open, setOpen] = useState(() => !shownThisSession && Date.now() < HIGHLIGHT.until.getTime());
  const fileRef = useRef<File | null>(null);

  useEffect(() => {
    if (!open) return;
    shownThisSession = true;
    let alive = true;
    // Imagem pronta antes do toque (o iPhone só partilha se for imediato).
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

  const close = useCallback(() => setOpen(false), []);

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
      onToast?.('Convite copiado. Cole onde quiser partilhar.');
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') onToast?.('Não foi possível partilhar.');
    }
  };

  if (!open) return null;
  return <ImageViewer src={HIGHLIGHT.image} alt={HIGHLIGHT.title} onClose={close} onShare={share} />;
}

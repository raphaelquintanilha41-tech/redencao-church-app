import { useEffect, useRef, useState } from 'react';
import { buildPassageFiles, passageReference, sharePassage, sharePassageText } from '../lib/share-card';
import type { ScripturePassage } from '../lib/share-card';

interface Props {
  passage: ScripturePassage;
  onClose: () => void;
  onToast: (msg: string) => void;
}

/**
 * Painel "Compartilhar": escolher Imagem (com a marca da igreja) ou Texto
 * (formatado para WhatsApp, com link para a passagem). Mesmo comportamento
 * da partilha dentro da Bíblia.
 */
export function PassageShareSheet({ passage, onClose, onToast }: Props) {
  // As imagens começam a ser desenhadas logo ao abrir o painel: o iPhone só
  // aceita a partilha se ela começar imediatamente após o toque.
  const filesRef = useRef<File[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    buildPassageFiles(passage)
      .then((files) => {
        if (alive) filesRef.current = files;
      })
      .catch(() => {
        /* gera no momento da partilha */
      });
    return () => {
      alive = false;
    };
  }, [passage]);

  const report = (outcome: string) => {
    if (outcome === 'retry') onToast('Imagens prontas — toque de novo em Imagem.');
    else if (outcome === 'copied') onToast('Texto copiado — cole no WhatsApp.');
    else if (outcome === 'failed') onToast('Não foi possível compartilhar neste aparelho.');
  };

  const shareImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ready = filesRef.current;
      const files = ready ?? (await buildPassageFiles(passage));
      filesRef.current = files;
      const outcome = await sharePassage(passage, files, !ready);
      report(outcome);
      if (outcome !== 'retry') onClose();
    } catch (err) {
      onToast(`Falha ao compartilhar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const shareText = async () => {
    const outcome = await sharePassageText(passage);
    report(outcome);
    onClose();
  };

  return (
    <div className="biblia-share-sheet-backdrop" onClick={onClose}>
      <div className="biblia-share-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Compartilhar">
        <div className="biblia-share-sheet-title">Compartilhar {passageReference(passage)}</div>
        <button type="button" className="biblia-share-option" onClick={shareImage} disabled={busy}>
          <span className="biblia-share-option-icon" aria-hidden="true">🖼️</span>
          <span>
            <strong>{busy ? 'A preparar…' : 'Imagem'}</strong>
            <small>Com as cores e o logo da igreja</small>
          </span>
        </button>
        <button type="button" className="biblia-share-option" onClick={shareText}>
          <span className="biblia-share-option-icon" aria-hidden="true">💬</span>
          <span>
            <strong>Texto</strong>
            <small>Formatado para WhatsApp, com link para abrir na app</small>
          </span>
        </button>
        <button type="button" className="biblia-share-cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

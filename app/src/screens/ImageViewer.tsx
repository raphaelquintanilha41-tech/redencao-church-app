// Visualizador de imagem em ecrã inteiro (cartazes de eventos).
// A imagem aparece inteira, sem cortes (object-fit: contain), com fundo escuro,
// botão de fechar e, opcionalmente, um botão de partilha.
// O atributo data-scroll-lock bloqueia o scroll da página por baixo (scroll-lock.ts).
import { useEffect } from 'react';

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
  onShare?: () => void;
};

export function ImageViewer({ src, alt = '', onClose, onShare }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="image-viewer" data-scroll-lock role="dialog" aria-modal="true" aria-label={alt || 'Imagem'} onClick={onClose}>
      <img className="image-viewer-img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="image-viewer-close" aria-label="Fechar" onClick={onClose}>
        ×
      </button>
      {onShare && (
        <button
          type="button"
          className="image-viewer-share"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
        >
          <ShareIcon /> Compartilhar
        </button>
      )}
    </div>
  );
}

export function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

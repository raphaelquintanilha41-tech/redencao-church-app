// Bloqueio do scroll da página enquanto há uma janela por cima (devocional,
// vídeo, Palavra do dia em ecrã inteiro, folhas de partilha, Oração guiada).
// Sem isto, no iPad/Android o deslizar dentro da janela — ou tocar fora dela —
// faz rolar a página que está por baixo ("scroll chaining").
//
// Funciona sem alterar cada ecrã: observa o DOM e, sempre que existe um
// elemento de uma destas classes, fixa o <body> na posição atual; quando a
// janela fecha, devolve a página exatamente onde estava.

const OVERLAY_SELECTOR = [
  '.home-video-modal',
  '.home-devotional-modal',
  '.home-verse-full',
  '.biblia-share-sheet-backdrop',
  '.oracao-screen',
  '.oracao-sheet-backdrop',
  '[data-scroll-lock]',
].join(',');

let locked = false;
let savedScrollY = 0;
let savedPath = '';

function lock() {
  if (locked) return;
  locked = true;
  savedScrollY = window.scrollY;
  savedPath = window.location.pathname;
  const body = document.body;
  // Compensa a barra de scroll no desktop para a página não "saltar".
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  document.documentElement.classList.add('scroll-locked');
}

function unlock() {
  if (!locked) return;
  locked = false;
  const body = document.body;
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.width = '';
  body.style.overflow = '';
  body.style.paddingRight = '';
  document.documentElement.classList.remove('scroll-locked');
  // Só repõe a posição se ainda estamos na mesma página (a Oração guiada é um ecrã próprio).
  if (window.location.pathname === savedPath) window.scrollTo(0, savedScrollY);
}

function sync() {
  if (document.querySelector(OVERLAY_SELECTOR)) lock();
  else unlock();
}

/** Liga o bloqueio automático (chamar uma vez, no arranque da app). */
export function installScrollLock(): void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(() => sync());
  observer.observe(document.body, { childList: true, subtree: true });
  sync();
}

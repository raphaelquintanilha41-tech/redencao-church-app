// Ecrã de abertura (logo da igreja) definido em index.html (#rc-splash).
// Fica visível até a app estar pronta a mostrar conteúdo e, no mínimo,
// MIN_VISIBLE_MS desde o arranque — para a apresentação não "piscar".

const MIN_VISIBLE_MS = 1400;
const FADE_MS = 500;

let hidden = false;

export function hideSplash() {
  if (hidden) return;
  hidden = true;
  const el = document.getElementById('rc-splash');
  if (!el) return;
  const wait = Math.max(0, MIN_VISIBLE_MS - performance.now());
  window.setTimeout(() => {
    el.classList.add('rc-splash-hide');
    window.setTimeout(() => el.remove(), FADE_MS);
  }, wait);
}

// A Home avisa quando os dados iniciais terminaram de carregar, para que o
// utilizador passe do logo diretamente para a Home já preenchida.
export const HOME_READY_EVENT = 'rc:home-ready';

export function signalHomeReady() {
  (window as unknown as { __rcHomeReady?: boolean }).__rcHomeReady = true;
  window.dispatchEvent(new Event(HOME_READY_EVENT));
}

export function isHomeReady() {
  return (window as unknown as { __rcHomeReady?: boolean }).__rcHomeReady === true;
}

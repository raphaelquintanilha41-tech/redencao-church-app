// Ecrã de abertura definido em index.html (#rc-splash).
// O nascimento do logo (ponto de luz → tamanho final) corre em CSS; quando a
// app está pronta e já passou o tempo mínimo da sequência, este módulo dispara
// o salto para fora do ecrã e retira a abertura.

const MIN_MS = 3400; // nascimento (0,35 → 2,95 s) + versículo
const LEAP_MS = 1200; // salto + véu (ver CSS rc-leap / rc-splash-veil)

let hidden = false;

export function hideSplash() {
  if (hidden) return;
  hidden = true;
  const el = document.getElementById('rc-splash');
  if (!el) return;
  const wait = Math.max(0, MIN_MS - performance.now());
  window.setTimeout(() => {
    el.classList.add('rc-splash-leap');
    window.setTimeout(() => el.remove(), LEAP_MS);
  }, wait);
}

// A Home avisa quando os dados iniciais terminaram de carregar, para que o
// utilizador passe da abertura diretamente para a Home já preenchida.
export const HOME_READY_EVENT = 'rc:home-ready';

export function signalHomeReady() {
  (window as unknown as { __rcHomeReady?: boolean }).__rcHomeReady = true;
  window.dispatchEvent(new Event(HOME_READY_EVENT));
}

export function isHomeReady() {
  return (window as unknown as { __rcHomeReady?: boolean }).__rcHomeReady === true;
}

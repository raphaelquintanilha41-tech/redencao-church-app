// Ecrã de abertura definido em index.html (#rc-splash).
// A formação do logo corre em CSS; quando a app está pronta (e já passou o
// tempo mínimo da sequência), este módulo dispara o "salto" do leão e retira
// o ecrã. Nas aberturas seguintes do mesmo dia (html.rc-short) a sequência é curta.

const FULL_MIN_MS = 3400; // formação (1,6 s) + assentar + versículo
const SHORT_MIN_MS = 700;
const LEAP_MS = 1150; // duração do salto + véu (ver CSS rc-leap / rc-splash-veil)

let hidden = false;

export function hideSplash() {
  if (hidden) return;
  hidden = true;
  const el = document.getElementById('rc-splash');
  if (!el) return;
  const short = document.documentElement.classList.contains('rc-short');
  const wait = Math.max(0, (short ? SHORT_MIN_MS : FULL_MIN_MS) - performance.now());
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

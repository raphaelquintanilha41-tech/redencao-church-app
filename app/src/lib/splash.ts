// Ecrã de abertura definido em index.html (#rc-splash).
// O logo e o versículo aparecem em CSS; quando a app está pronta e já passou
// o tempo mínimo (~2 s com o logo parado), este módulo dispara o salto para
// fora do ecrã (~2 s) e retira a abertura.

const MIN_MS = 2300; // logo + versículo visíveis ~2 s
const LEAP_MS = 1950; // salto (1,9 s) + dissolução final (ver CSS rc-leap / rc-out)
// Cor da barra de estado: igual à abertura enquanto ela está no ecrã; depois, a da app.
const APP_THEME_COLOR = '#0A1120';

let hidden = false;

export function hideSplash() {
  if (hidden) return;
  hidden = true;
  const el = document.getElementById('rc-splash');
  if (!el) return;
  const wait = Math.max(0, MIN_MS - performance.now());
  window.setTimeout(() => {
    el.classList.add('rc-splash-leap');
    // A abertura ainda cobre o ecrã: devolve já o fundo da página ao tema, para que
    // a dissolução final revele a app com a cor certa (claro ou escuro).
    document.documentElement.classList.remove('rc-splashing');
    window.setTimeout(() => {
      el.remove();
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', APP_THEME_COLOR);
    }, LEAP_MS);
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

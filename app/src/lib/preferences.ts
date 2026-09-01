export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_KEY = 'redencao_theme';
const BIBLE_FONT_KEY = 'redencao_bible_font_size';

export function getThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // localStorage indisponível — usa o padrão.
  }
  return 'system';
}

export function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  const effective =
    pref === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : pref;
  if (effective === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
}

export function setThemePreference(pref: ThemePreference) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // localStorage indisponível — a escolha só vale para esta sessão.
  }
  applyTheme(pref);
}

export function getBibleFontSize(): number {
  try {
    const v = localStorage.getItem(BIBLE_FONT_KEY);
    const n = v ? parseInt(v, 10) : NaN;
    if (!Number.isNaN(n) && n >= 14 && n <= 26) return n;
  } catch {
    // localStorage indisponível — usa o padrão.
  }
  return 17;
}

export function setBibleFontSize(size: number) {
  try {
    localStorage.setItem(BIBLE_FONT_KEY, String(size));
  } catch {
    // localStorage indisponível — a preferência não persiste.
  }
}

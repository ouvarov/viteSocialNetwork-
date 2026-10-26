type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'pulse-theme';

const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark';

const readTheme = (): Theme => {
  const { theme } = document.documentElement.dataset;

  if (isTheme(theme)) return theme;

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
};

const persistTheme = (theme: Theme): boolean => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
};

const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme;
  persistTheme(theme);
};

export { THEME_STORAGE_KEY, applyTheme, readTheme };
export type { Theme };

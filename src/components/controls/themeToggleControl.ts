import { createElement } from '@/utils/dom';
import type { ThemeName } from '@/types';

const SUN_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
</svg>`;

const MOON_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
</svg>`;

export interface ThemeToggleControl {
  element: HTMLButtonElement;
  setTheme: (theme: ThemeName) => void;
}

export function createThemeToggleControl(initial: ThemeName, onToggle: () => void): ThemeToggleControl {
  const button = createElement('button', 'map-control-btn theme-btn', {
    type: 'button',
    'aria-label': 'Toggle dark/light theme',
    title: 'Toggle theme',
  });

  const setTheme = (theme: ThemeName): void => {
    button.innerHTML = theme === 'dark' ? MOON_ICON : SUN_ICON;
    button.dataset.theme = theme;
  };

  setTheme(initial);
  button.addEventListener('click', onToggle);

  return { element: button, setTheme };
}

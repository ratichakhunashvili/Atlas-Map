import type { ThemeName } from '@/types';

const STORAGE_KEY = 'georgia-map:theme';

type Listener = (theme: ThemeName) => void;

function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function readStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

class ThemeService {
  private current: ThemeName = readStoredTheme() ?? (prefersDark() ? 'dark' : 'light');
  private listeners = new Set<Listener>();

  getTheme(): ThemeName {
    return this.current;
  }

  setTheme(theme: ThemeName): void {
    if (theme === this.current) return;
    this.current = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage unavailable (private mode, quota) — in-memory state still works
    }
    for (const listener of this.listeners) listener(theme);
  }

  toggle(): void {
    this.setTheme(this.current === 'light' ? 'dark' : 'light');
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const themeService = new ThemeService();

import { createSignal, createEffect, onMount } from 'solid-js';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'mt-theme';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const [theme, setThemeSignal] = createSignal<Theme>(getStoredTheme());

export function useTheme() {
  return theme;
}

export function setTheme(newTheme: Theme) {
  setThemeSignal(newTheme);
  localStorage.setItem(STORAGE_KEY, newTheme);
}

export function getEffectiveTheme(): 'light' | 'dark' {
  const current = theme();
  return current === 'system' ? getSystemTheme() : current;
}

export function initTheme() {
  createEffect(() => {
    const current = theme(); // явная зависимость для Solid
    const effective = current === 'system' ? getSystemTheme() : current;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effective);
  });

  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme() === 'system') {
        const effective = getSystemTheme();
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(effective);
      }
    };
    mediaQuery.addEventListener('change', handler);
  });
}

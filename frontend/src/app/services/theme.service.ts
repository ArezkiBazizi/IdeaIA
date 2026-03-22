import { Injectable, signal } from '@angular/core';

const KEY = 'ideaia-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** false = clair (papier), true = sombre (deep blue) */
  readonly dark = signal(false);

  constructor() {
    const stored = localStorage.getItem(KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const useDark = stored === 'dark' || (stored === null && prefersDark);
    this.dark.set(useDark);
    this.apply(useDark);
  }

  toggle() {
    const next = !this.dark();
    this.dark.set(next);
    localStorage.setItem(KEY, next ? 'dark' : 'light');
    this.apply(next);
  }

  private apply(dark: boolean) {
    document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  }
}

import { computed, effect, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';
const CYCLE: Theme[] = ['light', 'dark', 'system'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  readonly isDark = computed(() => {
    const current = this.theme();
    if (current === 'dark') return true;
    if (current === 'light') return false;
    return this.prefersDark();
  });

  private readonly systemDark = signal(this.getSystemPreference());

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
    });

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => this.systemDark.set(e.matches));
    }
  }

  toggle(): void {
    const currentIndex = CYCLE.indexOf(this.theme());
    const nextTheme = CYCLE[(currentIndex + 1) % CYCLE.length];
    this.setTheme(nextTheme);
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private loadTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY);
    return CYCLE.includes(stored as Theme) ? (stored as Theme) : 'system';
  }

  private getSystemPreference(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private prefersDark(): boolean {
    return this.systemDark();
  }
}

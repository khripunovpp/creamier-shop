import { Injectable, signal } from '@angular/core';

export type Lang = 'ru' | 'pt';
const STORAGE_KEY = 'lang';
const DEFAULT_LANG: Lang = 'ru';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(DEFAULT_LANG);

  constructor() {
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch {}
    if (stored === 'ru' || stored === 'pt') this.lang.set(stored);
  }

  setLang(next: Lang): void {
    this.lang.set(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }

  // Short helper: {{ i18n.t('Тарталетки', 'Tarteletes') }}
  t(ru: string, pt: string): string {
    return this.lang() === 'ru' ? ru : pt;
  }

  // Picks the right field of an object that carries `<base>_ru` / `<base>_pt`.
  pick<T extends Record<string, any>>(obj: T, base: string): string {
    return this.lang() === 'ru' ? obj[`${base}_ru`] : obj[`${base}_pt`];
  }
}

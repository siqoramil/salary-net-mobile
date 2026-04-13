import { create } from 'zustand';
import i18n from 'i18next';
import { storage, StorageKeys } from '../lib/storage';

export type Locale = 'en' | 'ru' | 'fr' | 'es' | 'ar' | 'zh' | 'ko' | 'ja';
const SUPPORTED: Locale[] = ['en', 'ru', 'fr', 'es', 'ar', 'zh', 'ko', 'ja'];

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrate: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: (i18n.language as Locale) || 'en',
  setLocale: (locale) => {
    storage.set(StorageKeys.LOCALE, locale);
    i18n.changeLanguage(locale);
    set({ locale });
  },
  hydrate: () => {
    const stored = storage.getString(StorageKeys.LOCALE) as Locale | undefined;
    if (stored && SUPPORTED.includes(stored)) {
      i18n.changeLanguage(stored);
      set({ locale: stored });
    } else {
      set({ locale: (i18n.language as Locale) || 'en' });
    }
  },
}));

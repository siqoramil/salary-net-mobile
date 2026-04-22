import { describe, it, expect, beforeEach } from 'vitest';
import { useLocaleStore } from '../../src/stores/localeStore';
import { storage, StorageKeys } from '../../src/lib/storage';
import i18n from '../mocks/i18next';
import AsyncStorageStub from '../mocks/async-storage';

describe('useLocaleStore', () => {
  beforeEach(() => {
    AsyncStorageStub.__reset();
    i18n.__reset();
    useLocaleStore.setState({ locale: 'en' });
  });

  it('setLocale updates zustand, storage, and i18next', () => {
    useLocaleStore.getState().setLocale('ru');
    expect(useLocaleStore.getState().locale).toBe('ru');
    expect(storage.getString(StorageKeys.LOCALE)).toBe('ru');
    expect(i18n.language).toBe('ru');
  });

  it('hydrate picks up a persisted supported locale', () => {
    storage.set(StorageKeys.LOCALE, 'fr');
    useLocaleStore.getState().hydrate();
    expect(useLocaleStore.getState().locale).toBe('fr');
    expect(i18n.language).toBe('fr');
  });

  it('hydrate ignores unsupported locales and falls back to i18n language', () => {
    storage.set(StorageKeys.LOCALE, 'xx'); // not in SUPPORTED list
    useLocaleStore.getState().hydrate();
    expect(useLocaleStore.getState().locale).toBe('en');
  });
});

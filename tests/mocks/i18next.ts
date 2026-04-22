// Minimal i18next stub. Tests only need the state that localeStore reads:
// the current language, plus a way to change it.

let language = 'en';

const i18n = {
  get language(): string {
    return language;
  },
  changeLanguage(next: string): Promise<string> {
    language = next;
    return Promise.resolve(next);
  },
  t(key: string): string {
    return key;
  },
  __reset(): void {
    language = 'en';
  },
};

export default i18n;

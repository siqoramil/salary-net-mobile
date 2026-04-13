import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from '../locales/en.json';
import ru from '../locales/ru.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import ar from '../locales/ar.json';
import zh from '../locales/zh.json';
import ko from '../locales/ko.json';
import ja from '../locales/ja.json';

const SUPPORTED = ['en', 'ru', 'fr', 'es', 'ar', 'zh', 'ko', 'ja'] as const;
type Supported = (typeof SUPPORTED)[number];

function detectDeviceLocale(): Supported {
  const device = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED as readonly string[]).includes(device) ? (device as Supported) : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    fr: { translation: fr },
    es: { translation: es },
    ar: { translation: ar },
    zh: { translation: zh },
    ko: { translation: ko },
    ja: { translation: ja },
  },
  lng: detectDeviceLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
  initImmediate: false,
  react: { useSuspense: false },
});

export default i18n;

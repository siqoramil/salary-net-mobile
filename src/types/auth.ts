export type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB';

export type Locale = 'en' | 'ru' | 'fr' | 'es' | 'ar' | 'zh' | 'ko' | 'ja';

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  defaultCurrency: Currency;
  locale: Locale;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

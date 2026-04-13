import { api } from './api';
import type { AuthResponse, Locale } from '../types/auth';

export interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  locale?: Locale;
}

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signup', payload);
    return data;
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signin', { identifier: email, password });
    return data;
  },

  async forgotPassword(email: string): Promise<{ ok: true }> {
    const { data } = await api.post<{ ok: true }>('/auth/forgot-password', { identifier: email });
    return data;
  },

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<{ ok: true }> {
    const { data } = await api.post<{ ok: true }>('/auth/reset-password', { token, password, confirmPassword });
    return data;
  },

  async logout(refreshToken?: string): Promise<{ ok: true }> {
    const { data } = await api.post<{ ok: true }>('/auth/logout', { refreshToken });
    return data;
  },
};

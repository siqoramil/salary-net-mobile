import { authApi, type SignUpPayload } from './auth.api';
import type { AuthResponse } from './auth.types';

export type { SignUpPayload };

export const authService = {
  signUp(payload: SignUpPayload): Promise<AuthResponse> {
    return authApi.signUp(payload);
  },
  signIn(email: string, password: string): Promise<AuthResponse> {
    return authApi.signIn(email, password);
  },
  forgotPassword(email: string): Promise<{ ok: true }> {
    return authApi.forgotPassword(email);
  },
  resetPassword(token: string, password: string, confirmPassword: string): Promise<{ ok: true }> {
    return authApi.resetPassword(token, password, confirmPassword);
  },
  logout(refreshToken?: string): Promise<{ ok: true }> {
    return authApi.logout(refreshToken);
  },
};

export { authApi };

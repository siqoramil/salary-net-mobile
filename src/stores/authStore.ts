import { create } from 'zustand';
import { secureTokens, secureUser } from '../lib/secureTokens';
import type { AuthResponse, User } from '../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  hydrate: () => void;
  setSession: (payload: AuthResponse) => void;
  updateUser: (partial: Partial<User>) => void;
  clear: () => void;
}

function parseUser(json: string | null): User | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  hydrate: () => {
    set({
      user: parseUser(secureUser.get()),
      accessToken: secureTokens.getAccess(),
      refreshToken: secureTokens.getRefresh(),
      isHydrated: true,
    });
  },
  setSession: ({ user, accessToken, refreshToken }) => {
    secureUser.set(JSON.stringify(user));
    secureTokens.setAccess(accessToken);
    secureTokens.setRefresh(refreshToken);
    set({ user, accessToken, refreshToken });
  },
  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partial };
      secureUser.set(JSON.stringify(updated));
      return { user: updated };
    });
  },
  clear: () => {
    secureTokens.clear();
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));

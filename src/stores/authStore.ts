import { create } from 'zustand';
import { storage, StorageKeys } from '../lib/storage';
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  hydrate: () => {
    const userJson = storage.getString(StorageKeys.USER);
    set({
      user: userJson ? (JSON.parse(userJson) as User) : null,
      accessToken: storage.getString(StorageKeys.ACCESS_TOKEN) ?? null,
      refreshToken: storage.getString(StorageKeys.REFRESH_TOKEN) ?? null,
      isHydrated: true,
    });
  },
  setSession: ({ user, accessToken, refreshToken }) => {
    storage.set(StorageKeys.USER, JSON.stringify(user));
    storage.set(StorageKeys.ACCESS_TOKEN, accessToken);
    storage.set(StorageKeys.REFRESH_TOKEN, refreshToken);
    set({ user, accessToken, refreshToken });
  },
  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partial };
      storage.set(StorageKeys.USER, JSON.stringify(updated));
      return { user: updated };
    });
  },
  clear: () => {
    storage.delete(StorageKeys.USER);
    storage.delete(StorageKeys.ACCESS_TOKEN);
    storage.delete(StorageKeys.REFRESH_TOKEN);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));

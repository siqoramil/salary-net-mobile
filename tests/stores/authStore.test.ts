import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/stores/authStore';
import { __reset as resetSecureStore } from '../mocks/secure-store';
import type { User } from '../../src/services/auth/auth.types';

const sampleUser: User = {
  id: 'u1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  avatarUrl: null,
  defaultCurrency: 'UZS',
  locale: 'en',
  emailVerified: false,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    resetSecureStore();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
    });
  });

  it('starts empty and not hydrated', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
    expect(s.isHydrated).toBe(false);
  });

  it('setSession stores user + tokens in state', () => {
    useAuthStore.getState().setSession({
      user: sampleUser,
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
    });
    const s = useAuthStore.getState();
    expect(s.user).toEqual(sampleUser);
    expect(s.accessToken).toBe('access-token-value');
    expect(s.refreshToken).toBe('refresh-token-value');
  });

  it('updateUser merges partial fields', () => {
    useAuthStore.getState().setSession({
      user: sampleUser,
      accessToken: 't',
      refreshToken: 'r',
    });
    useAuthStore.getState().updateUser({ fullName: 'Jane Roe', emailVerified: true });
    const s = useAuthStore.getState();
    expect(s.user?.fullName).toBe('Jane Roe');
    expect(s.user?.emailVerified).toBe(true);
    expect(s.user?.email).toBe('jane@example.com');
  });

  it('updateUser is a no-op when no user is loaded', () => {
    useAuthStore.getState().updateUser({ fullName: 'nobody' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('clear wipes user and tokens', () => {
    useAuthStore.getState().setSession({
      user: sampleUser,
      accessToken: 't',
      refreshToken: 'r',
    });
    useAuthStore.getState().clear();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
  });
});

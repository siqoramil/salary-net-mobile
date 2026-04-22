import { describe, it, expect, beforeEach } from 'vitest';
import { secureTokens, secureUser, securePin } from '../../src/lib/secureTokens';
import { __reset as resetSecureStore } from '../mocks/secure-store';

describe('secureTokens', () => {
  beforeEach(() => {
    resetSecureStore();
    secureTokens.clear();
  });

  it('stores and reads access/refresh tokens synchronously', () => {
    secureTokens.setAccess('access-abc');
    secureTokens.setRefresh('refresh-xyz');
    expect(secureTokens.getAccess()).toBe('access-abc');
    expect(secureTokens.getRefresh()).toBe('refresh-xyz');
  });

  it('clear wipes both tokens', () => {
    secureTokens.setAccess('a');
    secureTokens.setRefresh('b');
    secureTokens.clear();
    expect(secureTokens.getAccess()).toBeNull();
    expect(secureTokens.getRefresh()).toBeNull();
  });
});

describe('secureUser', () => {
  beforeEach(() => {
    resetSecureStore();
    secureUser.clear();
  });

  it('stores an arbitrary string (JSON payload from authStore)', () => {
    secureUser.set(JSON.stringify({ id: 'u1' }));
    expect(secureUser.get()).toBe('{"id":"u1"}');
  });

  it('clear wipes the stored user', () => {
    secureUser.set('anything');
    secureUser.clear();
    expect(secureUser.get()).toBeNull();
  });
});

describe('securePin', () => {
  beforeEach(() => {
    resetSecureStore();
    securePin.clear();
  });

  it('round-trips a PIN value', () => {
    securePin.set('1234');
    expect(securePin.get()).toBe('1234');
    securePin.clear();
    expect(securePin.get()).toBeNull();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserContext,
} from '../auth';
import { makeFakeToken } from '../../test/handlers';

describe('auth service', () => {
  beforeEach(() => localStorage.clear());

  it('getAuthToken returns null when nothing is stored', () => {
    expect(getAuthToken()).toBeNull();
  });

  it('setAuthToken stores a token in localStorage', () => {
    setAuthToken('abc123');
    expect(localStorage.getItem('token')).toBe('abc123');
  });

  it('removeAuthToken clears the token from localStorage', () => {
    localStorage.setItem('token', 'to-remove');
    removeAuthToken();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('getUserContext returns null when no token is stored', () => {
    expect(getUserContext()).toBeNull();
  });

  it('getUserContext decodes a valid JWT and returns role + email', () => {
    const token = makeFakeToken({ role: 'DOCTOR', email: 'doc@test.com' });
    localStorage.setItem('token', token);
    const ctx = getUserContext();
    expect(ctx).not.toBeNull();
    expect(ctx.role).toBe('DOCTOR');
    expect(ctx.email).toBe('doc@test.com');
  });
});

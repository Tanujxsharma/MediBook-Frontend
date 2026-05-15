import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { fetchApi } from '../api';
import { server } from '../../test/handlers';

const BASE = 'http://localhost:8080';

describe('fetchApi service', () => {
  beforeEach(() => localStorage.clear());

  it('attaches Authorization header when a token is stored', async () => {
    let capturedAuth = null;
    server.use(
      http.get(`${BASE}/test-auth`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      })
    );
    localStorage.setItem('token', 'my-token-123');
    await fetchApi('/test-auth');
    expect(capturedAuth).toBe('Bearer my-token-123');
  });

  it('omits Authorization header when no token is stored', async () => {
    let capturedAuth = 'set';
    server.use(
      http.get(`${BASE}/test-noauth`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      })
    );
    await fetchApi('/test-noauth');
    expect(capturedAuth).toBeNull();
  });

  it('returns parsed JSON for a successful 200 response', async () => {
    server.use(
      http.get(`${BASE}/items`, () => HttpResponse.json([{ id: 1 }]))
    );
    const result = await fetchApi('/items');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('throws an Error with the message field from a JSON error body', async () => {
    server.use(
      http.post(`${BASE}/fail-json`, () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      )
    );
    await expect(fetchApi('/fail-json', { method: 'POST' })).rejects.toThrow('Invalid credentials');
  });
});

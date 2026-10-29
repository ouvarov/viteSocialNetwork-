import { describe, expect, it, vi } from 'vitest';

import { API, http, HttpResponse, server, session } from '@/test/server.ts';

import { readAccessToken, saveAccessToken } from './access-token.ts';
import { client } from './client.ts';
import { onSessionEnd } from './session.ts';

const usersAnsweringByToken = (validToken: string) => {
  const seenTokens: (string | null)[] = [];

  server.use(
    http.get(`${API}/users`, ({ request }) => {
      const header = request.headers.get('Authorization');
      seenTokens.push(header);

      return header === `Bearer ${validToken}`
        ? HttpResponse.json([])
        : HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }),
  );

  return seenTokens;
};

const refreshAnswering = (token: string) => {
  let calls = 0;

  server.use(
    http.post(`${API}/auth/refresh`, () => {
      calls += 1;
      return HttpResponse.json(session(token));
    }),
  );

  return () => calls;
};

describe('client', () => {
  it('sends the access token', async () => {
    saveAccessToken('access-1');
    const seenTokens = usersAnsweringByToken('access-1');

    const { response } = await client.GET('/api/users');

    expect(response.status).toBe(200);
    expect(seenTokens).toEqual(['Bearer access-1']);
  });

  it('refreshes an expired token once and repeats the request', async () => {
    saveAccessToken('expired');
    const seenTokens = usersAnsweringByToken('access-2');
    const refreshCalls = refreshAnswering('access-2');

    const { response } = await client.GET('/api/users');

    expect(response.status).toBe(200);
    expect(seenTokens).toEqual(['Bearer expired', 'Bearer access-2']);
    expect(refreshCalls()).toBe(1);
    expect(readAccessToken()).toBe('access-2');
  });

  it('shares one refresh between requests that fail together', async () => {
    saveAccessToken('expired');
    usersAnsweringByToken('access-2');
    const refreshCalls = refreshAnswering('access-2');

    const results = await Promise.all([
      client.GET('/api/users'),
      client.GET('/api/users'),
      client.GET('/api/users'),
    ]);

    expect(results.map(({ response }) => response.status)).toEqual([
      200, 200, 200,
    ]);
    expect(refreshCalls()).toBe(1);
  });

  it('ends the session when the refresh fails', async () => {
    saveAccessToken('expired');
    usersAnsweringByToken('never');
    const onEnd = vi.fn();
    const unsubscribe = onSessionEnd(onEnd);

    const { response } = await client.GET('/api/users');
    unsubscribe();

    expect(response.status).toBe(401);
    expect(onEnd).toHaveBeenCalledOnce();
    expect(readAccessToken()).toBeNull();
  });

  it('keeps the session when the refresh fails for another reason', async () => {
    saveAccessToken('expired');
    usersAnsweringByToken('never');
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ statusCode: 503 }, { status: 503 }),
      ),
    );
    const onEnd = vi.fn();
    const unsubscribe = onSessionEnd(onEnd);

    const { response } = await client.GET('/api/users');
    unsubscribe();

    expect(response.status).toBe(401);
    expect(onEnd).not.toHaveBeenCalled();
    expect(readAccessToken()).toBe('expired');
  });

  it('does not refresh when a sign-in request answers 401', async () => {
    const refreshCalls = refreshAnswering('access-2');
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      ),
    );

    const { response } = await client.POST('/api/auth/login', {
      body: { email: 'ada@example.com', password: 'wrong' },
    });

    expect(response.status).toBe(401);
    expect(refreshCalls()).toBe(0);
  });

  it('does not refresh when a wrong password answers 403', async () => {
    saveAccessToken('access-1');
    const refreshCalls = refreshAnswering('access-2');
    server.use(
      http.delete(`${API}/users/me`, () =>
        HttpResponse.json(
          { statusCode: 403, message: 'Wrong password' },
          { status: 403 },
        ),
      ),
    );

    const { response } = await client.DELETE('/api/users/me', {
      body: { password: 'wrong' },
    });

    expect(response.status).toBe(403);
    expect(refreshCalls()).toBe(0);
  });

  it('sends the repeated request with its original body', async () => {
    saveAccessToken('expired');
    refreshAnswering('access-2');
    const bodies: unknown[] = [];
    server.use(
      http.post(`${API}/posts`, async ({ request }) => {
        bodies.push(await request.json());
        return request.headers.get('Authorization') === 'Bearer access-2'
          ? HttpResponse.json({}, { status: 201 })
          : HttpResponse.json({}, { status: 401 });
      }),
    );

    const { response } = await client.POST('/api/posts', {
      body: { text: 'Hello' },
    });

    expect(response.status).toBe(201);
    expect(bodies).toEqual([{ text: 'Hello' }, { text: 'Hello' }]);
  });
});

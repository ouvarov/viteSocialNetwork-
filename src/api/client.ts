import createClient from 'openapi-fetch';

import { readAccessToken } from './access-token.ts';
import { API_ORIGIN } from './origins.ts';
import type { paths } from './generated/schema.ts';
import { endSession, refreshSession } from './session.ts';

const UNAUTHORIZED = 401;
const AUTH_PATH_PREFIX = '/api/auth/';
const INVALID_CREDENTIALS = 'Invalid credentials';

const withAccessToken = (request: Request): Request => {
  const token = readAccessToken();

  if (token) request.headers.set('Authorization', `Bearer ${token}`);

  return request;
};

const isAuthRequest = (request: Request): boolean =>
  new URL(request.url).pathname.startsWith(AUTH_PATH_PREFIX);

const isWrongPassword = async (response: Response): Promise<boolean> => {
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => undefined);

  return (
    (body as { message?: unknown } | undefined)?.message === INVALID_CREDENTIALS
  );
};

const fetchWithSession = async (request: Request): Promise<Response> => {
  const retry = request.clone();
  const response = await fetch(withAccessToken(request));

  if (response.status !== UNAUTHORIZED || isAuthRequest(request)) {
    return response;
  }

  if (await isWrongPassword(response)) return response;

  try {
    await refreshSession();
  } catch {
    endSession();
    return response;
  }

  return fetch(withAccessToken(retry));
};

const client = createClient<paths>({
  baseUrl: API_ORIGIN,
  credentials: 'include',
  fetch: fetchWithSession,
});

export { client };

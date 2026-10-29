import createClient from 'openapi-fetch';

import { readAccessToken } from './access-token.ts';
import { isUnauthorizedError } from './errors.ts';
import { HTTP_STATUS } from './http-status.ts';
import { API_ORIGIN } from './origins.ts';
import type { paths } from './generated/schema.ts';
import { endSession, refreshSession } from './session.ts';

const AUTH_PATH_PREFIX = '/api/auth/';

const withAccessToken = (request: Request): Request => {
  const token = readAccessToken();

  if (token) request.headers.set('Authorization', `Bearer ${token}`);

  return request;
};

const isAuthRequest = (request: Request): boolean =>
  new URL(request.url).pathname.startsWith(AUTH_PATH_PREFIX);

const fetchWithSession = async (request: Request): Promise<Response> => {
  const retry = request.clone();
  const response = await fetch(withAccessToken(request));

  if (response.status !== HTTP_STATUS.UNAUTHORIZED || isAuthRequest(request)) {
    return response;
  }

  try {
    await refreshSession();
  } catch (error) {
    if (isUnauthorizedError(error)) endSession();
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

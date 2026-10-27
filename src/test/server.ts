import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import type { Schemas } from '@/api/schemas.ts';

const API = 'http://api.test/api';

const USER: Schemas['UserResponseDto'] = {
  id: '11111111-1111-4111-8111-111111111111',
  userName: 'Ada Lovelace',
  imageUrl: null,
  description: '',
  created: '2026-10-01T12:00:00.000Z',
};

const session = (token = 'access-1'): Schemas['AuthResponseDto'] => ({
  access_token: token,
  userData: USER,
});

const server = setupServer(
  http.post(`${API}/auth/refresh`, () =>
    HttpResponse.json(
      { statusCode: 401, message: 'Unauthorized' },
      {
        status: 401,
      },
    ),
  ),
);

export { API, http, HttpResponse, server, session, USER };

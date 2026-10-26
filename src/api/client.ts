import createClient from 'openapi-fetch';

import { readAccessToken } from './access-token.ts';
import type { paths } from './generated/schema.ts';

const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_ORIGIN,
  credentials: 'include',
});

client.use({
  onRequest: ({ request }) => {
    const token = readAccessToken();

    if (token) request.headers.set('Authorization', `Bearer ${token}`);

    return request;
  },
});

export { client };

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { clearAccessToken } from '@/api/access-token.ts';

import { server } from './server.ts';

class IdleIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  globalThis.IntersectionObserver ??=
    IdleIntersectionObserver as unknown as typeof IntersectionObserver;
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  clearAccessToken();
});

afterAll(() => server.close());

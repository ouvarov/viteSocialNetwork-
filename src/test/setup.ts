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

const openDialog = function (this: HTMLDialogElement) {
  this.open = true;
};

const closeDialog = function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};

beforeAll(() => {
  globalThis.IntersectionObserver ??=
    IdleIntersectionObserver as unknown as typeof IntersectionObserver;
  Object.assign(HTMLDialogElement.prototype, {
    showModal: openDialog,
    close: closeDialog,
  });
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  clearAccessToken();
});

afterAll(() => server.close());

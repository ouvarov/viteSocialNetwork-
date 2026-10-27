import { describe, expect, it } from 'vitest';

import { ApiError } from './errors.ts';
import { shouldRetry } from './query-client.ts';

describe('shouldRetry', () => {
  it.each([400, 401, 403, 404, 429])('does not retry a %i', (status) => {
    expect(shouldRetry(0, new ApiError(status, undefined))).toBe(false);
  });

  it('retries server and network errors twice', () => {
    for (const error of [
      new ApiError(503, undefined),
      new TypeError('Failed to fetch'),
    ]) {
      expect([0, 1, 2].map((count) => shouldRetry(count, error))).toEqual([
        true,
        true,
        false,
      ]);
    }
  });
});

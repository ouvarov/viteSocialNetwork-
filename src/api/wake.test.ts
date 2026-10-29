import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiAsleepError, wakeApi } from './wake.ts';

const WAKE_TIMEOUT_MS = 90_000;
const WAKE_RETRY_DELAY_MS = 2_000;

const answer = (status: number) =>
  Promise.resolve(new Response(null, { status }));

describe('wakeApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('pings again until the API answers ok', async () => {
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(answer(503))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockReturnValue(answer(200));
    vi.stubGlobal('fetch', fetchMock);

    const waking = wakeApi();
    await vi.runAllTimersAsync();
    await waking;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/health/live',
      expect.anything(),
    );
  });

  it('gives up once the wake timeout has passed', async () => {
    const fetchMock = vi.fn(() => answer(503));
    vi.stubGlobal('fetch', fetchMock);

    const waking = wakeApi();
    const outcome = expect(waking).rejects.toBeInstanceOf(ApiAsleepError);
    await vi.runAllTimersAsync();
    await outcome;

    expect(fetchMock).toHaveBeenCalledTimes(
      WAKE_TIMEOUT_MS / WAKE_RETRY_DELAY_MS,
    );
  });
});

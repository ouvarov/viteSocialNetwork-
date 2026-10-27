import { DIRECT_API_ORIGIN } from './origins.ts';

const WAKE_TIMEOUT_MS = 90_000;

const wakeApi = (): Promise<void> =>
  fetch(`${DIRECT_API_ORIGIN}/api/health/live`, {
    signal: AbortSignal.timeout(WAKE_TIMEOUT_MS),
  }).then(
    () => undefined,
    () => undefined,
  );

export { wakeApi };

import { DIRECT_API_ORIGIN } from './origins.ts';

const WAKE_TIMEOUT_MS = 90_000;
const WAKE_RETRY_DELAY_MS = 2_000;

const wait = (delayMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const isApiLive = (timeoutMs: number): Promise<boolean> =>
  fetch(`${DIRECT_API_ORIGIN}/api/health/live`, {
    signal: AbortSignal.timeout(timeoutMs),
  }).then(
    (response) => response.ok,
    () => false,
  );

const wakeApi = async (): Promise<void> => {
  const deadline = Date.now() + WAKE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isApiLive(deadline - Date.now())) return;
    await wait(WAKE_RETRY_DELAY_MS);
  }
};

export { wakeApi };

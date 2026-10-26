import { clearAccessToken, saveAccessToken } from './access-token.ts';
import { ApiError } from './errors.ts';
import type { Schemas } from './schemas.ts';

type Session = Schemas['AuthResponseDto'];

const REFRESH_URL = `${import.meta.env.VITE_API_ORIGIN}/api/auth/refresh`;

let pendingRefresh: Promise<Session> | null = null;
const expiryListeners = new Set<() => void>();

const requestRefresh = async (): Promise<Session> => {
  const response = await fetch(REFRESH_URL, {
    method: 'POST',
    credentials: 'include',
  });
  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) throw new ApiError(response.status, body);

  return body as Session;
};

const refreshSession = (): Promise<Session> => {
  pendingRefresh ??= requestRefresh()
    .then((session) => {
      saveAccessToken(session.access_token);
      return session;
    })
    .catch((error: unknown) => {
      clearAccessToken();
      throw error;
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
};

const onSessionExpired = (listener: () => void) => {
  expiryListeners.add(listener);

  return () => {
    expiryListeners.delete(listener);
  };
};

const expireSession = (): void => {
  clearAccessToken();
  expiryListeners.forEach((listener) => listener());
};

export { expireSession, onSessionExpired, refreshSession };

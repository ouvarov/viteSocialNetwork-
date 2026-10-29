import { clearAccessToken, saveAccessToken } from './access-token.ts';
import { ApiError, isUnauthorizedError } from './errors.ts';
import { API_ORIGIN } from './origins.ts';
import type { Schemas } from './schemas.ts';

type Session = Schemas['AuthResponseDto'];

const REFRESH_URL = `${API_ORIGIN}/api/auth/refresh`;

let pendingRefresh: Promise<Session> | null = null;
const endListeners = new Set<() => void>();

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
      if (isUnauthorizedError(error)) clearAccessToken();
      throw error;
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
};

const onSessionEnd = (listener: () => void) => {
  endListeners.add(listener);

  return () => {
    endListeners.delete(listener);
  };
};

const endSession = (): void => {
  clearAccessToken();
  endListeners.forEach((listener) => listener());
};

export { endSession, onSessionEnd, refreshSession };

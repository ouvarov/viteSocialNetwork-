import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { readAccessToken } from './access-token.ts';
import { isUnauthorizedError } from './errors.ts';
import { DIRECT_API_ORIGIN } from './origins.ts';
import { endSession, onSessionEnd, refreshSession } from './session.ts';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './socket-events.ts';

const TOKEN_REFRESH_INTERVAL_MS = 30_000;
const UNAUTHORIZED_HANDSHAKE = 'Unauthorized';
const MAX_RECONNECTS_WITHOUT_SUCCESS = 3;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  `${DIRECT_API_ORIGIN}/chat`,
  {
    transports: ['websocket'],
    autoConnect: false,
    auth: (setAuth) => setAuth({ token: readAccessToken() }),
  },
);

let lastTokenRefreshAt = -TOKEN_REFRESH_INTERVAL_MS;
let pendingReconnect: ReturnType<typeof setTimeout> | undefined;
let failedReconnects = 0;
let sessionGeneration = 0;

const reconnectWithFreshToken = () => {
  const generation = sessionGeneration;
  lastTokenRefreshAt = Date.now();
  pendingReconnect = undefined;
  failedReconnects += 1;

  refreshSession().then(
    () => {
      if (generation === sessionGeneration) socket.connect();
    },
    (error: unknown) => {
      if (generation !== sessionGeneration) return;
      if (isUnauthorizedError(error)) endSession();
      else scheduleReconnect();
    },
  );
};

const scheduleReconnect = () => {
  if (pendingReconnect) return;
  if (failedReconnects >= MAX_RECONNECTS_WITHOUT_SUCCESS) return;

  const delayMs = lastTokenRefreshAt + TOKEN_REFRESH_INTERVAL_MS - Date.now();
  pendingReconnect = setTimeout(reconnectWithFreshToken, Math.max(0, delayMs));
};

socket.on('connect', () => {
  failedReconnects = 0;
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') scheduleReconnect();
});

socket.on('connect_error', ({ message }) => {
  if (message === UNAUTHORIZED_HANDSHAKE) scheduleReconnect();
});

onSessionEnd(() => {
  sessionGeneration += 1;
  failedReconnects = 0;
  clearTimeout(pendingReconnect);
  pendingReconnect = undefined;
  socket.disconnect();
});

export { socket };

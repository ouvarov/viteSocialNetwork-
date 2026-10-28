import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { readAccessToken } from './access-token.ts';
import { DIRECT_API_ORIGIN } from './origins.ts';
import { endSession, onSessionEnd, refreshSession } from './session.ts';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './socket-events.ts';

const TOKEN_REFRESH_INTERVAL_MS = 30_000;
const UNAUTHORIZED_HANDSHAKE = 'Unauthorized';

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

const reconnectWithFreshToken = () => {
  lastTokenRefreshAt = Date.now();
  pendingReconnect = undefined;
  refreshSession().then(() => socket.connect(), endSession);
};

const scheduleReconnect = () => {
  if (pendingReconnect) return;

  const delayMs = lastTokenRefreshAt + TOKEN_REFRESH_INTERVAL_MS - Date.now();
  pendingReconnect = setTimeout(reconnectWithFreshToken, Math.max(0, delayMs));
};

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') scheduleReconnect();
});

socket.on('connect_error', ({ message }) => {
  if (message === UNAUTHORIZED_HANDSHAKE) scheduleReconnect();
});

onSessionEnd(() => {
  clearTimeout(pendingReconnect);
  pendingReconnect = undefined;
  socket.disconnect();
});

export { socket };

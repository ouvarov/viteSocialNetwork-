import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { readAccessToken } from './access-token.ts';
import { DIRECT_API_ORIGIN } from './origins.ts';
import { endSession, onSessionEnd, refreshSession } from './session.ts';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './socket-events.ts';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  `${DIRECT_API_ORIGIN}/chat`,
  {
    transports: ['websocket'],
    autoConnect: false,
    auth: (setAuth) => setAuth({ token: readAccessToken() }),
  },
);

const TOKEN_REFRESH_INTERVAL_MS = 30_000;

let lastTokenRefreshAt = 0;

socket.on('disconnect', (reason) => {
  if (reason !== 'io server disconnect') return;
  if (Date.now() - lastTokenRefreshAt < TOKEN_REFRESH_INTERVAL_MS) return;

  lastTokenRefreshAt = Date.now();
  refreshSession().then(() => socket.connect(), endSession);
});

onSessionEnd(() => socket.disconnect());

export { socket };

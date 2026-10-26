import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { readAccessToken } from './access-token.ts';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from './socket-events.ts';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  `${import.meta.env.VITE_SOCKET_URL}/chat`,
  {
    transports: ['websocket'],
    autoConnect: false,
    auth: (setAuth) => setAuth({ token: readAccessToken() }),
  },
);

export { socket };

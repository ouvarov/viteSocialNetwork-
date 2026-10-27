import { useSyncExternalStore } from 'react';

import { socket } from '@/api/socket.ts';

const subscribe = (onChange: () => void) => {
  socket.on('connect', onChange);
  socket.on('disconnect', onChange);

  return () => {
    socket.off('connect', onChange);
    socket.off('disconnect', onChange);
  };
};

const isConnected = () => socket.connected;

const useSocketConnected = () => useSyncExternalStore(subscribe, isConnected);

export { useSocketConnected };

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys.ts';
import { socket } from '@/api/socket.ts';

const useChatListUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onChatsChanged = () =>
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chats(),
        exact: true,
      });

    socket.on('chatsChanged', onChatsChanged);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off('chatsChanged', onChatsChanged);
    };
  }, [queryClient]);
};

export { useChatListUpdates };

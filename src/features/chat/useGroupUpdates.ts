import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys.ts';
import { socket } from '@/api/socket.ts';

const useGroupUpdates = (chatId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    const queryKey = queryKeys.chat(chatId);

    const refreshChat = () => {
      const isLeavingThisChat =
        queryClient.isMutating({ mutationKey: queryKey }) > 0;
      if (isLeavingThisChat) return;

      void queryClient.invalidateQueries({ queryKey, exact: true });
    };

    const onGroupChanged = ({ chatId: changedId }: { chatId: string }) => {
      if (changedId === chatId) refreshChat();
    };

    socket.on('groupChanged', onGroupChanged);
    socket.on('connect', refreshChat);

    return () => {
      socket.off('groupChanged', onGroupChanged);
      socket.off('connect', refreshChat);
    };
  }, [chatId, queryClient]);
};

export { useGroupUpdates };

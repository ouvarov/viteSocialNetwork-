import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys.ts';
import { socket } from '@/api/socket.ts';

const useGroupUpdates = (chatId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    const onGroupChanged = ({ chatId: changedId }: { chatId: string }) => {
      if (changedId !== chatId) return;

      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat(chatId),
        exact: true,
      });
    };

    socket.on('groupChanged', onGroupChanged);

    return () => {
      socket.off('groupChanged', onGroupChanged);
    };
  }, [chatId, queryClient]);
};

export { useGroupUpdates };

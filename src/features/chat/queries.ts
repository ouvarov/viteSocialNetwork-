import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';

import type { RenameChatTypes } from './types.ts';

const useChats = () =>
  useQuery({
    queryKey: queryKeys.chats(),
    queryFn: () => unwrap(client.GET('/api/chat')),
  });

const useChat = (chatId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.chat(String(chatId)),
    queryFn: () =>
      unwrap(
        client.GET('/api/chat/find/{id}', {
          params: { path: { id: String(chatId) } },
        }),
      ),
    enabled: Boolean(chatId),
  });

const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds: string[]) =>
      unwrap(client.POST('/api/chat/create', { body: { userIds } })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() }),
  });
};

const useRenameChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RenameChatTypes) =>
      unwrap(client.PUT('/api/chat/update', { body })),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() }),
  });
};

const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      await unwrap(
        client.DELETE('/api/chat/{id}', { params: { path: { id: chatId } } }),
      );
    },
    onSuccess: (_result, chatId) => {
      queryClient.removeQueries({ queryKey: queryKeys.chat(chatId) });
      return queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    },
  });
};

export { useChat, useChats, useCreateChat, useDeleteChat, useRenameChat };

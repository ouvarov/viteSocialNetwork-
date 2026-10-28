import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';

import { mergeMessages, messagesNewerThan } from './messages.ts';
import type { MessagePagesData } from './types.ts';

const MESSAGES_PAGE_SIZE = 50;

const useChats = () =>
  useQuery({
    queryKey: queryKeys.chats(),
    queryFn: () => unwrap(client.GET('/api/chat')),
  });

const useChat = (chatId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.chat(String(chatId)),
    queryFn: ({ signal }) =>
      unwrap(
        client.GET('/api/chat/find/{id}', {
          params: { path: { id: String(chatId) } },
          signal,
        }),
      ),
    enabled: Boolean(chatId),
  });

const useChatMessages = (chatId: string | undefined) =>
  useInfiniteQuery({
    queryKey: queryKeys.chatMessages(String(chatId)),
    queryFn: async ({ client: queryClient, queryKey, pageParam, signal }) => {
      const page = await unwrap(
        client.GET('/api/chat/{id}/messages', {
          params: {
            path: { id: String(chatId) },
            query: { limit: MESSAGES_PAGE_SIZE, cursor: pageParam },
          },
          signal,
        }),
      );
      if (pageParam) return page;

      const cachedNewest =
        queryClient.getQueryData<MessagePagesData>(queryKey)?.pages[0]?.items;
      const arrivedDuringFetch = messagesNewerThan(
        cachedNewest ?? [],
        page.items[0],
      );

      return {
        ...page,
        items: mergeMessages(page.items, arrivedDuringFetch),
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(chatId),
  });

const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      unwrap(client.POST('/api/chat/create', { body: { userId } })),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats(),
        exact: true,
      }),
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
      return queryClient.invalidateQueries({
        queryKey: queryKeys.chats(),
        exact: true,
      });
    },
  });
};

export { useChat, useChatMessages, useChats, useCreateChat, useDeleteChat };

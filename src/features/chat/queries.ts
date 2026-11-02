import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';

import { collectLiveMessages, mergeMessages } from './messages.ts';
import type {
  ChatRoleTypes,
  ChatsDataTypes,
  MessagePagesData,
} from './types.ts';

const MESSAGES_PAGE_SIZE = 50;

const useChats = () =>
  useQuery({
    queryKey: queryKeys.chats(),
    queryFn: () => unwrap(client.GET('/api/chat')),
    refetchOnMount: 'always',
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
      const fetchPage = () =>
        unwrap(
          client.GET('/api/chat/{id}/messages', {
            params: {
              path: { id: String(chatId) },
              query: { limit: MESSAGES_PAGE_SIZE, cursor: pageParam },
            },
            signal,
          }),
        );
      if (pageParam) return fetchPage();

      const stopCollecting = collectLiveMessages(String(chatId));
      const page = await fetchPage().finally(stopCollecting);
      const arrivedDuringFetch = stopCollecting();
      const cachedNewest =
        queryClient.getQueryData<MessagePagesData>(queryKey)?.pages[0]?.items ??
        [];

      return {
        ...page,
        items: mergeMessages(
          page.items,
          cachedNewest.filter(({ messageId }) =>
            arrivedDuringFetch.has(messageId),
          ),
        ),
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

type NewGroup = { title: string; memberIds: string[] };

const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: NewGroup) =>
      unwrap(client.POST('/api/chat/group', { body })),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats(),
        exact: true,
      }),
  });
};

type GroupAction =
  | { type: 'rename'; title: string }
  | { type: 'add'; userIds: string[] }
  | { type: 'remove'; userId: string }
  | { type: 'setRole'; userId: string; role: Exclude<ChatRoleTypes, 'owner'> }
  | { type: 'transfer'; userId: string };

const runGroupAction = (chatId: string, action: GroupAction) => {
  const path = { id: chatId };

  switch (action.type) {
    case 'rename':
      return client.PATCH('/api/chat/{id}', {
        params: { path },
        body: { title: action.title },
      });
    case 'add':
      return client.POST('/api/chat/{id}/members', {
        params: { path },
        body: { userIds: action.userIds },
      });
    case 'remove':
      return client.DELETE('/api/chat/{id}/members/{userId}', {
        params: { path: { ...path, userId: action.userId } },
      });
    case 'setRole':
      return client.PUT('/api/chat/{id}/members/{userId}/role', {
        params: { path: { ...path, userId: action.userId } },
        body: { role: action.role },
      });
    case 'transfer':
      return client.PUT('/api/chat/{id}/owner', {
        params: { path },
        body: { userId: action.userId },
      });
  }
};

const useGroupAction = (chatId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: GroupAction) => {
      await unwrap(runGroupAction(chatId, action));
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat(chatId),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.chats(),
          exact: true,
        }),
      ]),
  });
};

const useForgetChat = (chatId: string) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: queryKeys.chat(chatId) });
    return queryClient.invalidateQueries({
      queryKey: queryKeys.chats(),
      exact: true,
    });
  };
};

const useLeaveGroup = (chatId: string) => {
  const forgetChat = useForgetChat(chatId);

  return useMutation({
    mutationFn: async (userId: string) => {
      await unwrap(runGroupAction(chatId, { type: 'remove', userId }));
    },
    onSuccess: forgetChat,
  });
};

const useDeleteGroup = (chatId: string) => {
  const forgetChat = useForgetChat(chatId);

  return useMutation({
    mutationFn: async () => {
      await unwrap(
        client.DELETE('/api/chat/{id}/group', {
          params: { path: { id: chatId } },
        }),
      );
    },
    onSuccess: forgetChat,
  });
};

type MarkChatRead = { chatId: string; upToMessageId: string };

const useMarkChatRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, upToMessageId }: MarkChatRead) => {
      await unwrap(
        client.POST('/api/chat/{id}/read', {
          params: { path: { id: chatId } },
          body: { upToMessageId },
        }),
      );
    },
    onSuccess: (_result, { chatId }) => {
      queryClient.setQueryData<ChatsDataTypes[]>(queryKeys.chats(), (chats) =>
        chats?.map((chat) =>
          chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat,
        ),
      );
      return queryClient.invalidateQueries({
        queryKey: queryKeys.chats(),
        exact: true,
      });
    },
  });
};

export {
  useChat,
  useChatMessages,
  useChats,
  useCreateChat,
  useCreateGroup,
  useDeleteGroup,
  useGroupAction,
  useLeaveGroup,
  useDeleteChat,
  useMarkChatRead,
};

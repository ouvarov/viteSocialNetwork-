import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys.ts';

import type { MessagePagesData, MessagesDataTypes } from './types.ts';

const liveMessageIds = new Map<string, Set<string>>();

const compareOldestFirst = (
  first: MessagesDataTypes,
  second: MessagesDataTypes,
): number =>
  Date.parse(first.sentAt) - Date.parse(second.sentAt) ||
  first.messageId.localeCompare(second.messageId);

const compareNewestFirst = (
  first: MessagesDataTypes,
  second: MessagesDataTypes,
): number => compareOldestFirst(second, first);

const mergeMessages = (
  current: MessagesDataTypes[],
  incoming: MessagesDataTypes[],
): MessagesDataTypes[] => {
  const byId = new Map(current.map((message) => [message.messageId, message]));
  incoming.forEach((message) => byId.set(message.messageId, message));

  return [...byId.values()].sort(compareNewestFirst);
};

const collectLiveMessages = (chatId: string) => {
  const ids = new Set<string>();
  liveMessageIds.set(chatId, ids);

  return (): Set<string> => {
    if (liveMessageIds.get(chatId) === ids) liveMessageIds.delete(chatId);
    return ids;
  };
};

const toChronological = (data: MessagePagesData): MessagesDataTypes[] => {
  const byId = new Map(
    data.pages
      .flatMap((page) => page.items)
      .map((message) => [message.messageId, message]),
  );

  return [...byId.values()].sort(compareOldestFirst);
};

const saveMessage = (
  queryClient: QueryClient,
  chatId: string,
  message: MessagesDataTypes,
) => {
  liveMessageIds.get(chatId)?.add(message.messageId);

  return queryClient.setQueryData<MessagePagesData>(
    queryKeys.chatMessages(chatId),
    (data) => {
      const [newestPage, ...olderPages] = data?.pages ?? [];
      if (!data || !newestPage) return data;

      return {
        ...data,
        pages: [
          {
            ...newestPage,
            items: mergeMessages(newestPage.items, [message]),
          },
          ...olderPages,
        ],
      };
    },
  );
};

const reloadHistory = async (queryClient: QueryClient, chatId: string) => {
  const queryKey = queryKeys.chatMessages(chatId);

  await queryClient.cancelQueries({ queryKey });
  await queryClient.invalidateQueries({ queryKey });
};

export {
  collectLiveMessages,
  mergeMessages,
  reloadHistory,
  saveMessage,
  toChronological,
};

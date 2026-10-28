import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys.ts';

import type { MessagePagesData, MessagesDataTypes } from './types.ts';

const sentAtOf = ({ sentAt }: MessagesDataTypes) => Date.parse(sentAt);

const mergeMessages = (
  current: MessagesDataTypes[],
  incoming: MessagesDataTypes[],
): MessagesDataTypes[] => {
  const byId = new Map(current.map((message) => [message.messageId, message]));
  incoming.forEach((message) => byId.set(message.messageId, message));

  return [...byId.values()].sort(
    (first, second) => sentAtOf(second) - sentAtOf(first),
  );
};

const messagesNewerThan = (
  messages: MessagesDataTypes[],
  newest: MessagesDataTypes | undefined,
): MessagesDataTypes[] =>
  newest
    ? messages.filter((message) => sentAtOf(message) > sentAtOf(newest))
    : messages;

const toChronological = (data: MessagePagesData): MessagesDataTypes[] => {
  const byId = new Map(
    data.pages
      .flatMap((page) => page.items)
      .map((message) => [message.messageId, message]),
  );

  return [...byId.values()].sort(
    (first, second) => sentAtOf(first) - sentAtOf(second),
  );
};

const saveMessage = (
  queryClient: QueryClient,
  chatId: string,
  message: MessagesDataTypes,
) =>
  queryClient.setQueryData<MessagePagesData>(
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

const reloadHistory = async (queryClient: QueryClient, chatId: string) => {
  const queryKey = queryKeys.chatMessages(chatId);

  await queryClient.cancelQueries({ queryKey });
  await queryClient.invalidateQueries({ queryKey });
};

export {
  mergeMessages,
  messagesNewerThan,
  reloadHistory,
  saveMessage,
  toChronological,
};

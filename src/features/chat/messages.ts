import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys.ts';

import type { ChatDataTypes, MessagesDataTypes } from './types.ts';

const mergeMessages = (
  current: MessagesDataTypes[],
  incoming: MessagesDataTypes[],
): MessagesDataTypes[] => {
  const byId = new Map(current.map((message) => [message.messageId, message]));
  incoming.forEach((message) => byId.set(message.messageId, message));

  return [...byId.values()].sort(
    (first, second) => Date.parse(first.sentAt) - Date.parse(second.sentAt),
  );
};

const saveMessage = (
  queryClient: QueryClient,
  chatId: string,
  message: MessagesDataTypes,
) =>
  queryClient.setQueryData<ChatDataTypes>(queryKeys.chat(chatId), (chat) =>
    chat
      ? { ...chat, messages: mergeMessages(chat.messages, [message]) }
      : chat,
  );

export { mergeMessages, saveMessage };

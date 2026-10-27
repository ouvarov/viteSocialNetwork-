import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys.ts';

import { mergeMessages, saveMessage } from './messages.ts';
import type { ChatDataTypes, MessagesDataTypes } from './types.ts';

const message = (
  messageId: string,
  sentAt: string,
  content = messageId,
): MessagesDataTypes => ({
  messageId,
  senderId: 'sender',
  content,
  sentAt,
});

const CHAT_ID = 'chat-1';

describe('mergeMessages', () => {
  it('orders messages by the time they were sent', () => {
    const merged = mergeMessages(
      [message('b', '2026-10-01T12:00:02Z')],
      [
        message('a', '2026-10-01T12:00:01Z'),
        message('c', '2026-10-01T12:00:03Z'),
      ],
    );

    expect(merged.map(({ messageId }) => messageId)).toEqual(['a', 'b', 'c']);
  });

  it('keeps one copy of a message that arrived twice, the newer one', () => {
    const merged = mergeMessages(
      [message('a', '2026-10-01T12:00:01Z', 'old')],
      [message('a', '2026-10-01T12:00:01Z', 'new')],
    );

    expect(merged).toEqual([message('a', '2026-10-01T12:00:01Z', 'new')]);
  });
});

describe('saveMessage', () => {
  it('adds a live message to a loaded chat once', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<ChatDataTypes>(queryKeys.chat(CHAT_ID), {
      chatName: 'Ada, Bob',
      messages: [message('a', '2026-10-01T12:00:01Z')],
    });
    const live = message('b', '2026-10-01T12:00:02Z');

    saveMessage(queryClient, CHAT_ID, live);
    saveMessage(queryClient, CHAT_ID, live);

    expect(
      queryClient.getQueryData<ChatDataTypes>(queryKeys.chat(CHAT_ID))
        ?.messages,
    ).toEqual([message('a', '2026-10-01T12:00:01Z'), live]);
  });

  it('reports that nothing was saved when the chat is not loaded yet', () => {
    const queryClient = new QueryClient();

    expect(
      saveMessage(queryClient, CHAT_ID, message('a', '2026-10-01T12:00:01Z')),
    ).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.chat(CHAT_ID))).toBeUndefined();
  });
});

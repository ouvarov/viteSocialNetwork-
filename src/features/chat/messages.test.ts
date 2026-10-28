import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys.ts';

import {
  mergeMessages,
  collectLiveMessages,
  saveMessage,
  toChronological,
} from './messages.ts';
import type { MessagePagesData, MessagesDataTypes } from './types.ts';

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

const historyOf = (...pages: MessagesDataTypes[][]): MessagePagesData => ({
  pages: pages.map((items) => ({ items, nextCursor: null })),
  pageParams: pages.map(() => undefined),
});

const CHAT_ID = 'chat-1';

describe('mergeMessages', () => {
  it('orders messages newest first, like a history page', () => {
    const merged = mergeMessages(
      [message('b', '2026-10-01T12:00:02Z')],
      [
        message('a', '2026-10-01T12:00:01Z'),
        message('c', '2026-10-01T12:00:03Z'),
      ],
    );

    expect(merged.map(({ messageId }) => messageId)).toEqual(['c', 'b', 'a']);
  });

  it('keeps one copy of a message that arrived twice, the newer one', () => {
    const merged = mergeMessages(
      [message('a', '2026-10-01T12:00:01Z', 'old')],
      [message('a', '2026-10-01T12:00:01Z', 'new')],
    );

    expect(merged).toEqual([message('a', '2026-10-01T12:00:01Z', 'new')]);
  });
});

describe('collectLiveMessages', () => {
  it('remembers only the messages saved while collecting', () => {
    const queryClient = new QueryClient();
    saveMessage(
      queryClient,
      CHAT_ID,
      message('before', '2026-10-01T12:00:01Z'),
    );

    const stopCollecting = collectLiveMessages(CHAT_ID);
    saveMessage(
      queryClient,
      CHAT_ID,
      message('during', '2026-10-01T12:00:02Z'),
    );
    const arrived = stopCollecting();
    saveMessage(queryClient, CHAT_ID, message('after', '2026-10-01T12:00:03Z'));

    expect([...arrived]).toEqual(['during']);
  });
});

describe('toChronological', () => {
  it('orders messages sent in the same millisecond by id, like the API', () => {
    const history = historyOf([
      message('b', '2026-10-01T12:00:01Z'),
      message('a', '2026-10-01T12:00:01Z'),
    ]);

    expect(toChronological(history).map(({ messageId }) => messageId)).toEqual([
      'a',
      'b',
    ]);
  });

  it('reads the pages oldest first without duplicates across pages', () => {
    const history = historyOf(
      [
        message('c', '2026-10-01T12:00:03Z'),
        message('b', '2026-10-01T12:00:02Z'),
      ],
      [
        message('b', '2026-10-01T12:00:02Z'),
        message('a', '2026-10-01T12:00:01Z'),
      ],
    );

    expect(toChronological(history).map(({ messageId }) => messageId)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('saveMessage', () => {
  it('adds a live message to the newest page once', () => {
    const queryClient = new QueryClient();
    const older = message('a', '2026-10-01T12:00:01Z');
    queryClient.setQueryData<MessagePagesData>(
      queryKeys.chatMessages(CHAT_ID),
      historyOf([older]),
    );
    const live = message('b', '2026-10-01T12:00:02Z');

    saveMessage(queryClient, CHAT_ID, live);
    saveMessage(queryClient, CHAT_ID, live);

    expect(
      queryClient.getQueryData<MessagePagesData>(
        queryKeys.chatMessages(CHAT_ID),
      )?.pages[0]?.items,
    ).toEqual([live, older]);
  });

  it('reports that nothing was saved when the history is not loaded yet', () => {
    const queryClient = new QueryClient();

    expect(
      saveMessage(queryClient, CHAT_ID, message('a', '2026-10-01T12:00:01Z')),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(queryKeys.chatMessages(CHAT_ID)),
    ).toBeUndefined();
  });
});

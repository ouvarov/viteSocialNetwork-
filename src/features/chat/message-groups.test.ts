import { describe, expect, it } from 'vitest';

import { groupMessages } from './message-groups.ts';
import type { MessagesDataTypes } from './types.ts';

const message = (
  id: string,
  senderId: string | null,
  minute: number,
): MessagesDataTypes => ({
  messageId: id,
  senderId,
  senderName: senderId,
  content: `Message ${id}`,
  sentAt: new Date(Date.UTC(2026, 10, 1, 12, minute)).toISOString(),
});

const shape = (messages: MessagesDataTypes[]) =>
  groupMessages(messages).map(
    ({ message: { messageId }, isFirstInGroup, isLastInGroup }) =>
      `${messageId}:${isFirstInGroup ? 'first' : ''}${isLastInGroup ? 'last' : ''}`,
  );

describe('groupMessages', () => {
  it('groups messages from one sender a few minutes apart', () => {
    expect(
      shape([
        message('a', 'ada', 0),
        message('b', 'ada', 2),
        message('c', 'ada', 6),
      ]),
    ).toEqual(['a:first', 'b:', 'c:last']);
  });

  it('starts a new group when the sender changes', () => {
    expect(
      shape([
        message('a', 'ada', 0),
        message('b', 'bob', 1),
        message('c', 'ada', 2),
      ]),
    ).toEqual(['a:firstlast', 'b:firstlast', 'c:firstlast']);
  });

  it('starts a new group after more than five minutes', () => {
    expect(shape([message('a', 'ada', 0), message('b', 'ada', 6)])).toEqual([
      'a:firstlast',
      'b:firstlast',
    ]);
  });

  it('labels the first message of each day and breaks the group there', () => {
    const lateEvening = new Date(2026, 10, 1, 23, 59).toISOString();
    const afterMidnight = new Date(2026, 10, 2, 0, 1).toISOString();
    const laterThatDay = new Date(2026, 10, 2, 0, 2).toISOString();
    const grouped = groupMessages(
      [
        { ...message('a', 'ada', 0), sentAt: lateEvening },
        { ...message('b', 'ada', 0), sentAt: afterMidnight },
        { ...message('c', 'ada', 0), sentAt: laterThatDay },
      ],
      new Date(2026, 10, 2, 12),
    );

    expect(grouped.map(({ dayLabel }) => dayLabel)).toEqual([
      'Yesterday',
      'Today',
      undefined,
    ]);
    expect(grouped[0].isLastInGroup).toBe(true);
    expect(grouped[1].isFirstInGroup).toBe(true);
    expect(grouped[2].isFirstInGroup).toBe(false);
  });

  it('shows the date for older days', () => {
    const [{ dayLabel }] = groupMessages(
      [message('a', 'ada', 0)],
      new Date(2026, 10, 20),
    );

    expect(dayLabel).not.toMatch(/Today|Yesterday/);
    expect(dayLabel).toMatch(/2026/);
  });

  it('keeps messages from deleted accounts together', () => {
    expect(shape([message('a', null, 0), message('b', null, 1)])).toEqual([
      'a:first',
      'b:last',
    ]);
  });
});

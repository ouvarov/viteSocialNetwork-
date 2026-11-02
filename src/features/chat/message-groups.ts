import type { MessagesDataTypes } from './types.ts';

const GROUP_GAP_MS = 5 * 60_000;

type GroupedMessage = {
  message: MessagesDataTypes;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

const belongTogether = (
  earlier: MessagesDataTypes | undefined,
  later: MessagesDataTypes | undefined,
): boolean =>
  earlier !== undefined &&
  later !== undefined &&
  earlier.senderId === later.senderId &&
  Date.parse(later.sentAt) - Date.parse(earlier.sentAt) <= GROUP_GAP_MS;

const groupMessages = (messages: MessagesDataTypes[]): GroupedMessage[] =>
  messages.map((message, index) => ({
    message,
    isFirstInGroup: !belongTogether(messages[index - 1], message),
    isLastInGroup: !belongTogether(message, messages[index + 1]),
  }));

export { groupMessages };
export type { GroupedMessage };

import type { MessagesDataTypes } from './types.ts';

const GROUP_GAP_MS = 5 * 60_000;

type GroupedMessage = {
  message: MessagesDataTypes;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  dayLabel?: string;
};

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
});

const localDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const isSameDay = (first: string, second: string): boolean =>
  localDay(new Date(first)) === localDay(new Date(second));

const dayLabelOf = (sentAt: string, now: Date): string => {
  const sent = new Date(sentAt);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (localDay(sent) === localDay(now)) return 'Today';
  if (localDay(sent) === localDay(yesterday)) return 'Yesterday';
  return dayFormatter.format(sent);
};

const belongTogether = (
  earlier: MessagesDataTypes | undefined,
  later: MessagesDataTypes | undefined,
): boolean =>
  earlier !== undefined &&
  later !== undefined &&
  earlier.senderId === later.senderId &&
  isSameDay(earlier.sentAt, later.sentAt) &&
  Date.parse(later.sentAt) - Date.parse(earlier.sentAt) <= GROUP_GAP_MS;

const groupMessages = (
  messages: MessagesDataTypes[],
  now: Date = new Date(),
): GroupedMessage[] =>
  messages.map((message, index) => {
    const previous = messages[index - 1];

    return {
      message,
      isFirstInGroup: !belongTogether(previous, message),
      isLastInGroup: !belongTogether(message, messages[index + 1]),
      dayLabel:
        previous && isSameDay(previous.sentAt, message.sentAt)
          ? undefined
          : dayLabelOf(message.sentAt, now),
    };
  });

export { groupMessages };
export type { GroupedMessage };

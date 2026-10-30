const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const capitalize = (text: string): string =>
  text.charAt(0).toLocaleUpperCase() + text.slice(1);

const formatRelativeTime = (date: Date, now: Date, locale?: string): string => {
  const elapsedMs = now.getTime() - date.getTime();

  if (elapsedMs < MINUTE_MS) return 'now';
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}m`;
  if (startOfDay(date) === startOfDay(now)) {
    return `${Math.floor(elapsedMs / HOUR_MS)}h`;
  }
  if (startOfDay(now) - startOfDay(date) <= DAY_MS) {
    return capitalize(
      new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        -1,
        'day',
      ),
    );
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(date);
};

const formatFullDate = (date: Date, locale?: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

export { formatFullDate, formatRelativeTime };

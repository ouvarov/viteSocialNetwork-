import type { FC } from 'react';

import { formatFullDate, formatRelativeTime } from './relative-time.ts';

type RelativeTimeProps = {
  dateTime: string;
  className?: string;
};

const RelativeTime: FC<RelativeTimeProps> = ({ dateTime, className }) => {
  const date = new Date(dateTime);

  return (
    <time
      className={className}
      dateTime={dateTime}
      title={formatFullDate(date)}
    >
      {formatRelativeTime(date, new Date())}
    </time>
  );
};

export { RelativeTime };

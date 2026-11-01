import type { FC } from 'react';
import classNames from 'classnames';

import { useAuth } from '@/features/auth/useAuth.ts';
import type { GroupedMessage } from '@/features/chat/message-groups.ts';
import { DELETED_USER_NAME } from '@/features/users/deleted-user.ts';

import styles from './message.module.scss';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
});

const Message: FC<GroupedMessage> = ({
  message: { senderId, content, sentAt },
  isFirstInGroup,
  isLastInGroup,
}) => {
  const { user } = useAuth();

  const isOwner = senderId === user?.id;
  const isFromDeletedUser = senderId === null;

  return (
    <li
      className={classNames(styles.item, {
        [styles.item__owner]: isOwner,
        [styles.item__grouped]: !isFirstInGroup,
      })}
    >
      {isFromDeletedUser && isFirstInGroup && (
        <span className={styles.item__sender}>{DELETED_USER_NAME}</span>
      )}
      {content}
      {isLastInGroup && (
        <time className={styles.item__time} dateTime={sentAt}>
          {timeFormatter.format(new Date(sentAt))}
        </time>
      )}
    </li>
  );
};

export { Message };

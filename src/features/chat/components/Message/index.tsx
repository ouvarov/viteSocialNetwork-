import type { FC } from 'react';
import classNames from 'classnames';

import { useAuth } from '@/features/auth/useAuth.ts';
import type { GroupedMessage } from '@/features/chat/message-groups.ts';
import { DELETED_USER_NAME } from '@/features/users/deleted-user.ts';

import styles from './message.module.scss';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
});

type MessageProps = GroupedMessage & { isInGroupChat?: boolean };

const Message: FC<MessageProps> = ({
  message: { senderId, senderName, content, sentAt },
  isFirstInGroup,
  isLastInGroup,
  isInGroupChat = false,
}) => {
  const { user } = useAuth();

  const isOwner = senderId === user?.id;
  const senderLabel =
    senderId === null
      ? DELETED_USER_NAME
      : isInGroupChat && !isOwner
        ? senderName
        : null;

  return (
    <li
      className={classNames(styles.item, {
        [styles.item__owner]: isOwner,
        [styles.item__grouped]: !isFirstInGroup,
      })}
    >
      {senderLabel && isFirstInGroup && (
        <span className={styles.item__sender}>{senderLabel}</span>
      )}
      {content}
      {isLastInGroup && (
        <>
          {' '}
          <time className={styles.item__time} dateTime={sentAt}>
            {timeFormatter.format(new Date(sentAt))}
          </time>
        </>
      )}
    </li>
  );
};

export { Message };

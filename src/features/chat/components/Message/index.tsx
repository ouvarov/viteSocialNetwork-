import type { FC } from 'react';
import classNames from 'classnames';

import type { MessagesDataTypes } from '@/features/chat/types.ts';
import { useAuth } from '@/features/auth/useAuth.ts';

import styles from './message.module.scss';

const Message: FC<MessagesDataTypes> = ({ senderId, content }) => {
  const { user } = useAuth();

  const isOwner = senderId === user?.id;

  const messageClassNames = classNames(styles.item, {
    [styles.item__owner]: isOwner,
  });

  return (
    <div className={messageClassNames}>
      <p className={styles.text}>{content}</p>
    </div>
  );
};

export { Message };

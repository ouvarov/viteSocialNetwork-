import { FC } from 'react';
import classNames from 'classnames';

import { MessagesDataTypes } from '@/types/chat.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';

import styles from './message.module.scss';

const Message: FC<MessagesDataTypes> = ({ sender_id, content }) => {
  const { user } = useAuth();

  const isOwner = sender_id === user?.id;

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

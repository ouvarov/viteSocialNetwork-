import type { FC } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { useChats } from '@/features/chat/queries.ts';
import { useChatListUpdates } from '@/features/chat/useChatListUpdates.ts';
import { DELETED_USER_NAME } from '@/features/users/deleted-user.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { chatPage, usersPage } from '@/routes/routePaths.ts';

import styles from './chats.module.scss';

const ChatsList: FC = () => {
  const { data: chats, isPending, isError, error, refetch } = useChats();
  useChatListUpdates();

  if (isPending) return <Loader label="Loading chats" />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load chats"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (chats.length === 0) {
    return (
      <EmptyState
        title="No chats yet"
        action={<Link to={usersPage()}>Find someone to talk to</Link>}
      >
        Open a profile and start a chat.
      </EmptyState>
    );
  }

  return (
    <ul className={styles.list}>
      {chats.map(({ chatId, peer }) => (
        <li key={chatId}>
          <Link className={styles.item} to={chatPage(chatId)}>
            <Avatar
              userId={peer?.id ?? chatId}
              userName={peer?.userName ?? DELETED_USER_NAME}
              imageUrl={peer?.imageUrl ?? null}
            />
            <span className={styles.item__name}>
              {peer?.userName ?? DELETED_USER_NAME}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

const Chats: FC = () => {
  useDocumentTitle('Chats');

  return (
    <section>
      <PageHeader title="Chats" />
      <ChatsList />
    </section>
  );
};

export { Chats };

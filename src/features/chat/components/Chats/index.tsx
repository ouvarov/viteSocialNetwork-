import type { FC } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { UserIcon } from '@/components/common/UserIcon';
import { useChats } from '@/features/chat/queries.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { chatPage, usersPage } from '@/routes/routePaths.ts';

import styles from './chats.module.scss';

const DELETED_USER = 'Deleted user';
const AVATAR_SIZE = 40;

const ChatsList: FC = () => {
  const { data: chats, isPending, isError, error, refetch } = useChats();

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
            <UserIcon imageUrl={peer?.imageUrl ?? null} size={AVATAR_SIZE} />
            <span className={styles.item__name}>
              {peer?.userName ?? DELETED_USER}
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

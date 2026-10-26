import type { FC } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { useChats } from '@/features/chat/queries.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { chatPage, usersPage } from '@/routes/routePaths.ts';

import styles from './chats.module.scss';

const UNNAMED_CHAT = 'Untitled chat';

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
      {chats.map(({ chatId, chatName }) => (
        <li key={chatId}>
          <Link className={styles.item} to={chatPage(chatId)}>
            {chatName || UNNAMED_CHAT}
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

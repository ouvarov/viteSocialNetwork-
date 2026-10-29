import type { FC } from 'react';
import { Link } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { UserIcon } from '@/components/common/UserIcon';
import { useUsers } from '@/features/users/queries.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { useOnVisible } from '@/hooks/useOnVisible.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './users.module.scss';

const UsersList: FC = () => {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useUsers();

  const loadMore = () => void fetchNextPage();
  const loadMoreRef = useOnVisible<HTMLButtonElement>(
    loadMore,
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  );

  if (isPending) return <Loader label="Loading users" />;

  if (isError && !data) {
    return (
      <ErrorState
        title="Could not load users"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const users = data.pages.flatMap((page) => page.items);

  if (users.length === 0) {
    return (
      <EmptyState title="No users yet">Invite a friend to Pulse.</EmptyState>
    );
  }

  return (
    <>
      <ul className={styles.list}>
        {users.map(({ userName, id, imageUrl }) => (
          <li key={id}>
            <Link className={styles.item} to={profilePage(id)}>
              <UserIcon imageUrl={imageUrl} size={40} />
              <span className={styles.item__name}>{userName}</span>
            </Link>
          </li>
        ))}
      </ul>
      {isFetchNextPageError && (
        <p className={styles.error} role="alert">
          {getApiErrorMessage(error, 'Could not load more people')}
        </p>
      )}
      {hasNextPage && (
        <Button
          ref={loadMoreRef}
          variant="secondary"
          className={styles.more}
          isLoading={isFetchingNextPage}
          onClick={loadMore}
        >
          {isFetchNextPageError ? 'Try again' : 'Show more people'}
        </Button>
      )}
    </>
  );
};

const Users: FC = () => {
  useDocumentTitle('Users');

  return (
    <section>
      <PageHeader title="Users" />
      <UsersList />
    </section>
  );
};

export { Users };

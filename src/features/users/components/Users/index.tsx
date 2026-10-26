import type { FC } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { UserIcon } from '@/components/common/UserIcon';
import { useUsers } from '@/features/users/queries.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './users.module.scss';

const UsersList: FC = () => {
  const { data: users, isPending, isError, error, refetch } = useUsers();

  if (isPending) return <Loader label="Loading users" />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load users"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState title="No users yet">Invite a friend to Pulse.</EmptyState>
    );
  }

  return (
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

import type { FC } from 'react';
import { Link } from 'react-router';

import { Loader } from '@/components/common/Loader';
import { useUsers } from '@/features/users/queries.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './users.module.scss';

const Users: FC = () => {
  const { data: users, isPending } = useUsers();

  if (isPending) return <Loader />;

  return (
    <div>
      <h1 className={styles.title}>Users</h1>
      {users?.map(({ userName, id }) => (
        <Link className={styles.item} to={profilePage(id)} key={id}>
          {userName}
        </Link>
      ))}
    </div>
  );
};

export { Users };

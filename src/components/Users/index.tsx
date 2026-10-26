import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { findAllUser } from '@/components/Users/api';
import { Loader } from '@/components/common/Loader';
import { queryKeys } from '@/api/query-keys.ts';
import { Link } from 'react-router-dom';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './users.module.scss';

const Users: FC = () => {
  const { data: resData, isPending } = useQuery({
    queryKey: queryKeys.users(),
    queryFn: async () => (await findAllUser()).data,
  });

  if (isPending) return <Loader />;

  return (
    <div>
      <h1 className={styles.title}>Users</h1>
      {resData?.map(({ userName, id }) => (
        <Link className={styles.item} to={profilePage(id)} key={id}>
          {userName}
        </Link>
      ))}
    </div>
  );
};

export { Users };

import { FC } from 'react';
import { useQuery } from 'react-query';
import { findAllUser } from '@/components/Users/api';
import { Loader } from '@/components/common/Loader';
import { UserDataTypes } from '@/types/user.ts';
import { Link } from 'react-router-dom';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './users.module.scss';

const Users: FC = () => {
  const { data: resData, isLoading } = useQuery<UserDataTypes[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await findAllUser();

      return response?.data;
    },
  });

  console.log(resData);

  if (isLoading) {
    <Loader />;
  }

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

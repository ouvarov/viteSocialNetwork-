import { FC } from 'react';
import { useQuery } from 'react-query';
import { getUser } from '@/components/Profile/api';

const Profile: FC = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUser().then((res) => res),
  });

  console.log(data);

  if (isPending) return 'Loading...';

  if (error) return 'An error has occurred: ';

  return <div>fdfd</div>;
};

export { Profile };

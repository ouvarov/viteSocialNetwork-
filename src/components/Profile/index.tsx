import { FC } from 'react';
import { ProfileInfo } from '@/components/Profile/components/ProfileInfo';
import { Post } from '@/components/Profile/components/Post';

const Profile: FC = () => {
  return (
    <div>
      <ProfileInfo />
      <Post />
    </div>
  );
};

export { Profile };

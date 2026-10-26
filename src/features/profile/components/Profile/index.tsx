import type { FC } from 'react';

import { Posts } from '@/features/posts/components/Posts';
import { ProfileInfo } from '@/features/profile/components/ProfileInfo';

const Profile: FC = () => (
  <div>
    <ProfileInfo />
    <Posts />
  </div>
);

export { Profile };

import type { FC } from 'react';
import { useParams } from 'react-router';

import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/auth/useAuth.ts';
import { PostComposer } from '@/features/posts/components/PostComposer';
import { Posts } from '@/features/posts/components/Posts';
import { ProfileInfo } from '@/features/profile/components/ProfileInfo';
import { useUser } from '@/features/users/queries.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';

import styles from './profile.module.scss';

const Profile: FC = () => {
  const { userId = '' } = useParams();
  const { user } = useAuth();
  const { data: profile, isPending, isError, error, refetch } = useUser(userId);

  useDocumentTitle(profile?.userName ?? 'Profile');

  if (isError) {
    return (
      <ErrorState
        title="Could not load this profile"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const isOwnProfile = userId === user?.id;

  return (
    <div className={styles.profile}>
      {isPending ? (
        <Loader label="Loading profile" />
      ) : (
        <ProfileInfo profile={profile} isOwnProfile={isOwnProfile} />
      )}
      {isOwnProfile && <PostComposer userId={userId} />}
      <Posts userId={userId} isOwnProfile={isOwnProfile} />
    </div>
  );
};

export { Profile };

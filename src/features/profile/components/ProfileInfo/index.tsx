import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { DeleteAccount } from '@/features/auth/components/DeleteAccount';
import { useCreateChat } from '@/features/chat/queries.ts';
import { FollowButton } from '@/features/follows/components/FollowButton';
import { followersLabel } from '@/features/follows/followers-label.ts';
import type { ProfileTypes } from '@/features/follows/types.ts';
import { EditProfileDialog } from '@/features/profile/components/EditProfileDialog';
import { chatPage } from '@/routes/routePaths.ts';

import styles from './profile_info.module.scss';

type ProfileInfoProps = {
  profile: ProfileTypes;
  isOwnProfile: boolean;
};

const ProfileInfo: FC<ProfileInfoProps> = ({ profile, isOwnProfile }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const {
    mutate: createChat,
    isPending,
    error: createChatError,
  } = useCreateChat();

  const handleStartChat = () => {
    createChat(profile.id, {
      onSuccess: ({ chatId }) => void navigate(chatPage(chatId)),
    });
  };

  return (
    <section className={styles.profile_info}>
      <Avatar
        userId={profile.id}
        userName={profile.userName}
        imageUrl={profile.imageUrl}
        size="xl"
      />
      <div className={styles.profile_info__body}>
        <h1 className={styles.profile_info__name}>{profile.userName}</h1>
        {profile.description && (
          <p className={styles.profile_info__description}>
            {profile.description}
          </p>
        )}
        <p className={styles.profile_info__stats}>
          <span>
            <strong>{profile.followersCount}</strong>{' '}
            {followersLabel(profile.followersCount)}
          </span>
          {' · '}
          <span>
            <strong>{profile.followingCount}</strong> following
          </span>
        </p>
      </div>
      <div className={styles.profile_info__actions}>
        {isOwnProfile ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit profile
            </Button>
            <DeleteAccount />
          </>
        ) : (
          <>
            <FollowButton
              userId={profile.id}
              userName={profile.userName}
              isFollowedByMe={profile.isFollowedByMe}
            />
            <Button
              variant="secondary"
              size="sm"
              isLoading={isPending}
              onClick={handleStartChat}
            >
              Send message
            </Button>
          </>
        )}
      </div>
      {createChatError && (
        <p className={styles.profile_info__error} role="alert">
          {getApiErrorMessage(createChatError, 'Could not start a chat')}
        </p>
      )}
      {isEditing && (
        <EditProfileDialog
          profile={profile}
          onClose={() => setIsEditing(false)}
        />
      )}
    </section>
  );
};

export { ProfileInfo };

import type { FC } from 'react';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { UserIcon } from '@/components/common/UserIcon';
import { useCreateChat } from '@/features/chat/queries.ts';
import type { UserDataTypes } from '@/features/users/types.ts';
import { chatPage } from '@/routes/routePaths.ts';

import styles from './profile_info.module.scss';

type ProfileInfoProps = {
  profile: UserDataTypes;
  isOwnProfile: boolean;
};

const ProfileInfo: FC<ProfileInfoProps> = ({ profile, isOwnProfile }) => {
  const navigate = useNavigate();
  const {
    mutate: createChat,
    isPending,
    error: createChatError,
  } = useCreateChat();

  const handleStartChat = () => {
    createChat([profile.id], {
      onSuccess: ({ chatId }) => void navigate(chatPage(chatId)),
    });
  };

  return (
    <section className={styles.profile_info}>
      <UserIcon imageUrl={profile.imageUrl} size={96} />
      <div className={styles.profile_info__body}>
        <h1 className={styles.profile_info__name}>{profile.userName}</h1>
        {profile.description && (
          <p className={styles.profile_info__description}>
            {profile.description}
          </p>
        )}
      </div>
      {!isOwnProfile && (
        <Button isLoading={isPending} onClick={handleStartChat}>
          Send message
        </Button>
      )}
      {createChatError && (
        <p className={styles.profile_info__error} role="alert">
          {getApiErrorMessage(createChatError, 'Could not start a chat')}
        </p>
      )}
    </section>
  );
};

export { ProfileInfo };

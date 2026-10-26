import type { FC } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Button } from '@/components/common/Button';
import { UserIcon } from '@/components/common/UserIcon';
import { useAuth } from '@/features/auth/useAuth.ts';
import { useCreateChat } from '@/features/chat/queries.ts';
import { useUser } from '@/features/users/queries.ts';
import { chatPage } from '@/routes/routePaths.ts';

const ProfileInfo: FC = () => {
  const { user, logout } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data: profile } = useUser(userId);
  const { mutate: createChat } = useCreateChat();

  if (!user || !profile) return null;

  const isOwnerProfile = profile.id === user.id;

  const handleStartChat = () => {
    createChat([profile.id], {
      onSuccess: ({ chatId }) => void navigate(chatPage(chatId)),
    });
  };

  return (
    <div>
      <div>
        <UserIcon imageUrl={profile.imageUrl ?? undefined} />
        <div>{profile.userName}</div>
      </div>
      {isOwnerProfile && <Button onClick={logout}>Logout</Button>}
      {!isOwnerProfile && <Button onClick={handleStartChat}>start chat</Button>}
    </div>
  );
};

export { ProfileInfo };

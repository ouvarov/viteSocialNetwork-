import { FC, useEffect } from 'react';

import { useAuth } from '@/providers/AuthProvider.tsx';
import { Button } from '@/components/common/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { UserIcon } from '@/components/common/UserIcon';
import { useCreateChat } from '@/components/Chat/api';
import { chatPage } from '@/routes/routePaths.ts';

const ProfileInfo: FC = () => {
  const { user, logout } = useAuth();
  const { userId } = useParams();
  const { mutate: createChatMutation, data: chatData } = useCreateChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (chatData) {
      navigate(chatPage(chatData));
    }
  }, [chatData]);

  if (!user) return null;

  const isOwnerProfile = userId === user.id;

  const handleStartChat = () => {
    if (userId) {
      createChatMutation([userId, user.id]);
    }
  };

  return (
    <div>
      <div>
        <UserIcon imageUrl={user.imageUrl} />
        <div>{user.userName}</div>
        <Button onClick={() => {}} isDisabled={isOwnerProfile}>
          {user?.followers?.length || 0}
        </Button>
        <div>{user?.following?.length || 0}</div>
      </div>
      {isOwnerProfile && <Button onClick={logout}>Logout</Button>}
      {!isOwnerProfile && <Button onClick={handleStartChat}>start chat</Button>}
    </div>
  );
};

export { ProfileInfo };

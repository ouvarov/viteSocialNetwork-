import { FC } from 'react';

import { useAuth } from '@/providers/AuthProvider.tsx';
import { Button } from '@/components/common/Button';
import { useParams } from 'react-router-dom';
import { UserIcon } from '@/components/common/UserIcon';
import { socket } from '@/api';

const ProfileInfo: FC = () => {
  const { user, logout } = useAuth();
  const { userId } = useParams();

  if (!user) return null;

  const isOwnerProfile = userId === user.id;

  const handleStartChat = () => {
    const createChatDto = {
      userIds: [userId, user.id],
    };

    socket.emit('createChat', createChatDto, (response: any) => {
      console.log('Server response:', response);
    });
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

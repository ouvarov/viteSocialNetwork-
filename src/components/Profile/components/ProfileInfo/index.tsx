import { FC } from 'react';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { Button } from '@/components/common/Button';
import { useParams } from 'react-router-dom';
import { UserIcon } from '@/components/common/UserIcon';

const ProfileInfo: FC = () => {
  const { user, logout } = useAuth();
  const { userId } = useParams();

  if (!user) return null;

  const isOwnerProfile = userId === user.id;

  return (
    <div>
      <div>
        <UserIcon imageUrl={user.imageUrl} />
        <div>{user.userName}</div>
        <Button onClick={() => {}} isDisabled={isOwnerProfile}>
          {user.followers.length}
        </Button>
        <div>{user.following.length}</div>
      </div>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
};

export { ProfileInfo };

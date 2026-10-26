import type { FC } from 'react';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/providers/useAuth.ts';
import { Button } from '@/components/common/Button';
import { UserIcon } from '@/components/common/UserIcon';
import { useCreateChat } from '@/components/Chat/api';
import { getUser } from '@/components/Profile/api';
import { chatPage } from '@/routes/routePaths.ts';

const ProfileInfo: FC = () => {
  const { user, logout } = useAuth();
  const { userId } = useParams();
  const { mutate: createChatMutation, data: chatData } = useCreateChat();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => (await getUser(String(userId))).data,
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (chatData) {
      navigate(chatPage(chatData.chatId));
    }
  }, [chatData, navigate]);

  if (!user || !profile) return null;

  const isOwnerProfile = profile.id === user.id;

  const handleStartChat = () => {
    createChatMutation([profile.id, user.id]);
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

import type { FC } from 'react';
import { Link } from 'react-router';

import { Loader } from '@/components/common/Loader';
import { useChats } from '@/features/chat/queries.ts';
import { chatPage } from '@/routes/routePaths.ts';

const Chats: FC = () => {
  const { data: chats, isPending } = useChats();

  if (isPending) return <Loader />;

  return (
    <div>
      {chats?.map(({ chatId, chatName }) => (
        <Link to={chatPage(chatId)} key={chatId}>
          {chatName}
        </Link>
      ))}
    </div>
  );
};

export { Chats };

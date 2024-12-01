import { FC } from 'react';
import { useQuery } from 'react-query';
import { ChatsDataTypes } from '@/types/chat.ts';
import { getAllChat } from '@/components/Chat/api';
import { Loader } from '@/components/common/Loader';
import { Link } from 'react-router-dom';
import { chatPage } from '@/routes/routePaths.ts';

const Chats: FC = () => {
  const { data: resData, isLoading } = useQuery<ChatsDataTypes[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await getAllChat();

      return response?.data;
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div>
      {resData?.map(({ chat_id, chat_name }) => (
        <Link to={chatPage(chat_id)} key={chat_id}>
          {chat_name}
        </Link>
      ))}
    </div>
  );
};

export { Chats };

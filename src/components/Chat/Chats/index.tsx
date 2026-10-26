import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys.ts';
import { getAllChat } from '@/components/Chat/api';
import { Loader } from '@/components/common/Loader';
import { Link } from 'react-router';
import { chatPage } from '@/routes/routePaths.ts';

const Chats: FC = () => {
  const { data: resData, isPending } = useQuery({
    queryKey: queryKeys.chats(),
    queryFn: async () => (await getAllChat()).data,
  });

  if (isPending) return <Loader />;

  return (
    <div>
      {resData?.map(({ chatId, chatName }) => (
        <Link to={chatPage(chatId)} key={chatId}>
          {chatName}
        </Link>
      ))}
    </div>
  );
};

export { Chats };

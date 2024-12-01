import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { getChat } from '@/components/Chat/api';
import { useParams } from 'react-router-dom';
import { Loader } from '@/components/common/Loader';
import { ChatDataTypes } from '@/types/chat.ts';
import Textarea from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { socket } from '@/api';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { Message } from '@/components/Chat/components/Message';

const Chat: FC = () => {
  const [messages, setMessages] = useState<ChatDataTypes[]>([]);
  const [message, setMessage] = useState('');
  const { chatId } = useParams();
  const { user } = useAuth();

  const { data: resData, isLoading } = useQuery<ChatDataTypes[]>({
    queryKey: [`chat${chatId}`],
    queryFn: async () => {
      const response = await getChat(String(chatId));

      return response?.data;
    },
  });

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    const createMessageDto = {
      chatId,
      senderId: user?.id,
      content: message,
    };

    socket.emit('createMessage', createMessageDto);

    setMessage('');
  };

  const handleOnChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setMessage(e.target.value);
  };

  useEffect(() => {
    if (resData) {
      setMessages(resData);
    }
  }, [resData]);

  useEffect(() => {
    socket.emit('joinChat', { chatId });
  }, [chatId]);

  useEffect(() => {
    const saveMessage = (message: ChatDataTypes) => {
      setMessages((prevState) => [...prevState, message]);
    };
    socket.on('newMessage', saveMessage);

    return () => {
      socket.off('newMessage', saveMessage);
    };
  }, []);

  if (isLoading) return <Loader />;

  return (
    <div>
      {messages?.map((item) => <Message {...item} key={item.message_id} />)}

      <form onSubmit={handleOneSubmit}>
        <Textarea
          name="message"
          id="message"
          onChange={handleOnChange}
          value={message}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export { Chat };

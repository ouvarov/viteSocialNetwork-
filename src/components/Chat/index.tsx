import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { deleteChat, getChat, renameChat } from '@/components/Chat/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@/components/common/Loader';
import { ChatDataTypes, MessagesDataTypes } from '@/types/chat.ts';
import Textarea from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { socket } from '@/api';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { Message } from '@/components/Chat/components/Message';

import { profilePage } from '@/routes/routePaths.ts';
import Input from '@/components/common/Input';

import styles from './chat.module.scss';

const Chat: FC = () => {
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<MessagesDataTypes[]>([]);
  const [nameChat, setNameChat] = useState('');
  const [message, setMessage] = useState('');
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: resData, isLoading } = useQuery<ChatDataTypes>({
    queryKey: [`chat${chatId}`],
    queryFn: async () => {
      const response = await getChat(String(chatId));

      return response?.data;
    },
  });

  const { mutate: deleteChatMutate } = useMutation(deleteChat, {
    onSuccess: () => {
      queryClient.invalidateQueries([`chat${chatId}`]);
      queryClient.invalidateQueries([`chats`]);
      navigate(profilePage(String(user?.id)));
    },
  });

  const { mutate: renameChatMutate } = useMutation(renameChat, {
    onSuccess: () => {
      queryClient.invalidateQueries([`chat${chatId}`]);
      queryClient.invalidateQueries([`chats`]);
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

  const handleOnRename = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    const body = {
      chatId: String(chatId),
      newChatName: nameChat,
    };

    renameChatMutate(body);
  };

  const handleOnRemove = () => {
    deleteChatMutate(String(chatId));
  };

  useEffect(() => {
    if (resData) {
      setMessages(resData?.messages);
    }
  }, [resData]);

  useEffect(() => {
    socket.emit('joinChat', { chatId });
  }, [chatId]);

  useEffect(() => {
    const saveMessage = (message: MessagesDataTypes) => {
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
      {resData?.chatName && (
        <h2 className={styles.title}>{resData.chatName}</h2>
      )}
      <div>
        <Button onClick={handleOnRemove}>remove chat</Button>
      </div>
      <div>
        <form onSubmit={handleOnRename}>
          <Input
            id="nameChat"
            name="nameChat"
            value={nameChat}
            onChange={(e) => setNameChat(e.target.value)}
          />
          <Button type="submit">Rename Chat</Button>
        </form>
      </div>
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

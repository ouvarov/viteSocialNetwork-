import type { ChangeEvent, FC } from 'react';
import type React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/features/auth/useAuth.ts';
import { Message } from '@/features/chat/components/Message';
import {
  useChat,
  useDeleteChat,
  useRenameChat,
} from '@/features/chat/queries.ts';
import { useChatRoom } from '@/features/chat/useChatRoom.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './chat.module.scss';

const Chat: FC = () => {
  const [nameChat, setNameChat] = useState('');
  const [message, setMessage] = useState('');
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: chat, isPending } = useChat(chatId);
  const { messages, sendMessage } = useChatRoom(chatId, chat?.messages);
  const { mutate: deleteChat } = useDeleteChat();
  const { mutate: renameChat } = useRenameChat();

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    sendMessage(message);
    setMessage('');
  };

  const handleOnChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setMessage(e.target.value);
  };

  const handleOnRename = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    renameChat({ chatId: String(chatId), newChatName: nameChat });
  };

  const handleOnRemove = () => {
    deleteChat(String(chatId), {
      onSuccess: () => void navigate(profilePage(String(user?.id))),
    });
  };

  if (isPending) return <Loader />;

  return (
    <div>
      {chat?.chatName && <h2 className={styles.title}>{chat.chatName}</h2>}
      <div>
        <Button onClick={handleOnRemove}>remove chat</Button>
      </div>
      <div>
        <form onSubmit={handleOnRename}>
          <Input
            id="nameChat"
            name="nameChat"
            label="Chat name"
            value={nameChat}
            onChange={(e) => setNameChat(e.target.value)}
          />
          <Button type="submit">Rename Chat</Button>
        </form>
      </div>
      {messages.map((item) => (
        <Message {...item} key={item.messageId} />
      ))}

      <form onSubmit={handleOneSubmit}>
        <Textarea
          name="message"
          id="message"
          label="Message"
          required
          onChange={handleOnChange}
          value={message}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export { Chat };

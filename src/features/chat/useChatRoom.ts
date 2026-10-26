import { useCallback, useEffect, useState } from 'react';

import { socket } from '@/api/socket.ts';

import type { MessagesDataTypes, NewMessageTypes } from './types.ts';

const useChatRoom = (
  chatId: string | undefined,
  history: MessagesDataTypes[] | undefined,
) => {
  const [messages, setMessages] = useState<MessagesDataTypes[]>([]);

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useEffect(() => {
    if (!chatId) return;

    const joinChat = () => socket.emit('joinChat', { chatId });
    socket.on('connect', joinChat);

    if (socket.connected) joinChat();
    else socket.connect();

    return () => {
      socket.off('connect', joinChat);
      socket.emit('leaveChat', { chatId });
    };
  }, [chatId]);

  useEffect(() => {
    const saveMessage = (message: NewMessageTypes) => {
      if (message.chatId !== chatId) return;
      setMessages((prevState) => [...prevState, message]);
    };
    socket.on('newMessage', saveMessage);

    return () => {
      socket.off('newMessage', saveMessage);
    };
  }, [chatId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!chatId) return;

      socket.emit('createMessage', { chatId, content });
    },
    [chatId],
  );

  return { messages, sendMessage };
};

export { useChatRoom };

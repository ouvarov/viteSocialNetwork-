import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { socket } from '@/api/socket.ts';
import type {
  CreateMessagePayload,
  SocketExceptionPayload,
} from '@/api/socket-events.ts';

import { reloadHistory, saveMessage } from './messages.ts';
import type { NewMessageTypes } from './types.ts';

const SOCKET_TIMEOUT_MS = 5000;

class ChatSocketError extends Error {
  constructor({ message }: SocketExceptionPayload) {
    super(Array.isArray(message) ? message.join('. ') : message);
    this.name = 'ChatSocketError';
  }
}

const joinRoom = (chatId: string) =>
  new Promise<void>((resolve) => {
    socket
      .timeout(SOCKET_TIMEOUT_MS)
      .emit('joinChat', { chatId }, () => resolve());
  });

const createMessage = (payload: CreateMessagePayload) =>
  new Promise<NewMessageTypes>((resolve, reject) => {
    const onException = (error: SocketExceptionPayload) =>
      reject(new ChatSocketError(error));

    socket.once('exception', onException);
    socket
      .timeout(SOCKET_TIMEOUT_MS)
      .emit('createMessage', payload, (timeoutError, message) => {
        socket.off('exception', onException);

        if (timeoutError) reject(timeoutError);
        else resolve(message);
      });
  });

const useChatRoom = (chatId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    let isActive = true;

    const joinChat = async () => {
      await joinRoom(chatId);

      if (isActive) await reloadHistory(queryClient, chatId);
    };
    const onConnect = () => void joinChat();

    socket.on('connect', onConnect);

    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      isActive = false;
      socket.off('connect', onConnect);
      socket.emit('leaveChat', { chatId });
    };
  }, [chatId, queryClient]);

  useEffect(() => {
    if (!chatId) return;

    const onNewMessage = (message: NewMessageTypes) => {
      if (message.chatId !== chatId) return;

      if (!saveMessage(queryClient, chatId, message)) {
        void reloadHistory(queryClient, chatId);
      }
    };

    socket.on('newMessage', onNewMessage);

    return () => {
      socket.off('newMessage', onNewMessage);
    };
  }, [chatId, queryClient]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chatId) return;

      const message = await createMessage({ chatId, content });
      saveMessage(queryClient, chatId, message);
    },
    [chatId, queryClient],
  );

  return { sendMessage };
};

export { ChatSocketError, useChatRoom };

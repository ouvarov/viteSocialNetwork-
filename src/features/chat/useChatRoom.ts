import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { socket } from '@/api/socket.ts';
import type { CreateMessagePayload, SocketError } from '@/api/socket-events.ts';

import { reloadHistory, saveMessage } from './messages.ts';
import type { NewMessageTypes } from './types.ts';

const SOCKET_TIMEOUT_MS = 5000;

class ChatSocketError extends Error {
  readonly statusCode: number;

  constructor({ statusCode, message }: SocketError) {
    super(message);
    this.name = 'ChatSocketError';
    this.statusCode = statusCode;
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
    socket
      .timeout(SOCKET_TIMEOUT_MS)
      .emit('createMessage', payload, (timeoutError, result) => {
        if (timeoutError) return reject(timeoutError);
        if (!result.ok) return reject(new ChatSocketError(result.error));

        resolve(result.data);
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

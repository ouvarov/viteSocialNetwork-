import type { NewMessageTypes } from '@/types/chat.ts';

type ChatRoomPayload = { chatId: string };

type CreateMessagePayload = { chatId: string; content: string };

type SocketExceptionPayload = {
  status: 'error';
  statusCode?: number;
  message: string | string[];
};

type ServerToClientEvents = {
  newMessage: (message: NewMessageTypes) => void;
  exception: (error: SocketExceptionPayload) => void;
};

type ClientToServerEvents = {
  joinChat: (
    payload: ChatRoomPayload,
    ack?: (room: ChatRoomPayload) => void,
  ) => void;
  leaveChat: (
    payload: ChatRoomPayload,
    ack?: (room: ChatRoomPayload) => void,
  ) => void;
  createMessage: (
    payload: CreateMessagePayload,
    ack?: (message: NewMessageTypes) => void,
  ) => void;
};

export type {
  ChatRoomPayload,
  ClientToServerEvents,
  CreateMessagePayload,
  ServerToClientEvents,
  SocketExceptionPayload,
};

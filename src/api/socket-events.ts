import type { Schemas } from './schemas.ts';

type SocketMessage = Schemas['ChatMessageDto'] & { chatId: string };

type ChatRoomPayload = { chatId: string };

type CreateMessagePayload = { chatId: string; content: string };

type SocketExceptionPayload = {
  status: 'error';
  statusCode?: number;
  message: string | string[];
};

type ServerToClientEvents = {
  newMessage: (message: SocketMessage) => void;
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
    ack?: (message: SocketMessage) => void,
  ) => void;
};

export type {
  SocketMessage,
  ChatRoomPayload,
  ClientToServerEvents,
  CreateMessagePayload,
  ServerToClientEvents,
  SocketExceptionPayload,
};

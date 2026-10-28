import type { Schemas } from './schemas.ts';

type SocketMessage = Schemas['ChatMessageDto'] & { chatId: string };

type ChatRoomPayload = { chatId: string };

type CreateMessagePayload = { chatId: string; content: string };

type SocketError = { statusCode: number; message: string };

type SocketAck<Data> =
  { ok: true; data: Data } | { ok: false; error: SocketError };

type ServerToClientEvents = {
  newMessage: (message: SocketMessage) => void;
};

type ClientToServerEvents = {
  joinChat: (
    payload: ChatRoomPayload,
    ack: (result: SocketAck<ChatRoomPayload>) => void,
  ) => void;
  leaveChat: (
    payload: ChatRoomPayload,
    ack?: (result: SocketAck<ChatRoomPayload>) => void,
  ) => void;
  createMessage: (
    payload: CreateMessagePayload,
    ack: (result: SocketAck<SocketMessage>) => void,
  ) => void;
};

export type {
  ChatRoomPayload,
  ClientToServerEvents,
  CreateMessagePayload,
  ServerToClientEvents,
  SocketAck,
  SocketError,
  SocketMessage,
};

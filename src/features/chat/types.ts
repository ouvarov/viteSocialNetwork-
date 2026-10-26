import type { Schemas } from '@/api/schemas.ts';
import type { SocketMessage } from '@/api/socket-events.ts';

export type MessagesDataTypes = Schemas['ChatMessageDto'];

export type NewMessageTypes = SocketMessage;

export type ChatDataTypes = Schemas['ChatDto'];

export type ChatsDataTypes = Schemas['ChatSummaryDto'];

export type RenameChatTypes = Schemas['UpdateChatDto'];

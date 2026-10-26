import type { Schemas } from '@/api/schemas.ts';

export type MessagesDataTypes = Schemas['ChatMessageDto'];

export type NewMessageTypes = MessagesDataTypes & {
  chatId: string;
};

export type ChatDataTypes = Schemas['ChatDto'];

export type ChatsDataTypes = Schemas['ChatSummaryDto'];

export type CreatedChatTypes = Schemas['ChatIdDto'];

export type RenameChatTypes = Schemas['UpdateChatDto'];

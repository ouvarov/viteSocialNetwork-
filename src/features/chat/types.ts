import type { InfiniteData } from '@tanstack/react-query';

import type { Schemas } from '@/api/schemas.ts';
import type { SocketMessage } from '@/api/socket-events.ts';

export type MessagesDataTypes = Schemas['ChatMessageDto'];

export type MessagePageTypes = Schemas['MessagePageDto'];

export type MessagePagesData = InfiniteData<MessagePageTypes>;

export type NewMessageTypes = SocketMessage;

export type ChatDataTypes = Schemas['ChatDto'];

export type ChatsDataTypes = Schemas['ChatSummaryDto'];

export type ChatPeerTypes = Schemas['ChatPeerDto'];

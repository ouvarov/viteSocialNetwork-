export type MessagesDataTypes = {
  messageId: string;
  senderId: string;
  content: string;
  sentAt: string;
};

export type NewMessageTypes = MessagesDataTypes & {
  chatId: string;
};

export type ChatDataTypes = {
  chatName: string;
  messages: MessagesDataTypes[];
};

export type ChatsDataTypes = {
  chatId: string;
  chatName: string | null;
};

export type CreatedChatTypes = {
  chatId: string;
};

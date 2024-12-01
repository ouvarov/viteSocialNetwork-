export type MessagesDataTypes = {
  chat_created_at: Date;
  chat_id: string;
  content: string;
  message_id: string;
  sender_id: string;
  sent_at: Date;
};

export type ChatDataTypes = {
  chatName: string;
  messages: MessagesDataTypes[];
};

export type ChatsDataTypes = {
  chat_id: string;
  chat_name: string;
};

import { z } from 'zod';

import type { CreateMessagePayload } from '@/api/socket-events.ts';

import type { RenameChatTypes } from './types.ts';

const MAX_CHAT_NAME_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 2000;

const renameChatSchema = z.object({
  newChatName: z
    .string()
    .trim()
    .min(1, 'Enter a chat name')
    .max(
      MAX_CHAT_NAME_LENGTH,
      `Keep it under ${MAX_CHAT_NAME_LENGTH} characters`,
    ),
}) satisfies z.ZodType<Omit<RenameChatTypes, 'chatId'>>;

const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write a message first')
    .max(MAX_MESSAGE_LENGTH, `Keep it under ${MAX_MESSAGE_LENGTH} characters`),
}) satisfies z.ZodType<Omit<CreateMessagePayload, 'chatId'>>;

type RenameChatFormValues = z.infer<typeof renameChatSchema>;
type MessageFormValues = z.infer<typeof messageSchema>;

export { messageSchema, renameChatSchema };
export type { MessageFormValues, RenameChatFormValues };

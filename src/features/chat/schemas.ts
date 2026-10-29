import { z } from 'zod';

import type { CreateMessagePayload } from '@/api/socket-events.ts';

const MAX_MESSAGE_LENGTH = 2000;

const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write a message first')
    .max(MAX_MESSAGE_LENGTH, `Keep it under ${MAX_MESSAGE_LENGTH} characters`),
}) satisfies z.ZodType<Omit<CreateMessagePayload, 'chatId'>>;

type MessageFormValues = z.infer<typeof messageSchema>;

export { messageSchema };
export type { MessageFormValues };

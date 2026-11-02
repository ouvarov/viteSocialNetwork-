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

const MAX_GROUP_TITLE_LENGTH = 100;

const groupTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Name the group')
    .max(
      MAX_GROUP_TITLE_LENGTH,
      `Keep it under ${MAX_GROUP_TITLE_LENGTH} characters`,
    ),
});

type MessageFormValues = z.infer<typeof messageSchema>;

type GroupTitleFormValues = z.infer<typeof groupTitleSchema>;

export { groupTitleSchema, messageSchema };
export type { GroupTitleFormValues, MessageFormValues };

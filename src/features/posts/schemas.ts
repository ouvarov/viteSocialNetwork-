import { z } from 'zod';

import type { ResPostTypes } from './types.ts';

const MAX_POST_TEXT_LENGTH = 2000;

const postSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Write something first')
    .max(
      MAX_POST_TEXT_LENGTH,
      `Keep it under ${MAX_POST_TEXT_LENGTH} characters`,
    ),
  imageUrl: z.url().optional(),
}) satisfies z.ZodType<ResPostTypes>;

type PostFormValues = z.infer<typeof postSchema>;

export { postSchema };
export type { PostFormValues };

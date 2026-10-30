import { z } from 'zod';

const MAX_USER_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 300;

const profileSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, 'Enter your name')
    .max(
      MAX_USER_NAME_LENGTH,
      `Keep it under ${MAX_USER_NAME_LENGTH} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Keep it under ${MAX_DESCRIPTION_LENGTH} characters`,
    ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export { MAX_DESCRIPTION_LENGTH, profileSchema };
export type { ProfileFormValues };

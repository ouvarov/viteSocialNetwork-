import { z } from 'zod';

import type { LoginTypes, SignUpTypes } from './types.ts';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .pipe(z.email('Enter a valid email'));

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
}) satisfies z.ZodType<LoginTypes>;

const signUpSchema = z.object({
  userName: z.string().trim().min(1, 'Enter your name'),
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `Use at most ${MAX_PASSWORD_LENGTH} characters`),
}) satisfies z.ZodType<SignUpTypes>;

type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export { loginSchema, signUpSchema };
export type { LoginFormValues, SignUpFormValues };

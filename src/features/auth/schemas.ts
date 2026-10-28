import { z } from 'zod';

import type { LoginTypes, SignUpTypes } from './types.ts';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const MAX_USER_NAME_LENGTH = 50;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

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
  userName: z
    .string()
    .trim()
    .min(1, 'Enter your name')
    .max(
      MAX_USER_NAME_LENGTH,
      `Use at most ${MAX_USER_NAME_LENGTH} characters`,
    ),
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
    .refine(
      (value) => byteLength(value) <= MAX_PASSWORD_BYTES,
      'Password is too long',
    ),
}) satisfies z.ZodType<SignUpTypes>;

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export { deleteAccountSchema, loginSchema, signUpSchema };
export type { DeleteAccountFormValues, LoginFormValues, SignUpFormValues };

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';

import type { AuthResponseTypes, LoginTypes, SignUpTypes } from './types.ts';

const registerUser = (body: SignUpTypes): Promise<AuthResponseTypes> =>
  unwrap(client.POST('/api/auth/register', { body }));

const loginUser = (body: LoginTypes): Promise<AuthResponseTypes> =>
  unwrap(client.POST('/api/auth/login', { body }));

const logoutUser = async (): Promise<void> => {
  await unwrap(client.POST('/api/auth/logout'));
};

const deleteAccount = async (password: string): Promise<void> => {
  await unwrap(client.DELETE('/api/users/me', { body: { password } }));
};

export { deleteAccount, loginUser, logoutUser, registerUser };

import type { AxiosResponse } from 'axios';

import { api } from '@/api';
import type {
  AuthResponseTypes,
  LoginTypes,
  SignUpTypes,
} from '@/types/auth.ts';

const createUser = ({
  email,
  password,
  userName,
}: SignUpTypes): Promise<AxiosResponse<AuthResponseTypes>> =>
  api.post('auth/register', { email, password, userName });

const validateToken = (): Promise<AxiosResponse<AuthResponseTypes>> =>
  api.post('auth/refresh');

const logoutUser = (): Promise<AxiosResponse<void>> => api.post('auth/logout');

const loginUser = ({
  email,
  password,
}: LoginTypes): Promise<AxiosResponse<AuthResponseTypes>> =>
  api.post('auth/login', { email, password });

export { createUser, validateToken, loginUser, logoutUser };

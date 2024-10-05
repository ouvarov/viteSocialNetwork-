import { AxiosResponse } from 'axios';

import { api } from '@/api';
import { AuthTypes } from '@/types/auth';
import { UserDataTypes } from '@/types/user';

const createUser = (
  data: AuthTypes,
): Promise<
  AxiosResponse<{ userData: UserDataTypes; access_token: string }>
> => {
  const { email, password, userName } = data;

  return api.post<AuthTypes>('auth/create', { email, password, userName });
};

const validateToken = (): Promise<
  AxiosResponse<{ userData: UserDataTypes; access_token: string }>
> => {
  return api.get('auth/validate-refresh');
};

const logout = (): Promise<null> => {
  return api.post<AuthTypes>('auth/logout');
};

const loginUser = (
  data: AuthTypes,
): Promise<
  AxiosResponse<{ userData: UserDataTypes; access_token: string }>
> => {
  const { email, password } = data;

  return api.post<AuthTypes>('auth/login', { email, password });
};

export { createUser, validateToken, logout, loginUser };

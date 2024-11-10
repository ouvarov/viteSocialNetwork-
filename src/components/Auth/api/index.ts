import { AxiosResponse } from 'axios';

import { api } from '@/api';
import { LoginTypes, SignUpTypes } from '@/types/auth';
import { UserDataTypes } from '@/types/user';

const createUser = (
  data: SignUpTypes,
): Promise<
  AxiosResponse<{ userData: UserDataTypes; access_token: string }>
> => {
  const { email, password, userName } = data;

  return api.post('auth/create', { email, password, userName });
};

const validateToken = (): Promise<
  AxiosResponse<{ userData: UserDataTypes; access_token: string }>
> => {
  return api.get('auth/validate-refresh');
};

const logoutUser = (): Promise<null> => {
  return api.post('auth/logout');
};

const loginUser = (
  data: LoginTypes,
): Promise<
  AxiosResponse<{ userData: UserDataTypes; access_token: string }>
> => {
  const { email, password } = data;

  return api.post('auth/login', { email, password });
};

export { createUser, validateToken, loginUser, logoutUser };

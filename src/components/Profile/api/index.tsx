import { api } from '@/api';
import { AxiosResponse } from 'axios';

const getUser = (): Promise<AxiosResponse<any>> => {
  return api.get<any>('user/users');
};

export { getUser };

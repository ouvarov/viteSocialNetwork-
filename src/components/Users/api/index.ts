import { AxiosResponse } from 'axios';
import { api } from '@/api';

const findAllUser = (): Promise<AxiosResponse> => {
  return api.get('user/all');
};

export { findAllUser };

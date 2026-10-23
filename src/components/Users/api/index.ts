import type { AxiosResponse } from 'axios';

import { api } from '@/api';
import type { UserDataTypes } from '@/types/user.ts';

const findAllUser = (): Promise<AxiosResponse<UserDataTypes[]>> =>
  api.get('users');

export { findAllUser };

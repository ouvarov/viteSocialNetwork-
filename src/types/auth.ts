import { UserDataTypes } from '@/types/user.ts';

export type AuthTypes = {
  email?: string;
  password?: string;
  accessToken?: string;
  userName?: string;
  userData?: UserDataTypes;
  access_token?: string;
};

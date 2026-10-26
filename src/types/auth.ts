import type { Schemas } from '@/api/schemas.ts';
import type { UserDataTypes } from '@/types/user.ts';

export type LoginTypes = Schemas['LoginAuthDto'];

export type SignUpTypes = Schemas['CreateAuthDto'];

export type AuthContextType = {
  user: UserDataTypes | null;
  login: ({
    user,
    access_token,
  }: {
    user: UserDataTypes;
    access_token: string;
  }) => void;
  logout: () => void;
  checkUser: () => void;
  isLoading: boolean;
};

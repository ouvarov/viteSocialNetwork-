import type { Schemas } from '@/api/schemas.ts';
import type { UserDataTypes } from '@/features/users/types.ts';

export type LoginTypes = Schemas['LoginAuthDto'];

export type SignUpTypes = Schemas['CreateAuthDto'];

export type AuthResponseTypes = Schemas['AuthResponseDto'];

export type AuthContextType = {
  user: UserDataTypes | null;
  login: (session: AuthResponseTypes) => void;
  logout: () => void;
  checkUser: () => void;
  isLoading: boolean;
};

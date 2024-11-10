import { UserDataTypes } from '@/types/user.ts';

export type LoginTypes = {
  email: string;
  password: string;
};

export type SignUpTypes = {
  email: string;
  password: string;
  userName: string;
};

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

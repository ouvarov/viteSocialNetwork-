import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ACCESS_TOKEN_KEY, socket } from '@/api';
import { logoutUser, validateToken } from '@/components/Auth/api';
import type { AuthContextType } from '@/types/auth.ts';
import type { UserDataTypes } from '@/types/user.ts';

import { AuthContext } from './useAuth.ts';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserDataTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback<AuthContextType['login']>(
    ({ user, access_token }) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      setUser(user);
      setIsLoading(false);
    },
    [],
  );

  const logout = useCallback(() => {
    void logoutUser()
      .catch(() => undefined)
      .finally(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        socket.disconnect();
        setUser(null);
      });
  }, []);

  const checkUser = useCallback(() => {
    setIsLoading(true);

    validateToken()
      .then((res) => {
        login({ user: res.data.userData, access_token: res.data.access_token });
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [login]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const value = useMemo(
    () => ({ user, login, logout, checkUser, isLoading }),
    [user, login, logout, checkUser, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };

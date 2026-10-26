import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { clearAccessToken, saveAccessToken } from '@/api/access-token.ts';
import { socket } from '@/api/socket.ts';
import type { UserDataTypes } from '@/features/users/types.ts';

import { logoutUser, refreshSession } from './api.ts';
import type { AuthContextType } from './types.ts';
import { AuthContext } from './useAuth.ts';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserDataTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const login = useCallback<AuthContextType['login']>(
    ({ userData, access_token }) => {
      saveAccessToken(access_token);
      setUser(userData);
      setIsLoading(false);
    },
    [],
  );

  const logout = useCallback(() => {
    void logoutUser()
      .catch(() => undefined)
      .finally(() => {
        clearAccessToken();
        socket.disconnect();
        queryClient.clear();
        setUser(null);
      });
  }, [queryClient]);

  const checkUser = useCallback(() => {
    setIsLoading(true);

    refreshSession()
      .then(login)
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

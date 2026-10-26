import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { clearAccessToken, saveAccessToken } from '@/api/access-token.ts';
import { onSessionExpired, refreshSession } from '@/api/session.ts';
import { socket } from '@/api/socket.ts';
import type { UserDataTypes } from '@/features/users/types.ts';

import { logoutUser } from './api.ts';
import type { AuthContextType } from './types.ts';
import { AuthContext } from './useAuth.ts';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserDataTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSignedOut, setHasSignedOut] = useState(false);
  const queryClient = useQueryClient();

  const login = useCallback<AuthContextType['login']>(
    ({ userData, access_token }) => {
      saveAccessToken(access_token);
      setUser(userData);
      setHasSignedOut(false);
      setIsLoading(false);
    },
    [],
  );

  const resetSession = useCallback(() => {
    clearAccessToken();
    socket.disconnect();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const logout = useCallback(() => {
    void logoutUser()
      .catch(() => undefined)
      .finally(() => {
        setHasSignedOut(true);
        resetSession();
      });
  }, [resetSession]);

  const checkUser = useCallback(() => {
    setIsLoading(true);

    refreshSession()
      .then(({ userData }) => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => onSessionExpired(resetSession), [resetSession]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const value = useMemo(
    () => ({ user, login, logout, checkUser, isLoading, hasSignedOut }),
    [user, login, logout, checkUser, isLoading, hasSignedOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { saveAccessToken } from '@/api/access-token.ts';
import { isUnauthorizedError } from '@/api/errors.ts';
import { endSession, onSessionEnd, refreshSession } from '@/api/session.ts';
import { wakeApi } from '@/api/wake.ts';
import { SessionError } from '@/components/SessionError';
import type { UserDataTypes } from '@/features/users/types.ts';

import { logoutUser } from './api.ts';
import type { AuthContextType } from './types.ts';
import { AuthContext } from './useAuth.ts';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserDataTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerUnreachable, setIsServerUnreachable] = useState(false);
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
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const logout = useCallback(() => {
    void logoutUser()
      .catch(() => undefined)
      .finally(() => {
        setHasSignedOut(true);
        endSession();
      });
  }, []);

  const restoreSession = useCallback(
    () =>
      wakeApi()
        .then(refreshSession)
        .then(({ userData }) => setUser(userData))
        .catch((error: unknown) => {
          if (isUnauthorizedError(error)) setUser(null);
          else setIsServerUnreachable(true);
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  const retrySession = () => {
    setIsServerUnreachable(false);
    setIsLoading(true);
    void restoreSession();
  };

  useEffect(() => onSessionEnd(resetSession), [resetSession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      updateUser: setUser,
      isLoading,
      hasSignedOut,
    }),
    [user, login, logout, isLoading, hasSignedOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {isServerUnreachable ? <SessionError onRetry={retrySession} /> : children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };

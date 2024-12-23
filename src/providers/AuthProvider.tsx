import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserDataTypes } from '@/types/user';
import { logoutUser, validateToken } from '@/components/Auth/api';
import { AuthContextType } from '@/types/auth.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserDataTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = ({
    user,
    access_token,
  }: {
    user: UserDataTypes;
    access_token: string;
  }): void => {
    localStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN, access_token);
    setUser(user);
    setIsLoading(false);
  };

  // Метод для выхода (очистка состояния и локального хранилища)
  const logout = (): void => {
    logoutUser().finally(() => {
      localStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN);
      setUser(null);
    });
  };

  const checkUser = (): void => {
    validateToken()
      .then((res) => {
        setIsLoading(true);
        login({ user: res.data.userData, access_token: res.data.access_token });
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, checkUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };

import type { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/auth/useAuth.ts';
import { redirectStateFrom } from '@/routes/redirect-state.ts';
import { loginPage } from '@/routes/routePaths.ts';

type PrivateRouteProps = {
  children: ReactNode;
};

const PrivateRoute: FC<PrivateRouteProps> = ({ children }): ReactNode => {
  const { user, isLoading, hasSignedOut } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loader />;

  if (user) return children;

  return (
    <Navigate
      to={loginPage()}
      replace
      state={hasSignedOut ? undefined : redirectStateFrom(location)}
    />
  );
};

export { PrivateRoute };

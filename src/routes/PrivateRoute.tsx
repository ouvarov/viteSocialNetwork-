import { Navigate } from 'react-router';
import { useAuth } from '@/features/auth/useAuth.ts';
import type { ReactNode, FC } from 'react';
import { Loader } from '@/components/common/Loader';
import { loginPage } from '@/routes/routePaths.ts';

type PrivateRouteProps = {
  children: ReactNode;
};

const PrivateRoute: FC<PrivateRouteProps> = ({ children }): ReactNode => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  return user ? children : <Navigate to={loginPage()} replace />;
};

export { PrivateRoute };

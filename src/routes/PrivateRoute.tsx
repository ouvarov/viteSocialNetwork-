import { Navigate } from 'react-router';
import { useAuth } from '@/providers/useAuth.ts';
import type { ReactNode, FC } from 'react';
import { Loader } from '@/components/common/Loader';

type PrivateRouteProps = {
  children: ReactNode;
};

const PrivateRoute: FC<PrivateRouteProps> = ({ children }): ReactNode => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  return user ? children : <Navigate to="/sign-in" replace />;
};

export { PrivateRoute };

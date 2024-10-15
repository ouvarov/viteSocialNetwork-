import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { ReactNode, FC } from 'react';

type PrivateRouteProps = {
  children: ReactNode;
};

const PrivateRoute: FC<PrivateRouteProps> = ({ children }): ReactNode => {
  const { user } = useAuth();

  return user ? children : <Navigate to="/sign-in" replace />;
};

export { PrivateRoute };

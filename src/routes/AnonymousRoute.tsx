import { ReactNode, FC } from 'react';

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { profilePage } from '@/routes/routePaths.ts';

type AnonymousRouteProps = {
  children: ReactNode;
};

const AnonymousRoute: FC<AnonymousRouteProps> = ({ children }): ReactNode => {
  const { user } = useAuth();

  return !user ? children : <Navigate to={profilePage(user.id)} replace />;
};

export { AnonymousRoute };

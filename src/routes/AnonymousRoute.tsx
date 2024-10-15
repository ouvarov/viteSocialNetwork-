import { ReactNode, FC } from 'react';

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { profilePage } from '@/routes/routePaths.ts';
import { Loader } from '@/components/common/Loader';

type AnonymousRouteProps = {
  children: ReactNode;
};

const AnonymousRoute: FC<AnonymousRouteProps> = ({ children }): ReactNode => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  return !user ? children : <Navigate to={profilePage(user.id)} replace />;
};

export { AnonymousRoute };

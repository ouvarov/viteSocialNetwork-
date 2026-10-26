import type { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/auth/useAuth.ts';
import { readRedirectPath } from '@/routes/redirect-state.ts';
import { profilePage } from '@/routes/routePaths.ts';

type AnonymousRouteProps = {
  children: ReactNode;
};

const AnonymousRoute: FC<AnonymousRouteProps> = ({ children }): ReactNode => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loader fullScreen />;

  if (!user) return children;

  return (
    <Navigate
      to={readRedirectPath(location.state) ?? profilePage(user.id)}
      replace
    />
  );
};

export { AnonymousRoute };

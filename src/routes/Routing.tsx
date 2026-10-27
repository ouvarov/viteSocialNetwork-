import type { FC } from 'react';
import type { RouteObject } from 'react-router';
import { Navigate, createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AuthLayout } from '@/components/AuthLayout';
import { Loader } from '@/components/common/Loader';
import { Layout } from '@/components/Layout';
import { NotFound } from '@/components/NotFound';
import { RouteError } from '@/components/RouteError';
import { AnonymousRoute } from '@/routes/AnonymousRoute.tsx';
import { PrivateRoute } from '@/routes/PrivateRoute.tsx';
import {
  chatPage,
  chatsPage,
  loginPage,
  profilePage,
  signUpPage,
  usersPage,
} from '@/routes/routePaths.ts';

const PageLoader: FC = () => <Loader fullScreen />;

const RootError: FC = () => (
  <AuthLayout>
    <RouteError />
  </AuthLayout>
);

const anonymousPages: RouteObject[] = [
  {
    path: loginPage(),
    lazy: async () => ({
      Component: (await import('@/features/auth/components/Login')).Login,
    }),
  },
  {
    path: signUpPage(),
    lazy: async () => ({
      Component: (await import('@/features/auth/components/Registration'))
        .Registration,
    }),
  },
];

const privatePages: RouteObject[] = [
  {
    path: profilePage(':userId'),
    lazy: async () => ({
      Component: (await import('@/features/profile/components/Profile'))
        .Profile,
    }),
  },
  {
    path: usersPage(),
    lazy: async () => ({
      Component: (await import('@/features/users/components/Users')).Users,
    }),
  },
  {
    path: chatsPage(),
    lazy: async () => ({
      Component: (await import('@/features/chat/components/Chats')).Chats,
    }),
  },
  {
    path: chatPage(':chatId'),
    lazy: async () => ({
      Component: (await import('@/features/chat/components/Chat')).Chat,
    }),
  },
];

const router = createBrowserRouter([
  {
    path: '/',
    ErrorBoundary: RootError,
    HydrateFallback: PageLoader,
    children: [
      { index: true, element: <Navigate to={loginPage()} replace /> },
      {
        element: (
          <AnonymousRoute>
            <AuthLayout />
          </AnonymousRoute>
        ),
        children: [{ ErrorBoundary: RouteError, children: anonymousPages }],
      },
      {
        element: (
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        ),
        children: [{ ErrorBoundary: RouteError, children: privatePages }],
      },
      {
        element: <AuthLayout />,
        children: [{ path: '*', Component: NotFound }],
      },
    ],
  },
]);

const Routing: FC = () => <RouterProvider router={router} />;

export { Routing };

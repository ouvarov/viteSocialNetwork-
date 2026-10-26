import type { FC } from 'react';
import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AuthLayout } from '@/components/AuthLayout';
import { Layout } from '@/components/Layout';
import { Login } from '@/features/auth/components/Login';
import { Registration } from '@/features/auth/components/Registration';
import { Chat } from '@/features/chat/components/Chat';
import { Chats } from '@/features/chat/components/Chats';
import { Profile } from '@/features/profile/components/Profile';
import { Users } from '@/features/users/components/Users';
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

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<Navigate to={loginPage()} replace />} />
      <Route
        element={
          <AnonymousRoute>
            <AuthLayout />
          </AnonymousRoute>
        }
      >
        <Route path={loginPage()} element={<Login />} />
        <Route path={signUpPage()} element={<Registration />} />
      </Route>
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path={profilePage(':userId')} element={<Profile />} />
        <Route path={usersPage()} element={<Users />} />
        <Route path={chatsPage()} element={<Chats />} />
        <Route path={chatPage(':chatId')} element={<Chat />} />
      </Route>
    </Route>,
  ),
);

const Routing: FC = () => <RouterProvider router={router} />;

export { Routing };

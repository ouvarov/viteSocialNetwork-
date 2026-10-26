import type { FC } from 'react';
import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { Layout } from '@/components/Layout';
import { Registration } from '@/features/auth/components/Registration';
import { Login } from '@/features/auth/components/Login';
import { AnonymousRoute } from '@/routes/AnonymousRoute.tsx';
import { Profile } from '@/features/profile/components/Profile';
import {
  loginPage,
  signUpPage,
  profilePage,
  usersPage,
  chatPage,
  chatsPage,
} from '@/routes/routePaths.ts';
import { PrivateRoute } from '@/routes/PrivateRoute.tsx';
import { Users } from '@/features/users/components/Users';
import { Chat } from '@/features/chat/components/Chat';
import { Chats } from '@/features/chat/components/Chats';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<Navigate to={loginPage()} replace />} />
      <Route
        path={loginPage()}
        element={
          <AnonymousRoute>
            <Login />
          </AnonymousRoute>
        }
      />
      <Route
        path={signUpPage()}
        element={
          <AnonymousRoute>
            <Registration />
          </AnonymousRoute>
        }
      />
      <Route element={<Layout />}>
        <Route
          path={profilePage(':userId')}
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path={usersPage()}
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path={chatPage(':chatId')}
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path={chatsPage()}
          element={
            <PrivateRoute>
              <Chats />
            </PrivateRoute>
          }
        />
      </Route>
    </Route>,
  ),
);

const Routing: FC = () => <RouterProvider router={router} />;

export { Routing };

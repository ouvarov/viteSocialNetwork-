import { FC } from 'react';
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { Registration } from '@/components/Auth/Registration';
import { Login } from '@/components/Auth/Login';
import { AnonymousRoute } from '@/routes/AnonymousRoute.tsx';
import { Profile } from '@/components/Profile';
import {
  loginPage,
  signUpPage,
  profilePage,
  usersPage,
  chatPage,
  chatsPage,
} from '@/routes/routePaths.ts';
import { PrivateRoute } from '@/routes/PrivateRoute.tsx';
import { Users } from '@/components/Users';
import { Chat } from '@/components/Chat';
import { Chats } from '@/components/Chat/Chats';

const Routing: FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
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
              <Registration />{' '}
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

  return <RouterProvider router={router} />;
};

export { Routing };

import React, { FC } from 'react';
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';

// import { Layout } from '@/components/Layout';
import { Registration } from '@/components/Auth/Registration';
import { Login } from '@/components/Auth/Login';

const Routing: FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Registration />} />
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
};

export { Routing };

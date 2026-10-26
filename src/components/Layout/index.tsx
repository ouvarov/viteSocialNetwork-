import type { FC } from 'react';
import { NavLink, Outlet } from 'react-router';

import {
  chatsPage,
  loginPage,
  signUpPage,
  usersPage,
} from '@/routes/routePaths.ts';

import styles from './layout.module.scss';

const Layout: FC = () => {
  const handleClassName = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.link} ${styles.link_active}` : styles.link;

  return (
    <div>
      <header>
        <nav>
          <NavLink to={loginPage()} className={handleClassName}>
            login
          </NavLink>
          <NavLink to={signUpPage()} className={handleClassName}>
            registration
          </NavLink>
          <NavLink to={usersPage()} className={handleClassName}>
            users
          </NavLink>
          <NavLink to={chatsPage()} className={handleClassName}>
            chats
          </NavLink>
        </nav>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export { Layout };

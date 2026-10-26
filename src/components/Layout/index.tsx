import type { FC } from 'react';
import { NavLink, Outlet } from 'react-router';

import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
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
      <header className={styles.header}>
        <nav className={styles.nav}>
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
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export { Layout };

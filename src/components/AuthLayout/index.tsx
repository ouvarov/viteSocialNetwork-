import type { FC, ReactNode } from 'react';
import { Outlet } from 'react-router';

import { ThemeToggle } from '@/features/theme/components/ThemeToggle';

import styles from './auth_layout.module.scss';

type AuthLayoutProps = {
  children?: ReactNode;
};

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => (
  <div className={styles.auth_layout}>
    <header className={styles.auth_layout__header}>
      <span className={styles.auth_layout__brand}>Pulse</span>
      <ThemeToggle />
    </header>
    <main className={styles.auth_layout__main}>{children ?? <Outlet />}</main>
  </div>
);

export { AuthLayout };

import type { FC } from 'react';
import { Outlet } from 'react-router';

import { ThemeToggle } from '@/features/theme/components/ThemeToggle';

import styles from './auth_layout.module.scss';

const AuthLayout: FC = () => (
  <div className={styles.auth_layout}>
    <header className={styles.auth_layout__header}>
      <span className={styles.auth_layout__brand}>Pulse</span>
      <ThemeToggle />
    </header>
    <main className={styles.auth_layout__main}>
      <Outlet />
    </main>
  </div>
);

export { AuthLayout };

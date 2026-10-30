import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigation,
} from 'react-router';
import classNames from 'classnames';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/features/auth/useAuth.ts';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { chatsPage, profilePage, usersPage } from '@/routes/routePaths.ts';

import styles from './layout.module.scss';

const navLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  classNames(styles.nav__link, { [styles['nav__link--active']]: isActive });

const Layout: FC = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(pathname);
  const isNavigating = useNavigation().state === 'loading';

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    mainRef.current?.focus();
  }, [pathname]);

  const ownProfile = profilePage(String(user?.id));

  return (
    <div className={styles.shell}>
      {isNavigating && <div className={styles.progress} aria-hidden />}
      <a href="#main" className={styles.skip_link}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.header__inner}>
          <Link to={ownProfile} className={styles.brand}>
            Pulse
          </Link>
          <nav aria-label="Main" className={styles.nav}>
            <NavLink to={ownProfile} className={navLinkClassName}>
              Profile
            </NavLink>
            <NavLink to={usersPage()} className={navLinkClassName}>
              People
            </NavLink>
            <NavLink to={chatsPage()} className={navLinkClassName}>
              Chats
            </NavLink>
          </nav>
          <div className={styles.actions}>
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={styles.main}
        aria-busy={isNavigating || undefined}
      >
        <Outlet />
      </main>
    </div>
  );
};

export { Layout };

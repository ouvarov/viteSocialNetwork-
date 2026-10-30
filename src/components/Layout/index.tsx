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

import { useAuth } from '@/features/auth/useAuth.ts';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { chatsPage, feedPage, peoplePage } from '@/routes/routePaths.ts';

import { AccountMenu } from './AccountMenu';
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

  return (
    <div className={styles.shell}>
      {isNavigating && <div className={styles.progress} aria-hidden />}
      <a href="#main" className={styles.skip_link}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.header__inner}>
          <Link to={feedPage()} className={styles.brand}>
            Pulse
          </Link>
          <nav aria-label="Main" className={styles.nav}>
            <NavLink to={feedPage()} end className={navLinkClassName}>
              Home
            </NavLink>
            <NavLink to={peoplePage()} className={navLinkClassName}>
              People
            </NavLink>
            <NavLink to={chatsPage()} className={navLinkClassName}>
              Chats
            </NavLink>
          </nav>
          <div className={styles.actions}>
            <ThemeToggle />
            {user && <AccountMenu user={user} onLogout={logout} />}
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

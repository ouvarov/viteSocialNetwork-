import { FC } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import styles from './layout.module.scss';

const Layout: FC = () => {
  const handleClassName = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.link} ${styles.link_active}` : styles.link;

  return (
    <div>
      <header>
        <nav>
          <NavLink to="/sign-in" className={handleClassName}>
            login
          </NavLink>
          <NavLink to="/sign-up" className={handleClassName}>
            registration
          </NavLink>
          <NavLink to="/users" className={handleClassName}>
            users
          </NavLink>
          <NavLink className={handleClassName} to="chats">
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

import React, { FC } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout: FC = () => {
  const handleClassName = ({ isActive }): string => (isActive ? 'fdfd' : 'dfd');

  return (
    <div>
      <header>
        <nav>
          <NavLink to="/sign-in" className={handleClassName}>
            login
          </NavLink>
          <NavLink to="/sign-up">registration</NavLink>
        </nav>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export { Layout };

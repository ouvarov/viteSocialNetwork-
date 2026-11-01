import type { FC, ReactNode } from 'react';
import { NavLink } from 'react-router';
import classNames from 'classnames';

import { Avatar } from '@/components/common/Avatar';
import { ChatIcon } from '@/components/icons/ChatIcon.tsx';
import { HomeIcon } from '@/components/icons/HomeIcon.tsx';
import { PeopleIcon } from '@/components/icons/PeopleIcon.tsx';
import type { UserDataTypes } from '@/features/users/types.ts';
import {
  chatsPage,
  feedPage,
  peoplePage,
  profilePage,
} from '@/routes/routePaths.ts';

import styles from './tab_bar.module.scss';

type TabBarProps = {
  user: UserDataTypes;
};

type Tab = {
  to: string;
  label: string;
  icon: ReactNode;
  isEnd?: boolean;
};

const tabClassName = ({ isActive }: { isActive: boolean }): string =>
  classNames(styles.tab_bar__tab, {
    [styles['tab_bar__tab--active']]: isActive,
  });

const TabBar: FC<TabBarProps> = ({ user }) => {
  const tabs: Tab[] = [
    { to: feedPage(), label: 'Home', icon: <HomeIcon />, isEnd: true },
    { to: peoplePage(), label: 'People', icon: <PeopleIcon /> },
    { to: chatsPage(), label: 'Chats', icon: <ChatIcon /> },
    {
      to: profilePage(user.id),
      label: 'Profile',
      icon: (
        <Avatar
          userId={user.id}
          userName={user.userName}
          imageUrl={user.imageUrl}
          size="xs"
        />
      ),
    },
  ];

  return (
    <nav aria-label="Main" className={styles.tab_bar}>
      {tabs.map(({ to, label, icon, isEnd }) => (
        <NavLink key={label} to={to} end={isEnd} className={tabClassName}>
          {icon}
          <span className={styles.tab_bar__label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export { TabBar };

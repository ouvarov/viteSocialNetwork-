import type { FC } from 'react';
import { useId } from 'react';
import { Link } from 'react-router';

import { Avatar } from '@/components/common/Avatar';
import type { UserDataTypes } from '@/features/users/types.ts';
import { useDismissableMenu } from '@/hooks/useDismissableMenu.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './account_menu.module.scss';

type AccountMenuProps = {
  user: UserDataTypes;
  onLogout: () => void;
};

const AccountMenu: FC<AccountMenuProps> = ({ user, onLogout }) => {
  const menuId = useId();
  const { rootRef, toggleRef, isOpen, toggle, close } = useDismissableMenu();

  return (
    <div ref={rootRef} className={styles.account}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.account__toggle}
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={toggle}
      >
        <Avatar
          userId={user.id}
          userName={user.userName}
          imageUrl={user.imageUrl}
          size="sm"
        />
      </button>
      {isOpen && (
        <div id={menuId} className={styles.account__menu}>
          <p className={styles.account__name}>{user.userName}</p>
          <ul className={styles.account__list}>
            <li>
              <Link
                className={styles.account__item}
                to={profilePage(user.id)}
                onClick={close}
              >
                Your profile
              </Link>
            </li>
            <li>
              <button
                type="button"
                className={styles.account__item_danger}
                onClick={onLogout}
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export { AccountMenu };

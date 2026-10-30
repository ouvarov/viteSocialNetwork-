import type { FC } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';

import { Avatar } from '@/components/common/Avatar';
import type { UserDataTypes } from '@/features/users/types.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './account_menu.module.scss';

type AccountMenuProps = {
  user: UserDataTypes;
  onLogout: () => void;
};

const AccountMenu: FC<AccountMenuProps> = ({ user, onLogout }) => {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setIsOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={styles.account}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.account__toggle}
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
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
                onClick={() => setIsOpen(false)}
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

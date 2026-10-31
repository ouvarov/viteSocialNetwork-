import type { FC } from 'react';
import { useId } from 'react';

import { MoreIcon } from '@/components/icons/MoreIcon.tsx';
import { useDismissableMenu } from '@/hooks/useDismissableMenu.ts';

import styles from './post_menu.module.scss';

type PostMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

const PostMenu: FC<PostMenuProps> = ({ onEdit, onDelete }) => {
  const menuId = useId();
  const { rootRef, toggleRef, isOpen, toggle, close } = useDismissableMenu();

  const choose = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <div ref={rootRef} className={styles.menu}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.menu__toggle}
        aria-label="Post options"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={toggle}
      >
        <MoreIcon />
      </button>
      {isOpen && (
        <ul id={menuId} className={styles.menu__list}>
          <li>
            <button
              type="button"
              className={styles.menu__item}
              onClick={choose(onEdit)}
            >
              Edit post
            </button>
          </li>
          <li>
            <button
              type="button"
              className={styles.menu__item_danger}
              onClick={choose(onDelete)}
            >
              Delete post
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export { PostMenu };

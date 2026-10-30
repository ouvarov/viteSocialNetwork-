import type { FC } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { MoreIcon } from '@/components/icons/MoreIcon.tsx';

import styles from './post_menu.module.scss';

type PostMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

const PostMenu: FC<PostMenuProps> = ({ onEdit, onDelete }) => {
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

  const choose = (action: () => void) => () => {
    setIsOpen(false);
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
        onClick={() => setIsOpen((open) => !open)}
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

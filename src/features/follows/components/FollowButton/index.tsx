import type { FC } from 'react';
import classNames from 'classnames';

import { Button } from '@/components/common/Button';
import { useToggleFollow } from '@/features/follows/queries.ts';

import styles from './follow_button.module.scss';

type FollowButtonProps = {
  userId: string;
  userName: string;
  isFollowedByMe: boolean;
  className?: string;
};

const FollowButton: FC<FollowButtonProps> = ({
  userId,
  userName,
  isFollowedByMe,
  className,
}) => {
  const { mutate: toggleFollow, isError } = useToggleFollow(userId);

  return (
    <span className={classNames(styles.follow, className)}>
      <Button
        size="sm"
        variant={isFollowedByMe ? 'secondary' : 'primary'}
        className={classNames(styles.follow__button, {
          [styles['follow__button--following']]: isFollowedByMe,
        })}
        aria-label={`Follow ${userName}`}
        aria-pressed={isFollowedByMe}
        onClick={() => toggleFollow(!isFollowedByMe)}
      >
        <span className={styles.follow__label}>
          {isFollowedByMe ? 'Following' : 'Follow'}
        </span>
        {isFollowedByMe && (
          <span className={styles.follow__unfollow} aria-hidden>
            Unfollow
          </span>
        )}
      </Button>
      {isError && (
        <span className={styles.follow__error} role="alert">
          Could not update. Try again.
        </span>
      )}
    </span>
  );
};

export { FollowButton };

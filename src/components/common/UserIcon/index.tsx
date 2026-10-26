import type { FC } from 'react';

import defaultIcon from './defaultIcon.svg';
import styles from './user_icon.module.scss';

type UserIconProps = {
  imageUrl: string | null;
  size?: number;
};

const DEFAULT_SIZE = 64;

const UserIcon: FC<UserIconProps> = ({ imageUrl, size = DEFAULT_SIZE }) => (
  <img
    className={styles.avatar}
    src={imageUrl ?? defaultIcon}
    alt=""
    width={size}
    height={size}
  />
);

export { UserIcon };

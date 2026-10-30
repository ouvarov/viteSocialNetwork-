import type { FC } from 'react';
import { useState } from 'react';
import classNames from 'classnames';

import { getAvatarColor, getInitials } from './avatar.ts';
import styles from './avatar.module.scss';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  userId: string;
  userName: string;
  imageUrl: string | null;
  size?: AvatarSize;
  className?: string;
};

const Avatar: FC<AvatarProps> = ({
  userId,
  userName,
  imageUrl,
  size = 'md',
  className,
}) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isPhotoShown = imageUrl !== null && imageUrl !== failedUrl;
  const avatarClassName = classNames(
    styles.avatar,
    styles[`avatar--${size}`],
    className,
  );

  if (isPhotoShown) {
    return (
      <img
        className={avatarClassName}
        src={imageUrl}
        alt=""
        onError={() => setFailedUrl(imageUrl)}
      />
    );
  }

  return (
    <span
      className={classNames(
        avatarClassName,
        styles[`avatar--color_${getAvatarColor(userId)}`],
      )}
      aria-hidden
    >
      {getInitials(userName)}
    </span>
  );
};

export { Avatar };
export type { AvatarSize };

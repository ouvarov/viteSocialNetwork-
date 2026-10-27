import type { FC, ReactNode } from 'react';
import classNames from 'classnames';

import styles from './loader.module.scss';

const LOADER_DOTS = Array.from({ length: 10 }, (_, index) => index);

type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
  message?: ReactNode;
};

const Loader: FC<LoaderProps> = ({
  label = 'Loading',
  fullScreen = false,
  message,
}) => (
  <div
    className={classNames(styles.loader, {
      [styles['loader--full_screen']]: fullScreen,
    })}
    role="status"
    aria-label={label}
  >
    <div className={styles.loader__wrap} aria-hidden>
      {LOADER_DOTS.map((dot) => (
        <div key={dot} className={styles.loader__item} />
      ))}
    </div>
    {message && <p className={styles.loader__message}>{message}</p>}
  </div>
);

export { Loader };

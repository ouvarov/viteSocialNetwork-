import type { FC } from 'react';

import styles from './feed_separator.module.scss';

type FeedSeparatorProps = {
  isCaughtUp: boolean;
};

const FeedSeparator: FC<FeedSeparatorProps> = ({ isCaughtUp }) => (
  <div className={styles.separator}>
    {isCaughtUp && (
      <div className={styles.separator__caught_up}>
        <p className={styles.separator__title}>{"You're all caught up"}</p>
        <p className={styles.separator__text}>
          {"You've seen all new posts from people you follow."}
        </p>
      </div>
    )}
    <h2 className={styles.separator__label}>
      {isCaughtUp ? 'More posts from Pulse' : 'Posts from Pulse'}
    </h2>
  </div>
);

export { FeedSeparator };

import { FC } from 'react';

import styles from './loader.module.scss';

const Loader: FC = () => {
  const loaderItem = Array.from({ length: 10 }, (_, idx) => idx);

  return (
    <div className={styles.loader}>
      <div className={styles.loader__wrap}>
        {loaderItem.map((item) => (
          <div key={item} className={styles.loader__item} />
        ))}
      </div>
    </div>
  );
};

export { Loader };

import type { FC } from 'react';
import { Link } from 'react-router';

import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';

import styles from './not_found.module.scss';

const NotFound: FC = () => {
  useDocumentTitle('Page not found');

  return (
    <section className={styles.not_found}>
      <h1 className={styles.not_found__title}>Page not found</h1>
      <p className={styles.not_found__text}>
        The link may be broken, or the page may have been removed.
      </p>
      <Link className={styles.not_found__link} to="/">
        Go to the home page
      </Link>
    </section>
  );
};

export { NotFound };

import type { FC, ReactNode } from 'react';

import styles from './empty_state.module.scss';

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

const EmptyState: FC<EmptyStateProps> = ({ title, children, action }) => (
  <div className={styles.empty_state}>
    <p className={styles.empty_state__title}>{title}</p>
    {children && <p className={styles.empty_state__text}>{children}</p>}
    {action}
  </div>
);

export { EmptyState };

import type { FC, ReactNode } from 'react';

import styles from './page_header.module.scss';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

const PageHeader: FC<PageHeaderProps> = ({ title, children }) => (
  <div className={styles.page_header}>
    <h1 className={styles.page_header__title}>{title}</h1>
    {children && <div className={styles.page_header__actions}>{children}</div>}
  </div>
);

export { PageHeader };

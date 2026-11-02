import type { FC } from 'react';

import styles from './skeleton.module.scss';

type SkeletonVariant = 'post' | 'person' | 'profile';

type SkeletonProps = {
  variant: SkeletonVariant;
  label: string;
  count?: number;
};

const PostSkeleton: FC = () => (
  <div className={styles.skeleton__post}>
    <div className={styles.skeleton__row}>
      <span className={styles.skeleton__circle} />
      <span className={styles.skeleton__line} />
    </div>
    <span className={styles.skeleton__line} />
    <span className={styles['skeleton__line--short']} />
    <span className={styles.skeleton__media} />
  </div>
);

const PersonSkeleton: FC = () => (
  <div className={styles.skeleton__person}>
    <span className={styles.skeleton__circle} />
    <div className={styles.skeleton__column}>
      <span className={styles.skeleton__line} />
      <span className={styles['skeleton__line--short']} />
    </div>
  </div>
);

const ProfileSkeleton: FC = () => (
  <div className={styles.skeleton__profile}>
    <span className={styles['skeleton__circle--large']} />
    <div className={styles.skeleton__column}>
      <span className={styles.skeleton__line} />
      <span className={styles['skeleton__line--short']} />
    </div>
  </div>
);

const VARIANTS: Record<SkeletonVariant, FC> = {
  post: PostSkeleton,
  person: PersonSkeleton,
  profile: ProfileSkeleton,
};

const Skeleton: FC<SkeletonProps> = ({ variant, label, count = 1 }) => {
  const Item = VARIANTS[variant];

  return (
    <div className={styles.skeleton} role="status" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <Item key={index} />
      ))}
    </div>
  );
};

export { Skeleton };
export type { SkeletonVariant };

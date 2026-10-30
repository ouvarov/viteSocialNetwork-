import type { FC } from 'react';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { useOnVisible } from '@/hooks/useOnVisible.ts';

import styles from './posts_pager.module.scss';

type PostsPagerProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  error: unknown;
  hasSeveralPages: boolean;
  onLoadMore: () => void;
};

const PostsPager: FC<PostsPagerProps> = ({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  error,
  hasSeveralPages,
  onLoadMore,
}) => {
  const loadMoreRef = useOnVisible<HTMLButtonElement>(
    onLoadMore,
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  );

  return (
    <>
      {isFetchNextPageError && (
        <p className={styles.pager__error} role="alert">
          {getApiErrorMessage(error, 'Could not load more posts')}
        </p>
      )}
      {hasNextPage ? (
        <Button
          ref={loadMoreRef}
          variant="secondary"
          className={styles.pager__more}
          isLoading={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchNextPageError ? 'Try again' : 'Show more posts'}
        </Button>
      ) : (
        hasSeveralPages && (
          <p className={styles.pager__end}>You have reached the end.</p>
        )
      )}
    </>
  );
};

export { PostsPager };

import type { FC } from 'react';
import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/features/auth/useAuth.ts';
import { FeedSeparator } from '@/features/feed/components/FeedSeparator';
import { firstFromEveryone, uniqueById } from '@/features/feed/feed-items.ts';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostComposer } from '@/features/posts/components/PostComposer';
import { PostsPager } from '@/features/posts/components/PostsPager';
import { useFeed } from '@/features/posts/queries.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';

import styles from './feed.module.scss';

const isComposerRequested = (state: unknown): boolean =>
  typeof state === 'object' &&
  state !== null &&
  'focusComposer' in state &&
  state.focusComposer === true;

const FeedList: FC = () => {
  const { user } = useAuth();
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useFeed();

  if (isPending) return <Loader label="Loading your feed" />;

  if (isError && !data) {
    return (
      <ErrorState
        title="Could not load your feed"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const posts = uniqueById(data.pages.flatMap((page) => page.items));

  if (posts.length === 0) {
    return (
      <EmptyState title="No posts yet">
        Be the first to post — the composer is right above.
      </EmptyState>
    );
  }

  const separatorIndex = firstFromEveryone(posts);

  return (
    <section aria-label="Feed" className={styles.feed__list}>
      {posts.map((post, index) => (
        <Fragment key={post.id}>
          {index === separatorIndex && (
            <FeedSeparator isCaughtUp={separatorIndex > 0} />
          )}
          <PostCard post={post} isOwn={post.author.id === user?.id} />
        </Fragment>
      ))}
      <PostsPager
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isFetchNextPageError={isFetchNextPageError}
        error={error}
        hasSeveralPages={data.pages.length > 1}
        onLoadMore={() => void fetchNextPage()}
      />
    </section>
  );
};

const Feed: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isComposerFocused] = useState(() =>
    isComposerRequested(location.state),
  );
  useDocumentTitle('Home');

  useEffect(() => {
    if (isComposerFocused) void navigate('.', { replace: true, state: null });
  }, [isComposerFocused, navigate]);

  return (
    <div className={styles.feed}>
      <h1 className={styles.feed__title}>Home</h1>
      <PostComposer isFocusedOnMount={isComposerFocused} />
      <FeedList />
    </div>
  );
};

export { Feed };

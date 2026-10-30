import type { FC } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostsPager } from '@/features/posts/components/PostsPager';
import { usePosts } from '@/features/posts/queries.ts';
import { feedPage } from '@/routes/routePaths.ts';

import styles from './posts.module.scss';

type PostsProps = {
  userId: string;
  isOwnProfile: boolean;
};

const Posts: FC<PostsProps> = ({ userId, isOwnProfile }) => {
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
  } = usePosts(userId);

  if (isPending) return <Loader label="Loading posts" />;

  if (isError && !data) {
    return (
      <ErrorState
        title="Could not load posts"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const posts = data.pages.flatMap((page) => page.items);

  if (posts.length === 0) {
    return isOwnProfile ? (
      <EmptyState
        title="You haven't posted yet"
        action={
          <Link to={feedPage()} state={{ focusComposer: true }}>
            Write your first post
          </Link>
        }
      >
        Your posts show up here and in the Home feed of everyone who follows
        you.
      </EmptyState>
    ) : (
      <EmptyState title="No posts yet">
        Nothing has been posted here.
      </EmptyState>
    );
  }

  return (
    <section aria-label="Posts" className={styles.posts}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isOwn={isOwnProfile} />
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

export { Posts };

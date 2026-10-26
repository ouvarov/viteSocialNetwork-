import type { FC } from 'react';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PostCard } from '@/features/posts/components/PostCard';
import {
  usePosts,
  useRemovePost,
  useToggleLike,
} from '@/features/posts/queries.ts';
import { useOnVisible } from '@/hooks/useOnVisible.ts';

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
  const { mutate: toggleLike } = useToggleLike(userId);
  const {
    mutate: removePost,
    isPending: isRemoving,
    variables: removingPostId,
  } = useRemovePost(userId);

  const loadMore = () => void fetchNextPage();
  const loadMoreRef = useOnVisible<HTMLButtonElement>(
    loadMore,
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  );

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
    return (
      <EmptyState title="No posts yet">
        {isOwnProfile
          ? 'Share your first post above.'
          : 'Nothing has been posted here.'}
      </EmptyState>
    );
  }

  return (
    <section aria-label="Posts" className={styles.posts}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          canDelete={isOwnProfile}
          isDeleting={isRemoving && removingPostId === post.id}
          onToggleLike={toggleLike}
          onDelete={removePost}
        />
      ))}
      {isFetchNextPageError && (
        <p className={styles.posts__error} role="alert">
          {getApiErrorMessage(error, 'Could not load more posts')}
        </p>
      )}
      {hasNextPage ? (
        <Button
          ref={loadMoreRef}
          variant="secondary"
          className={styles.posts__more}
          isLoading={isFetchingNextPage}
          onClick={loadMore}
        >
          {isFetchNextPageError ? 'Try again' : 'Show more posts'}
        </Button>
      ) : (
        data.pages.length > 1 && (
          <p className={styles.posts__end}>You have reached the end.</p>
        )
      )}
    </section>
  );
};

export { Posts };

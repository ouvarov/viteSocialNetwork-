import type { FC } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loader } from '@/components/common/Loader';
import { PostCard } from '@/features/posts/components/PostCard';
import {
  usePosts,
  useRemovePost,
  useToggleLike,
} from '@/features/posts/queries.ts';

import styles from './posts.module.scss';

type PostsProps = {
  userId: string;
  isOwnProfile: boolean;
};

const Posts: FC<PostsProps> = ({ userId, isOwnProfile }) => {
  const { data: posts, isPending, isError, error, refetch } = usePosts(userId);
  const { mutate: toggleLike } = useToggleLike(userId);
  const { mutate: removePost } = useRemovePost(userId);

  if (isPending) return <Loader label="Loading posts" />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load posts"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (posts.items.length === 0) {
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
      {posts.items.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          canDelete={isOwnProfile}
          onToggleLike={toggleLike}
          onDelete={removePost}
        />
      ))}
    </section>
  );
};

export { Posts };

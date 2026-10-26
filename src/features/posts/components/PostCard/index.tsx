import type { FC } from 'react';

import { Button } from '@/components/common/Button';
import type { PostTypes } from '@/features/posts/types.ts';

import styles from './post_card.module.scss';

type PostCardProps = {
  post: PostTypes;
  canDelete: boolean;
  onToggleLike: (post: PostTypes) => void;
  onDelete: (postId: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const PostCard: FC<PostCardProps> = ({
  post,
  canDelete,
  onToggleLike,
  onDelete,
}) => (
  <article className={styles.post}>
    {post.imageUrl && (
      <figure className={styles.post__figure}>
        <img className={styles.post__image} src={post.imageUrl} alt="" />
      </figure>
    )}
    <p className={styles.post__text}>{post.text}</p>
    <footer className={styles.post__footer}>
      <time className={styles.post__date} dateTime={post.created}>
        {dateFormatter.format(new Date(post.created))}
      </time>
      <div className={styles.post__actions}>
        <button
          type="button"
          aria-pressed={post.likedByMe}
          onClick={() => onToggleLike(post)}
          className={styles.post__like}
        >
          Like <span className={styles.post__count}>{post.likeCount}</span>
        </button>
        {canDelete && (
          <Button variant="danger" size="sm" onClick={() => onDelete(post.id)}>
            Delete
          </Button>
        )}
      </div>
    </footer>
  </article>
);

export { PostCard };

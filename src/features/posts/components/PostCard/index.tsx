import type { CSSProperties, FC, KeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RelativeTime } from '@/components/common/RelativeTime';
import { HeartIcon } from '@/components/icons/HeartIcon.tsx';
import { PostMenu } from '@/features/posts/components/PostMenu';
import {
  useEditPost,
  useRemovePost,
  useToggleLike,
} from '@/features/posts/queries.ts';
import type { PostTypes } from '@/features/posts/types.ts';
import { profilePage } from '@/routes/routePaths.ts';

import styles from './post_card.module.scss';

const FALLBACK_ASPECT_RATIO = '4 / 3';

type PostCardProps = {
  post: PostTypes;
  isOwn: boolean;
};

const toAspectRatio = ({ imageWidth, imageHeight }: PostTypes): string =>
  imageWidth && imageHeight
    ? `${imageWidth} / ${imageHeight}`
    : FALLBACK_ASPECT_RATIO;

const PostCard: FC<PostCardProps> = ({ post, isOwn }) => {
  const authorId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.text);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const wasEditingRef = useRef(false);
  const { mutate: toggleLike } = useToggleLike();
  const {
    mutate: editPost,
    isPending: isSaving,
    error: editError,
    reset: resetEdit,
  } = useEditPost();
  const {
    mutate: removePost,
    isPending: isRemoving,
    error: removeError,
  } = useRemovePost();

  useEffect(() => {
    if (isEditing) editorRef.current?.focus();
    else if (wasEditingRef.current) textRef.current?.focus();

    wasEditingRef.current = isEditing;
  }, [isEditing]);

  const startEditing = () => {
    setDraft(post.text);
    resetEdit();
    setIsEditing(true);
  };

  const saveDraft = () => {
    const text = draft.trim();
    if (!text || text === post.text || isSaving) return;

    editPost({ id: post.id, text }, { onSuccess: () => setIsEditing(false) });
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') setIsEditing(false);
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) saveDraft();
  };

  return (
    <article className={styles.post} aria-labelledby={authorId}>
      <header className={styles.post__header}>
        <Avatar
          userId={post.author.id}
          userName={post.author.userName}
          imageUrl={post.author.imageUrl}
        />
        <p className={styles.post__byline}>
          <Link
            id={authorId}
            className={styles.post__author}
            to={profilePage(post.author.id)}
          >
            {post.author.userName}
          </Link>
          {' · '}
          <RelativeTime className={styles.post__date} dateTime={post.created} />
          {post.editedAt && (
            <span className={styles.post__edited}> · edited</span>
          )}
        </p>
        {isOwn && (
          <PostMenu
            onEdit={startEditing}
            onDelete={() => setIsConfirmingDelete(true)}
          />
        )}
      </header>

      {isEditing ? (
        <div className={styles.post__editor}>
          <label
            className={styles.post__editor_label}
            htmlFor={`${authorId}-edit`}
          >
            Edit post
          </label>
          <textarea
            id={`${authorId}-edit`}
            className={styles.post__editor_field}
            value={draft}
            ref={editorRef}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleDraftKeyDown}
          />
          {editError && (
            <p className={styles.post__error} role="alert">
              {getApiErrorMessage(editError, 'Could not save the post')}
            </p>
          )}
          <div className={styles.post__editor_actions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={isSaving}
              disabled={!draft.trim() || draft.trim() === post.text}
              onClick={saveDraft}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p ref={textRef} className={styles.post__text} tabIndex={-1}>
          {post.text}
        </p>
      )}

      {post.imageUrl && (
        <figure
          className={styles.post__figure}
          style={
            { '--post-aspect-ratio': toAspectRatio(post) } as CSSProperties
          }
        >
          <img
            className={styles.post__image}
            src={post.imageUrl}
            alt={`Attached to ${post.author.userName}'s post`}
            loading="lazy"
          />
        </figure>
      )}

      <footer className={styles.post__footer}>
        <button
          type="button"
          aria-label={`Like ${post.likeCount}`}
          aria-pressed={post.likedByMe}
          onClick={() => toggleLike(post)}
          className={styles.post__like}
        >
          <HeartIcon isFilled={post.likedByMe} />
          <span className={styles.post__like_label}>Like </span>
          <span className={styles.post__count}>{post.likeCount}</span>
        </button>
      </footer>

      {removeError && (
        <p className={styles.post__error} role="alert">
          {getApiErrorMessage(removeError, 'Could not delete the post')}
        </p>
      )}

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Delete this post?"
        confirmLabel="Delete"
        isConfirming={isRemoving}
        onConfirm={() =>
          removePost(post.id, { onSettled: () => setIsConfirmingDelete(false) })
        }
        onClose={() => setIsConfirmingDelete(false)}
      >
        {"This can't be undone."}
      </ConfirmDialog>
    </article>
  );
};

export { PostCard };

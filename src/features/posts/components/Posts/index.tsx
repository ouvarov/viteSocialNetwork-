import type { ChangeEvent, FC } from 'react';
import type React from 'react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useParams } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/features/auth/useAuth.ts';
import {
  useCreatePost,
  usePosts,
  useRemovePost,
  useToggleLike,
  useUploadImage,
} from '@/features/posts/queries.ts';

import styles from './posts.module.scss';

const Posts: FC = () => {
  const [image, setImage] = useState<string>('');
  const [text, setText] = useState<string>('');

  const { user } = useAuth();
  const { userId } = useParams();

  const { data: posts, isPending } = usePosts(userId);
  const { mutate: createPost } = useCreatePost(userId);
  const { mutate: toggleLike } = useToggleLike(userId);
  const { mutate: removePost } = useRemovePost(userId);
  const { mutate: uploadImage, error: uploadError } = useUploadImage();

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: ([file]) => {
      if (!file) return;

      uploadImage(file, { onSuccess: ({ url }) => setImage(url) });
    },
  });

  const onChangeText = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    createPost(
      { imageUrl: image || undefined, text },
      {
        onSuccess: () => {
          setText('');
          setImage('');
        },
      },
    );
  };

  return (
    <div>
      {userId === user?.id && (
        <div>
          {!image && (
            <div
              {...getRootProps()}
              style={{
                border: '2px dashed #fff',
                padding: '20px',
                margin: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <input {...getInputProps()} />
              <p>Choose a file</p>
            </div>
          )}
          {uploadError && (
            <p className={styles.error} role="alert">
              {getApiErrorMessage(uploadError, 'Could not upload the image')}
            </p>
          )}
          {image && (
            <figure>
              <img src={image} alt="" />
            </figure>
          )}
          <form onSubmit={handleOneSubmit}>
            <Textarea
              id="text"
              name="text"
              label="New post"
              required
              value={text}
              onChange={onChangeText}
              placeholder="What's new?"
            />
            <Button type="submit">Submit</Button>
          </form>
        </div>
      )}
      <div>
        {isPending && <Loader />}
        {posts?.items.map((post) => (
          <div key={post.id}>
            {post.imageUrl && (
              <figure className={styles.figure}>
                <img
                  src={post.imageUrl}
                  alt=""
                  style={{ objectFit: 'contain' }}
                />
              </figure>
            )}
            <p className={styles.text}>{post.text}</p>

            <button
              type="button"
              aria-pressed={post.likedByMe}
              onClick={() => toggleLike(post)}
              className={styles.likes}
            >
              likes {post.likeCount}
            </button>

            {user?.id === post.ownerId && (
              <Button onClick={() => removePost(post.id)}>Remove</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { Posts };

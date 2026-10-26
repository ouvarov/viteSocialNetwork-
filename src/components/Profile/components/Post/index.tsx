import type { ChangeEvent, FC } from 'react';
import type React from 'react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { upload } from '@/api';

import { queryKeys } from '@/api/query-keys.ts';
import type { PostTypes } from '@/types/post.ts';
import Textarea from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/providers/useAuth.ts';
import {
  createPost,
  getPosts,
  likePost,
  removePost,
  unlikePost,
} from '@/components/Profile/api';
import { Loader } from '@/components/common/Loader';

import styles from './post.module.scss';

const Post: FC = () => {
  const [image, setImage] = useState<string>('');
  const [text, setText] = useState<string>('');

  const { user } = useAuth();
  const { userId } = useParams();

  const postsKey = queryKeys.posts(String(userId));

  const { data: resData, isPending } = useQuery({
    queryKey: postsKey,
    queryFn: async () => (await getPosts(String(userId))).data,
    enabled: Boolean(userId),
  });

  const queryClient = useQueryClient();

  const { mutate: createNewPost } = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      setText('');
      setImage('');
      return queryClient.invalidateQueries({ queryKey: postsKey });
    },
  });

  const { mutate: toggleLike } = useMutation({
    mutationFn: ({ id, likedByMe }: PostTypes) =>
      likedByMe ? unlikePost(id) : likePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: postsKey }),
  });

  const { mutate: removePostItem } = useMutation({
    mutationFn: removePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: postsKey }),
  });
  const uploadImage = async ([file]: File[]) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await upload(formData);
      setImage(response.data.url);
    } catch (error) {
      console.error(error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => void uploadImage(acceptedFiles),
  });

  const onChangeText = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    createNewPost({ imageUrl: image || undefined, text });
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
          {image && (
            <figure>
              <img src={image} alt="" />
            </figure>
          )}
          <form onSubmit={handleOneSubmit}>
            <Textarea
              id={'text'}
              name="text"
              value={text}
              onChange={onChangeText}
              placeholder={'enter post text'}
            />
            <Button type="submit">Submit</Button>
          </form>
        </div>
      )}
      <div>
        {isPending && <Loader />}
        {resData?.items.map((post) => (
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
              <Button
                onClick={() => {
                  removePostItem(post.id);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { Post };

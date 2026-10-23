import type { ChangeEvent, FC } from 'react';
import type React from 'react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';

import { upload } from '@/api';

import type { PostPageTypes, PostTypes } from '@/types/post.ts';
import Textarea from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/providers/AuthProvider.tsx';
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

  const { data: resData, isLoading } = useQuery<PostPageTypes>({
    queryKey: [`posts${userId}`],
    queryFn: async () => {
      const response = await getPosts(userId || '');
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutate: createNewPost } = useMutation(createPost, {
    onSuccess: () => {
      setText('');
      setImage('');
      return queryClient.invalidateQueries([`posts${userId}`]);
    },
  });

  const { mutate: toggleLike } = useMutation(
    ({ id, likedByMe }: PostTypes) =>
      likedByMe ? unlikePost(id) : likePost(id),
    {
      onSuccess: () => queryClient.invalidateQueries([`posts${userId}`]),
    },
  );

  const { mutate: removePostItem } = useMutation(
    (id: string) => removePost(id),
    {
      onSuccess: () => queryClient.invalidateQueries([`posts${userId}`]),
    },
  );
  const onDrop = async (acceptedFiles: any) => {
    if (!acceptedFiles) return;

    const formData = new FormData();
    formData.append('image', acceptedFiles[0]);

    try {
      const response = await upload(formData);
      setImage(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
        {isLoading && <Loader />}
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

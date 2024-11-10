import React, { ChangeEvent, FC, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { PostDataTypes } from '@/types/post.ts';

import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/providers/AuthProvider.tsx';
import {
  createPost,
  getPost,
  likePost,
  removePost,
} from '@/components/Profile/api';
import { Loader } from '@/components/common/Loader';

import styles from './post.module.scss';

const Post: FC = () => {
  const { user } = useAuth();

  const { data: resData, isLoading } = useQuery<PostDataTypes>({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await getPost(user?.id || '');
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutate: createNewPost } = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  const { mutate: onLikePost } = useMutation((id: string) => likePost(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  const { mutate: removePostItem } = useMutation(
    (id: string) => removePost(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['posts']);
      },
    },
  );

  const [image, setImage] = useState<string>('');
  const [text, setText] = useState<string>('');

  const onChangeText = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const onChangeImage = (e: ChangeEvent<HTMLInputElement>): void => {
    setImage(e.target.value);
  };

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    createNewPost({ imageUrl: image, text });
  };

  return (
    <div>
      <div>
        <form onSubmit={handleOneSubmit}>
          <Input
            id="image"
            name={'image'}
            value={image}
            onChange={onChangeImage}
            placeholder={'enter image url'}
          />
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
      <div>
        {isLoading && <Loader />}
        {resData?.data?.postsData?.length &&
          resData.data.postsData
            .sort(
              (a, b) =>
                new Date(a.created).getTime() - new Date(b.created).getTime(),
            )
            .map(({ id, imageUrl, text, ownerId, likes }) => (
              <div key={id}>
                {imageUrl && (
                  <figure className={styles.figure}>
                    <img src={imageUrl} alt="" />
                  </figure>
                )}
                <p className={styles.text}>{text}</p>

                <button
                  type="button"
                  onClick={() => onLikePost(id)}
                  className={styles.likes}
                >
                  likes {likes.length}
                </button>

                {user?.id === ownerId && (
                  <Button
                    onClick={() => {
                      removePostItem(id);
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

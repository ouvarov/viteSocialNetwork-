import React, { ChangeEvent, FC, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';

import { upload } from '@/api';

import { PostDataTypes } from '@/types/post.ts';
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
  const { userId } = useParams();

  const { data: resData, isLoading } = useQuery<PostDataTypes>({
    queryKey: [`posts${userId}`],
    queryFn: async () => {
      const response = await getPost(userId || '');
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  const { mutate: createNewPost } = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries([`posts${userId}`]);
    },
  });

  const { mutate: onLikePost } = useMutation((id: string) => likePost(id), {
    onSuccess: () => {
      queryClient.invalidateQueries([`posts${userId}`]);
    },
  });

  const { mutate: removePostItem } = useMutation(
    (id: string) => removePost(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([`posts${userId}`]);
      },
    },
  );

  const [image, setImage] = useState<string>('');
  const [text, setText] = useState<string>('');
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

    createNewPost({ imageUrl: image, text, ownerId: userId || '' });
  };

  return (
    <div>
      {userId === user?.id && (
        <div>
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
        {resData?.postsData?.length &&
          resData.postsData
            .sort(
              (a, b) =>
                new Date(a.created).getTime() - new Date(b.created).getTime(),
            )
            .map(({ id, imageUrl, text, ownerId, likes }) => (
              <div key={id}>
                {imageUrl && (
                  <figure className={styles.figure}>
                    <img
                      src={imageUrl}
                      alt=""
                      style={{ objectFit: 'contain' }}
                    />
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

import type { FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
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
import { postSchema } from '@/features/posts/schemas.ts';
import type { PostFormValues } from '@/features/posts/schemas.ts';

import styles from './posts.module.scss';

const Posts: FC = () => {
  const { user } = useAuth();
  const { userId } = useParams();

  const { data: posts, isPending } = usePosts(userId);
  const { mutateAsync: createPost } = useCreatePost(userId);
  const { mutate: toggleLike } = useToggleLike(userId);
  const { mutate: removePost } = useRemovePost(userId);
  const { mutate: uploadImage, error: uploadError } = useUploadImage();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { text: '', imageUrl: undefined },
  });

  const image = watch('imageUrl');

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: ([file]) => {
      if (!file) return;

      uploadImage(file, {
        onSuccess: ({ url }) => setValue('imageUrl', url),
      });
    },
  });

  const onSubmit = async (values: PostFormValues): Promise<void> => {
    try {
      await createPost(values);
      reset();
    } catch (createError) {
      setError('root.server', {
        message: getApiErrorMessage(createError, 'Could not publish the post'),
      });
    }
  };

  return (
    <div>
      {userId === user?.id && (
        <div>
          {!image && (
            <div {...getRootProps({ className: styles.dropzone })}>
              <input {...getInputProps({ 'aria-label': 'Post image' })} />
              <p>Choose an image</p>
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
          <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
            <Textarea
              {...register('text')}
              id="text"
              label="New post"
              required
              placeholder="What's new?"
              error={errors.text?.message}
            />
            {errors.root?.server && (
              <p className={styles.error} role="alert">
                {errors.root.server.message}
              </p>
            )}
            <Button isLoading={isSubmitting} type="submit">
              Submit
            </Button>
          </form>
        </div>
      )}
      <div>
        {isPending && <Loader />}
        {posts?.items.map((post) => (
          <div key={post.id}>
            {post.imageUrl && (
              <figure className={styles.figure}>
                <img className={styles.image} src={post.imageUrl} alt="" />
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

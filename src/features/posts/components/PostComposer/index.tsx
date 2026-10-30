import type { FC } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/api/errors.ts';
import { useUploadImage } from '@/api/upload.ts';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { useCreatePost } from '@/features/posts/queries.ts';
import { postSchema } from '@/features/posts/schemas.ts';
import type { PostFormValues } from '@/features/posts/schemas.ts';

import styles from './post_composer.module.scss';

type PostComposerProps = {
  userId: string;
};

const PostComposer: FC<PostComposerProps> = ({ userId }) => {
  const { mutateAsync: createPost } = useCreatePost(userId);
  const {
    mutate: uploadImage,
    isPending: isUploading,
    error: uploadError,
  } = useUploadImage();

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { text: '', imageUploadId: undefined },
  });

  const removeImage = () => {
    setValue('imageUploadId', undefined);
    setImagePreviewUrl(null);
  };

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    onDrop: ([file]) => {
      if (!file) return;

      uploadImage(file, {
        onSuccess: ({ id, url }) => {
          setValue('imageUploadId', id);
          setImagePreviewUrl(url);
        },
      });
    },
  });

  const onSubmit = async (values: PostFormValues): Promise<void> => {
    try {
      await createPost(values);
      reset();
      setImagePreviewUrl(null);
    } catch (createError) {
      setError('root.server', {
        message: getApiErrorMessage(createError, 'Could not publish the post'),
      });
    }
  };

  return (
    <section className={styles.composer} aria-label="Create a post">
      <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Textarea
          {...register('text')}
          id="text"
          label="New post"
          required
          placeholder="What's new?"
          error={errors.text?.message}
        />
        {imagePreviewUrl ? (
          <figure className={styles.composer__preview}>
            <img
              className={styles.composer__image}
              src={imagePreviewUrl}
              alt=""
            />
            <Button variant="secondary" size="sm" onClick={removeImage}>
              Remove image
            </Button>
          </figure>
        ) : (
          <div
            {...getRootProps({
              className: styles.composer__dropzone,
              'aria-busy': isUploading || undefined,
            })}
          >
            <input {...getInputProps({ 'aria-label': 'Post image' })} />
            <p>
              {isUploading
                ? 'Uploading the image'
                : 'Drop an image or click to choose'}
            </p>
          </div>
        )}
        {uploadError && (
          <p className={styles.composer__error} role="alert">
            {getApiErrorMessage(uploadError, 'Could not upload the image')}
          </p>
        )}
        {errors.root?.server && (
          <p className={styles.composer__error} role="alert">
            {errors.root.server.message}
          </p>
        )}
        <div className={styles.composer__actions}>
          <Button isLoading={isSubmitting} disabled={isUploading} type="submit">
            Publish
          </Button>
        </div>
      </form>
    </section>
  );
};

export { PostComposer };

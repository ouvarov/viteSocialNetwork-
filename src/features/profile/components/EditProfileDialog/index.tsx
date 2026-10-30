import type { ChangeEvent, FC, SyntheticEvent } from 'react';
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import type { Area } from 'react-easy-crop';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Textarea } from '@/components/common/Textarea';
import { cropToAvatar } from '@/features/profile/crop-avatar.ts';
import {
  type AvatarChange,
  useUpdateProfile,
} from '@/features/profile/queries.ts';
import {
  MAX_DESCRIPTION_LENGTH,
  profileSchema,
} from '@/features/profile/schemas.ts';
import type { ProfileFormValues } from '@/features/profile/schemas.ts';
import type { UserDataTypes } from '@/features/users/types.ts';
import { useModalDialog } from '@/hooks/useModalDialog.ts';

import styles from './edit_profile_dialog.module.scss';

const AvatarCropper = lazy(async () => ({
  default: (await import('@/features/profile/components/AvatarCropper'))
    .AvatarCropper,
}));

const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

type Step = 'form' | 'crop';

type EditProfileDialogProps = {
  profile: UserDataTypes;
  onClose: () => void;
};

const validateImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "This file type isn't supported. Choose a JPG, PNG, WebP or GIF.";
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return 'This file is too large. Choose an image under 20 MB.';
  }
  return null;
};

const useObjectUrl = () => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  return [
    url,
    (blob: Blob | null) => setUrl(blob && URL.createObjectURL(blob)),
  ] as const;
};

const EditProfileDialog: FC<EditProfileDialogProps> = ({
  profile,
  onClose,
}) => {
  const dialogRef = useModalDialog(true);
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('form');
  const [avatar, setAvatar] = useState<AvatarChange>({ kind: 'keep' });
  const [fileError, setFileError] = useState<string | null>(null);
  const [sourceUrl, setSource] = useObjectUrl();
  const [previewUrl, setPreview] = useObjectUrl();
  const {
    mutate: updateProfile,
    isPending: isSaving,
    error,
  } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      userName: profile.userName,
      description: profile.description,
    },
  });
  const description = useWatch({ control, name: 'description' });

  const avatarUrl =
    avatar.kind === 'keep'
      ? profile.imageUrl
      : avatar.kind === 'replace'
        ? previewUrl
        : null;
  const hasChanges = isDirty || avatar.kind !== 'keep';

  const keepOpenWhileSaving = (event: SyntheticEvent) => {
    if (isSaving) event.preventDefault();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    event.target.value = '';
    if (!file) return;

    const validationError = validateImageFile(file);
    setFileError(validationError);
    if (validationError) return;

    setSource(file);
    setStep('crop');
  };

  const handleCropConfirm = async (area: Area) => {
    if (!sourceUrl) return;

    try {
      const image = await cropToAvatar(sourceUrl, area);
      setAvatar({ kind: 'replace', image });
      setPreview(image);
      setStep('form');
    } catch {
      setFileError('Could not read this image. Choose another one.');
      setStep('form');
    }
  };

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile(
      {
        fields: {
          userName: dirtyFields.userName ? values.userName : undefined,
          description: dirtyFields.description ? values.description : undefined,
        },
        avatar,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={keepOpenWhileSaving}
      onClose={onClose}
    >
      <h2 id={titleId} className={styles.dialog__title}>
        {step === 'form' ? 'Edit profile' : 'Crop photo'}
      </h2>
      {step === 'crop' && sourceUrl ? (
        <Suspense fallback={<Loader label="Loading the photo editor" />}>
          <AvatarCropper
            imageUrl={sourceUrl}
            onBack={() => setStep('form')}
            onConfirm={(area) => void handleCropConfirm(area)}
          />
        </Suspense>
      ) : (
        <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className={styles.dialog__avatar}>
            <Avatar
              userId={profile.id}
              userName={profile.userName}
              imageUrl={avatarUrl}
              size="xl"
            />
            <div className={styles.dialog__photo_actions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </Button>
              {avatarUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAvatar({ kind: 'remove' })}
                >
                  Remove photo
                </Button>
              )}
              <p className={styles.dialog__hint}>
                JPG, PNG, WebP or GIF, up to 20 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              className={styles.dialog__file}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              tabIndex={-1}
              aria-label="Profile photo"
              onChange={handleFileChange}
            />
          </div>
          {fileError && (
            <p className={styles.dialog__error} role="alert">
              {fileError}
            </p>
          )}
          <Input
            {...register('userName')}
            label="Name"
            autoComplete="name"
            error={errors.userName?.message}
          />
          <Textarea
            {...register('description')}
            label={`About (${description.length}/${MAX_DESCRIPTION_LENGTH})`}
            error={errors.description?.message}
          />
          {error && (
            <p className={styles.dialog__error} role="alert">
              {getApiErrorMessage(error, 'Could not save your profile')}
            </p>
          )}
          <div className={styles.dialog__actions}>
            <Button
              variant="secondary"
              size="sm"
              aria-disabled={isSaving}
              onClick={() => {
                if (!isSaving) onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
              disabled={!hasChanges}
            >
              Save
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
};

export { EditProfileDialog };

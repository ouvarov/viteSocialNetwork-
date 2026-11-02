import type { FC, SyntheticEvent } from 'react';
import { useId, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/features/auth/useAuth.ts';
import { PeoplePicker } from '@/features/chat/components/PeoplePicker';
import { useCreateGroup } from '@/features/chat/queries.ts';
import { groupTitleSchema } from '@/features/chat/schemas.ts';
import type { GroupTitleFormValues } from '@/features/chat/schemas.ts';
import { useModalDialog } from '@/hooks/useModalDialog.ts';
import { chatPage } from '@/routes/routePaths.ts';

import styles from './create_group_dialog.module.scss';

type CreateGroupDialogProps = {
  onClose: () => void;
};

const CreateGroupDialog: FC<CreateGroupDialogProps> = ({ onClose }) => {
  const dialogRef = useModalDialog(true);
  const titleId = useId();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate: createGroup, isPending, error } = useCreateGroup();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [isNobodySelected, setIsNobodySelected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupTitleFormValues>({
    resolver: zodResolver(groupTitleSchema),
    defaultValues: { title: '' },
  });

  const keepOpenWhileCreating = (event: SyntheticEvent) => {
    if (isPending) event.preventDefault();
  };

  const togglePerson = (userId: string) => {
    setIsNobodySelected(false);
    setMemberIds((selected) =>
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId],
    );
  };

  const onSubmit = ({ title }: GroupTitleFormValues) => {
    if (memberIds.length === 0) {
      setIsNobodySelected(true);
      return;
    }

    createGroup(
      { title, memberIds },
      {
        onSuccess: ({ chatId }) => {
          onClose();
          void navigate(chatPage(chatId));
        },
      },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={keepOpenWhileCreating}
      onClose={onClose}
    >
      <h2 id={titleId} className={styles.dialog__title}>
        New group
      </h2>
      <form
        className={styles.dialog__form}
        noValidate
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      >
        <Input
          {...register('title')}
          label="Group name"
          required
          error={errors.title?.message}
        />
        <PeoplePicker
          excludedIds={user ? [user.id] : []}
          selectedIds={memberIds}
          onToggle={togglePerson}
        />
        {isNobodySelected && (
          <p className={styles.dialog__error} role="alert">
            Choose at least one person
          </p>
        )}
        {error && (
          <p className={styles.dialog__error} role="alert">
            {getApiErrorMessage(error, 'Could not create the group')}
          </p>
        )}
        <div className={styles.dialog__actions}>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Create group
          </Button>
        </div>
      </form>
    </dialog>
  );
};

export { CreateGroupDialog };

import type { FC } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/features/auth/useAuth.ts';
import { GroupMemberRow } from '@/features/chat/components/GroupMemberRow';
import { PeoplePicker } from '@/features/chat/components/PeoplePicker';
import {
  canManageGroup,
  isGroupOwner,
} from '@/features/chat/group-permissions.ts';
import {
  useDeleteGroup,
  useGroupAction,
  useLeaveGroup,
} from '@/features/chat/queries.ts';
import { groupTitleSchema } from '@/features/chat/schemas.ts';
import type { GroupTitleFormValues } from '@/features/chat/schemas.ts';
import type { ChatDataTypes, ChatMemberTypes } from '@/features/chat/types.ts';
import { useModalDialog } from '@/hooks/useModalDialog.ts';
import { chatsPage } from '@/routes/routePaths.ts';

import styles from './group_info_dialog.module.scss';

type PendingConfirm =
  | { kind: 'leave' }
  | { kind: 'delete' }
  | { kind: 'transfer'; member: ChatMemberTypes }
  | { kind: 'remove'; member: ChatMemberTypes };

type GroupInfoDialogProps = {
  chat: ChatDataTypes;
  onClose: () => void;
};

const confirmTextOf = (confirm: PendingConfirm, title: string) => {
  switch (confirm.kind) {
    case 'leave':
      return {
        heading: `Leave ${title}?`,
        label: 'Leave',
        text: 'You stop seeing this group. Your messages stay in it.',
      };
    case 'delete':
      return {
        heading: `Delete ${title}?`,
        label: 'Delete group',
        text: 'The group and all its messages disappear for everyone.',
      };
    case 'transfer':
      return {
        heading: `Make ${confirm.member.userName} the owner?`,
        label: 'Make owner',
        text: 'You stay in the group as a moderator.',
      };
    case 'remove':
      return {
        heading: `Remove ${confirm.member.userName}?`,
        label: 'Remove',
        text: 'They stop seeing this group. Their messages stay in it.',
      };
  }
};

const GroupInfoDialog: FC<GroupInfoDialogProps> = ({ chat, onClose }) => {
  const { chatId, members, myRole, title: chatTitle } = chat;
  const title = chatTitle ?? '';
  const dialogRef = useModalDialog(true);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAddingPeople, setIsAddingPeople] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState<string[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const goToChats = () => void navigate(chatsPage());
  const action = useGroupAction(chatId);
  const leave = useLeaveGroup(chatId, goToChats);
  const deleteGroup = useDeleteGroup(chatId, goToChats);

  const {
    register,
    handleSubmit,
    reset: resetTitle,
    formState: { errors },
  } = useForm<GroupTitleFormValues>({
    resolver: zodResolver(groupTitleSchema),
    values: { title },
    resetOptions: { keepDirtyValues: true },
  });

  const isManager = canManageGroup(myRole);
  const isOwner = isGroupOwner(myRole);
  const memberIds = members.map(({ id }) => id);
  const pendingType = action.isPending ? action.variables.type : null;

  const askToConfirm = (confirm: PendingConfirm) => {
    action.reset();
    leave.reset();
    deleteGroup.reset();
    setPendingConfirm(confirm);
  };

  const togglePerson = (userId: string) =>
    setNewMemberIds((selected) =>
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId],
    );

  const addPeople = () =>
    action.mutate(
      { type: 'add', userIds: newMemberIds },
      {
        onSuccess: () => {
          setNewMemberIds([]);
          setIsAddingPeople(false);
        },
      },
    );

  const runConfirm = () => {
    if (!pendingConfirm) return;

    const closeConfirm = { onSuccess: () => setPendingConfirm(null) };

    switch (pendingConfirm.kind) {
      case 'leave':
        if (user) leave.mutate(user.id);
        return;
      case 'delete':
        deleteGroup.mutate();
        return;
      case 'transfer':
        action.mutate(
          { type: 'transfer', userId: pendingConfirm.member.id },
          closeConfirm,
        );
        return;
      case 'remove':
        action.mutate(
          { type: 'remove', userId: pendingConfirm.member.id },
          closeConfirm,
        );
    }
  };

  const confirmError = action.error ?? leave.error ?? deleteGroup.error;
  const confirmText = pendingConfirm && confirmTextOf(pendingConfirm, title);

  return (
    <>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClose={onClose}
      >
        <h2 id={titleId} className={styles.dialog__title}>
          {title}
        </h2>

        {isManager && (
          <form
            className={styles.dialog__rename}
            noValidate
            onSubmit={(e) =>
              void handleSubmit((values) =>
                action.mutate(
                  { type: 'rename', title: values.title },
                  { onSuccess: () => resetTitle(values) },
                ),
              )(e)
            }
          >
            <Input
              {...register('title')}
              label="Group name"
              required
              className={styles.dialog__rename_field}
              error={errors.title?.message}
            />
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              isLoading={pendingType === 'rename'}
            >
              Save name
            </Button>
          </form>
        )}

        <h3 className={styles.dialog__heading}>{members.length} people</h3>
        <ul className={styles.dialog__members}>
          {members.map((member) => (
            <GroupMemberRow
              key={member.id}
              member={member}
              myRole={myRole}
              isMe={member.id === user?.id}
              isBusy={action.isPending}
              onSetRole={(role) =>
                action.mutate({ type: 'setRole', userId: member.id, role })
              }
              onMakeOwner={() => askToConfirm({ kind: 'transfer', member })}
              onRemove={() => askToConfirm({ kind: 'remove', member })}
            />
          ))}
        </ul>

        {isManager && !isAddingPeople && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddingPeople(true)}
          >
            Add people
          </Button>
        )}
        {isManager && isAddingPeople && (
          <div className={styles.dialog__adding}>
            <PeoplePicker
              excludedIds={memberIds}
              selectedIds={newMemberIds}
              onToggle={togglePerson}
            />
            <Button
              size="sm"
              disabled={newMemberIds.length === 0}
              isLoading={pendingType === 'add'}
              onClick={addPeople}
            >
              Add to the group
            </Button>
          </div>
        )}

        {action.error && !pendingConfirm && (
          <p className={styles.dialog__error} role="alert">
            {getApiErrorMessage(action.error, 'Could not update the group')}
          </p>
        )}

        <div className={styles.dialog__actions}>
          {isOwner && (
            <Button
              variant="danger"
              size="sm"
              aria-haspopup="dialog"
              onClick={() => askToConfirm({ kind: 'delete' })}
            >
              Delete group
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            aria-haspopup="dialog"
            onClick={() => askToConfirm({ kind: 'leave' })}
          >
            Leave group
          </Button>
          <Button
            ref={closeButtonRef}
            variant="secondary"
            size="sm"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </Button>
        </div>
      </dialog>

      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        title={confirmText?.heading ?? ''}
        confirmLabel={confirmText?.label ?? ''}
        isConfirming={
          action.isPending || leave.isPending || deleteGroup.isPending
        }
        error={
          confirmError
            ? getApiErrorMessage(confirmError, 'Could not update the group')
            : undefined
        }
        onConfirm={runConfirm}
        onClose={() => setPendingConfirm(null)}
      >
        {confirmText?.text}
      </ConfirmDialog>
    </>
  );
};

export { GroupInfoDialog };

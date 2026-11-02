import type { FC } from 'react';
import { useId, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/features/auth/useAuth.ts';
import { PeoplePicker } from '@/features/chat/components/PeoplePicker';
import {
  canManageGroup,
  canRemoveMember,
  isGroupOwner,
} from '@/features/chat/group-permissions.ts';
import {
  useDeleteGroup,
  useGroupAction,
  useLeaveGroup,
} from '@/features/chat/queries.ts';
import { groupTitleSchema } from '@/features/chat/schemas.ts';
import type { GroupTitleFormValues } from '@/features/chat/schemas.ts';
import type {
  ChatDataTypes,
  ChatMemberTypes,
  ChatRoleTypes,
} from '@/features/chat/types.ts';
import { useModalDialog } from '@/hooks/useModalDialog.ts';
import { chatsPage } from '@/routes/routePaths.ts';

import styles from './group_info_dialog.module.scss';

const ROLE_LABELS: Record<ChatRoleTypes, string> = {
  owner: 'Owner',
  moderator: 'Moderator',
  member: 'Member',
};

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
  const titleId = useId();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAddingPeople, setIsAddingPeople] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState<string[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

  const action = useGroupAction(chatId);
  const leave = useLeaveGroup(chatId);
  const deleteGroup = useDeleteGroup(chatId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupTitleFormValues>({
    resolver: zodResolver(groupTitleSchema),
    values: { title },
  });

  const isManager = canManageGroup(myRole);
  const isOwner = isGroupOwner(myRole);
  const memberIds = members.map(({ id }) => id);

  const askToConfirm = (confirm: PendingConfirm) => {
    action.reset();
    setPendingConfirm(confirm);
  };

  const closeAndLeavePage = () => {
    setPendingConfirm(null);
    onClose();
    void navigate(chatsPage());
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

    const close = { onSuccess: () => setPendingConfirm(null) };

    switch (pendingConfirm.kind) {
      case 'leave':
        leave.mutate(String(user?.id), { onSuccess: closeAndLeavePage });
        return;
      case 'delete':
        deleteGroup.mutate(undefined, { onSuccess: closeAndLeavePage });
        return;
      case 'transfer':
        action.mutate(
          { type: 'transfer', userId: pendingConfirm.member.id },
          close,
        );
        return;
      case 'remove':
        action.mutate(
          { type: 'remove', userId: pendingConfirm.member.id },
          close,
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
                action.mutate({ type: 'rename', title: values.title }),
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
            <Button variant="secondary" size="sm" type="submit">
              Save name
            </Button>
          </form>
        )}

        <h3 className={styles.dialog__heading}>{members.length} people</h3>
        <ul className={styles.dialog__members}>
          {members.map((member) => {
            const { id, userName, imageUrl, role } = member;
            const isMe = id === user?.id;

            return (
              <li key={id} className={styles.dialog__member}>
                <Avatar userId={id} userName={userName} imageUrl={imageUrl} />
                <span className={styles.dialog__member_name}>
                  {isMe ? `${userName} (you)` : userName}
                  <span className={styles.dialog__role}>
                    {ROLE_LABELS[role]}
                  </span>
                </span>
                {!isMe && (
                  <span className={styles.dialog__member_actions}>
                    {isOwner && (
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={
                          role === 'moderator'
                            ? `Make ${userName} a member`
                            : `Make ${userName} a moderator`
                        }
                        onClick={() =>
                          action.mutate({
                            type: 'setRole',
                            userId: id,
                            role: role === 'moderator' ? 'member' : 'moderator',
                          })
                        }
                      >
                        {role === 'moderator' ? 'Member' : 'Moderator'}
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Make ${userName} the owner`}
                        onClick={() =>
                          askToConfirm({ kind: 'transfer', member })
                        }
                      >
                        Owner
                      </Button>
                    )}
                    {canRemoveMember(myRole, role) && (
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Remove ${userName}`}
                        onClick={() => askToConfirm({ kind: 'remove', member })}
                      >
                        Remove
                      </Button>
                    )}
                  </span>
                )}
              </li>
            );
          })}
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
        {isAddingPeople && (
          <div className={styles.dialog__adding}>
            <PeoplePicker
              excludedIds={memberIds}
              selectedIds={newMemberIds}
              onToggle={togglePerson}
            />
            <Button
              size="sm"
              disabled={newMemberIds.length === 0}
              isLoading={action.isPending}
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
          <Button variant="secondary" size="sm" onClick={onClose}>
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

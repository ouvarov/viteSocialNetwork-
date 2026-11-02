import type { FC } from 'react';

import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import {
  canRemoveMember,
  isGroupOwner,
} from '@/features/chat/group-permissions.ts';
import type { ChatMemberTypes, ChatRoleTypes } from '@/features/chat/types.ts';

import styles from './group_member_row.module.scss';

const ROLE_LABELS: Record<ChatRoleTypes, string> = {
  owner: 'Owner',
  moderator: 'Moderator',
  member: 'Member',
};

type GroupMemberRowProps = {
  member: ChatMemberTypes;
  myRole: ChatRoleTypes;
  isMe: boolean;
  isBusy: boolean;
  onSetRole: (role: 'moderator' | 'member') => void;
  onMakeOwner: () => void;
  onRemove: () => void;
};

const GroupMemberRow: FC<GroupMemberRowProps> = ({
  member: { id, userName, imageUrl, role },
  myRole,
  isMe,
  isBusy,
  onSetRole,
  onMakeOwner,
  onRemove,
}) => {
  const isOwnerViewing = isGroupOwner(myRole);
  const nextRole = role === 'moderator' ? 'member' : 'moderator';

  const unlessBusy = (run: () => void) => () => {
    if (!isBusy) run();
  };

  return (
    <li className={styles.row}>
      <Avatar userId={id} userName={userName} imageUrl={imageUrl} />
      <span className={styles.row__name}>
        {isMe ? `${userName} (you)` : userName}
        <span className={styles.row__role}>{ROLE_LABELS[role]}</span>
      </span>
      {!isMe && (
        <span className={styles.row__actions}>
          {isOwnerViewing && (
            <Button
              variant="secondary"
              size="sm"
              aria-disabled={isBusy}
              aria-label={`Make ${userName} a ${nextRole}`}
              onClick={unlessBusy(() => onSetRole(nextRole))}
            >
              {ROLE_LABELS[nextRole]}
            </Button>
          )}
          {isOwnerViewing && (
            <Button
              variant="secondary"
              size="sm"
              aria-disabled={isBusy}
              aria-label={`Make ${userName} the owner`}
              onClick={unlessBusy(onMakeOwner)}
            >
              Owner
            </Button>
          )}
          {canRemoveMember(myRole, role) && (
            <Button
              variant="danger"
              size="sm"
              aria-disabled={isBusy}
              aria-label={`Remove ${userName}`}
              onClick={unlessBusy(onRemove)}
            >
              Remove
            </Button>
          )}
        </span>
      )}
    </li>
  );
};

export { GroupMemberRow };

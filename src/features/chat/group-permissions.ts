import type { ChatRoleTypes } from './types.ts';

const canManageGroup = (role: ChatRoleTypes): boolean => role !== 'member';

const isGroupOwner = (role: ChatRoleTypes): boolean => role === 'owner';

const canRemoveMember = (
  actor: ChatRoleTypes,
  target: ChatRoleTypes,
): boolean =>
  isGroupOwner(actor) || (actor === 'moderator' && target === 'member');

export { canManageGroup, canRemoveMember, isGroupOwner };

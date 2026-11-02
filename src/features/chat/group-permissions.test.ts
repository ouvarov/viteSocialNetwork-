import { describe, expect, it } from 'vitest';

import {
  canManageGroup,
  canRemoveMember,
  isGroupOwner,
} from './group-permissions.ts';

describe('group permissions', () => {
  it('lets the owner and moderators manage the group', () => {
    expect(canManageGroup('owner')).toBe(true);
    expect(canManageGroup('moderator')).toBe(true);
    expect(canManageGroup('member')).toBe(false);
  });

  it('knows who the owner is', () => {
    expect(isGroupOwner('owner')).toBe(true);
    expect(isGroupOwner('moderator')).toBe(false);
  });

  it.each([
    ['owner', 'moderator', true],
    ['owner', 'member', true],
    ['moderator', 'member', true],
    ['moderator', 'moderator', false],
    ['moderator', 'owner', false],
    ['member', 'member', false],
  ] as const)('%s removing a %s: %s', (actor, target, expected) => {
    expect(canRemoveMember(actor, target)).toBe(expected);
  });
});

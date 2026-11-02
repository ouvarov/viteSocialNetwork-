import { screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import type { ChatDataTypes, ChatRoleTypes } from '@/features/chat/types.ts';
import { renderWithProviders } from '@/test/render.tsx';
import { USER } from '@/test/server.ts';

import { GroupInfoDialog } from './index.tsx';

const BOB_ID = '22222222-2222-4222-8222-222222222222';

const groupOf = (
  myRole: ChatRoleTypes,
  bobRole: ChatRoleTypes,
): ChatDataTypes => ({
  chatId: '33333333-3333-4333-8333-333333333333',
  kind: 'group',
  title: 'Launch crew',
  myRole,
  peer: null,
  canSend: true,
  members: [
    {
      id: USER.id,
      userName: USER.userName,
      imageUrl: null,
      role: myRole,
    },
    { id: BOB_ID, userName: 'Bob', imageUrl: null, role: bobRole },
  ],
});

const renderDialog = (myRole: ChatRoleTypes, bobRole: ChatRoleTypes) =>
  renderWithProviders(
    <GroupInfoDialog chat={groupOf(myRole, bobRole)} onClose={() => {}} />,
    { auth: { user: USER } },
  );

const button = (name: string) =>
  screen.queryByRole('button', { name, hidden: true });

describe('GroupInfoDialog', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close() {
      this.open = false;
    };
  });

  it('gives the owner every control', () => {
    renderDialog('owner', 'member');

    expect(button('Make Bob a moderator')).toBeInTheDocument();
    expect(button('Make Bob the owner')).toBeInTheDocument();
    expect(button('Remove Bob')).toBeInTheDocument();
    expect(button('Add people')).toBeInTheDocument();
    expect(button('Delete group')).toBeInTheDocument();
  });

  it('offers to take a moderator role away', () => {
    renderDialog('owner', 'moderator');

    expect(button('Make Bob a member')).toBeInTheDocument();
    expect(button('Make Bob a moderator')).not.toBeInTheDocument();
  });

  it('lets a moderator manage members, but no roles or deleting', () => {
    renderDialog('moderator', 'member');

    expect(button('Remove Bob')).toBeInTheDocument();
    expect(button('Add people')).toBeInTheDocument();
    expect(button('Make Bob a moderator')).not.toBeInTheDocument();
    expect(button('Make Bob the owner')).not.toBeInTheDocument();
    expect(button('Delete group')).not.toBeInTheDocument();
  });

  it('does not let a moderator remove another moderator', () => {
    renderDialog('moderator', 'moderator');

    expect(button('Remove Bob')).not.toBeInTheDocument();
  });

  it('leaves a member only the way out', () => {
    renderDialog('member', 'member');

    expect(button('Leave group')).toBeInTheDocument();
    expect(button('Remove Bob')).not.toBeInTheDocument();
    expect(button('Add people')).not.toBeInTheDocument();
    expect(button('Save name')).not.toBeInTheDocument();
  });

  it('opens with focus off the name field, so no keyboard pops up', () => {
    renderDialog('owner', 'member');

    expect(button('Close')).toHaveFocus();
  });
});

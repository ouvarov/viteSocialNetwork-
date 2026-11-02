import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render.tsx';
import { USER } from '@/test/server.ts';

import { Message } from './index.tsx';

const renderMessage = (isLastInGroup: boolean) =>
  renderWithProviders(
    <ul>
      <Message
        message={{
          messageId: '55555555-5555-4555-8555-555555555555',
          senderId: USER.id,
          senderName: USER.userName,
          content: 'hello',
          sentAt: '2026-10-01T12:30:00.000Z',
        }}
        isFirstInGroup
        isLastInGroup={isLastInGroup}
      />
    </ul>,
    { auth: { user: USER } },
  );

const renderFromOther = (isInGroupChat: boolean, isFirstInGroup = true) =>
  renderWithProviders(
    <ul>
      <Message
        message={{
          messageId: '66666666-6666-4666-8666-666666666666',
          senderId: '22222222-2222-4222-8222-222222222222',
          senderName: 'Bob',
          content: 'hello',
          sentAt: '2026-10-01T12:30:00.000Z',
        }}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={false}
        isInGroupChat={isInGroupChat}
      />
    </ul>,
    { auth: { user: USER } },
  );

describe('Message', () => {
  it('names the sender at the start of a run in a group', () => {
    renderFromOther(true);

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('names the sender only once per run', () => {
    renderFromOther(true, false);

    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('does not name the sender in a direct chat', () => {
    renderFromOther(false);

    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('separates the text from the time for screen readers', () => {
    renderMessage(true);

    expect(screen.getByRole('listitem').textContent).toMatch(/^hello \d/);
  });

  it('shows no time inside a group', () => {
    renderMessage(false);

    expect(screen.getByRole('listitem').textContent).toBe('hello');
  });
});

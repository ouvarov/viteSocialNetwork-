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
          content: 'hello',
          sentAt: '2026-10-01T12:30:00.000Z',
        }}
        isFirstInGroup
        isLastInGroup={isLastInGroup}
      />
    </ul>,
    { auth: { user: USER } },
  );

describe('Message', () => {
  it('separates the text from the time for screen readers', () => {
    renderMessage(true);

    expect(screen.getByRole('listitem').textContent).toMatch(/^hello \d/);
  });

  it('shows no time inside a group', () => {
    renderMessage(false);

    expect(screen.getByRole('listitem').textContent).toBe('hello');
  });
});

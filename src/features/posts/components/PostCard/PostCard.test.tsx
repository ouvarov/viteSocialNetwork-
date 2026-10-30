import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PostTypes } from '@/features/posts/types.ts';
import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, USER } from '@/test/server.ts';

import { PostCard } from './index.tsx';

const POST: PostTypes = {
  id: '33333333-3333-4333-8333-333333333333',
  ownerId: USER.id,
  author: { id: USER.id, userName: USER.userName, imageUrl: null },
  imageUrl: null,
  imageWidth: null,
  imageHeight: null,
  text: 'Helo world',
  created: '2026-10-30T12:00:00.000Z',
  editedAt: null,
  likeCount: 0,
  likedByMe: false,
};

const openEditor = async (
  user: ReturnType<typeof renderWithProviders>['user'],
) => {
  await user.click(screen.getByRole('button', { name: 'Post options' }));
  await user.click(screen.getByRole('button', { name: 'Edit post' }));
};

describe('PostCard', () => {
  it('saves an edited text and marks the post as edited', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.patch(`${API}/posts/${POST.id}`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          ...POST,
          text: 'Hello world',
          editedAt: '2026-10-30T12:05:00.000Z',
        });
      }),
    );
    const { user } = renderWithProviders(<PostCard post={POST} isOwn />);

    await openEditor(user);
    const field = screen.getByRole('textbox', { name: 'Edit post' });
    expect(field).toHaveFocus();
    await user.clear(field);
    await user.type(field, 'Hello world');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Edit post' })).toBeNull(),
    );
    expect(bodies).toEqual([{ text: 'Hello world' }]);
  });

  it('marks an edited post', () => {
    renderWithProviders(
      <PostCard
        post={{ ...POST, editedAt: '2026-10-30T12:05:00.000Z' }}
        isOwn
      />,
    );

    expect(screen.getByText(/edited/)).toBeInTheDocument();
  });

  it('drops the draft on Escape', async () => {
    const { user } = renderWithProviders(<PostCard post={POST} isOwn />);

    await openEditor(user);
    await user.type(
      screen.getByRole('textbox', { name: 'Edit post' }),
      ' and more{Escape}',
    );

    expect(screen.queryByRole('textbox', { name: 'Edit post' })).toBeNull();
    expect(screen.getByText('Helo world')).toBeInTheDocument();
  });

  it('keeps Save off until the text changes', async () => {
    const { user } = renderWithProviders(<PostCard post={POST} isOwn />);

    await openEditor(user);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

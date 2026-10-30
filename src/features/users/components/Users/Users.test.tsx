import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PersonTypes } from '@/features/follows/types.ts';
import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, USER } from '@/test/server.ts';

import { Users } from './index.tsx';

const GRACE: PersonTypes = {
  id: '22222222-2222-4222-8222-222222222222',
  userName: 'Grace Hopper',
  imageUrl: null,
  description: 'It is easier to ask forgiveness than permission.',
  created: '2026-10-02T12:00:00.000Z',
  followersCount: 4,
  isFollowedByMe: false,
};

const ME: PersonTypes = { ...USER, followersCount: 0, isFollowedByMe: false };

const servePeople = (...items: PersonTypes[]) =>
  server.use(
    http.get(`${API}/users`, () =>
      HttpResponse.json({ items, nextCursor: null }),
    ),
  );

const deferred = () => {
  let release: (response: Response) => void = () => {};
  const response = new Promise<Response>((resolve) => {
    release = resolve;
  });

  return { response, release };
};

const rowOf = (name: string) =>
  screen.getByRole('link', { name }).closest('li') as HTMLElement;

describe('Users', () => {
  it('marks my own row instead of offering to follow myself', async () => {
    servePeople(GRACE, ME);
    renderWithProviders(<Users />, { auth: { user: USER } });

    await screen.findByRole('link', { name: 'Grace Hopper' });

    expect(within(rowOf('Ada Lovelace')).getByText('You')).toBeInTheDocument();
    expect(
      within(rowOf('Ada Lovelace')).queryByRole('button'),
    ).not.toBeInTheDocument();
  });

  it('shows the follow at once and keeps the server count', async () => {
    servePeople(GRACE, ME);
    const followRequest = deferred();
    server.use(
      http.put(`${API}/users/${GRACE.id}/follow`, () => followRequest.response),
    );
    const { user } = renderWithProviders(<Users />, { auth: { user: USER } });

    const follow = await screen.findByRole('button', {
      name: 'Follow Grace Hopper',
    });
    await user.click(follow);

    expect(follow).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(rowOf('Grace Hopper')).getByText('5 followers'),
    ).toBeVisible();

    followRequest.release(
      HttpResponse.json({
        userId: GRACE.id,
        isFollowedByMe: true,
        followersCount: 7,
        followingCount: 0,
      }),
    );

    expect(
      await within(rowOf('Grace Hopper')).findByText('7 followers'),
    ).toBeVisible();
  });

  it('rolls the follow back when the server refuses it', async () => {
    servePeople(GRACE, ME);
    server.use(
      http.put(`${API}/users/${GRACE.id}/follow`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    );
    const { user } = renderWithProviders(<Users />, { auth: { user: USER } });

    await user.click(
      await screen.findByRole('button', { name: 'Follow Grace Hopper' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not update',
    );
    expect(
      screen.getByRole('button', { name: 'Follow Grace Hopper' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(rowOf('Grace Hopper')).getByText('4 followers'),
    ).toBeVisible();
  });

  it('filters the loaded people by name', async () => {
    servePeople(GRACE, ME);
    const { user } = renderWithProviders(<Users />, { auth: { user: USER } });
    await screen.findByRole('link', { name: 'Grace Hopper' });

    await user.type(screen.getByLabelText('Search people'), 'grace');

    expect(screen.queryByRole('link', { name: 'Ada Lovelace' })).toBeNull();

    await user.clear(screen.getByLabelText('Search people'));
    await user.type(screen.getByLabelText('Search people'), 'linus');

    expect(screen.getByText('No one matches "linus"')).toBeInTheDocument();
  });
});

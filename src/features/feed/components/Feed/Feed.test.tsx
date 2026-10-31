import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FeedItemTypes, FeedPageTypes } from '@/features/posts/types.ts';
import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, USER } from '@/test/server.ts';

import { Feed } from './index.tsx';

const GRACE = {
  id: '22222222-2222-4222-8222-222222222222',
  userName: 'Grace Hopper',
  imageUrl: null,
};

const item = (
  id: string,
  fromFollowing: boolean,
  author = GRACE,
): FeedItemTypes => ({
  id,
  ownerId: author.id,
  author,
  imageUrl: null,
  imageWidth: null,
  imageHeight: null,
  text: `Post ${id}`,
  created: '2026-10-30T12:00:00.000Z',
  editedAt: null,
  likeCount: 0,
  likedByMe: false,
  fromFollowing,
});

const serveFeed = (pages: Record<string, FeedPageTypes>) =>
  server.use(
    http.get(`${API}/feed`, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor') ?? '';
      return HttpResponse.json(pages[cursor]);
    }),
  );

const renderFeed = () =>
  renderWithProviders(<Feed />, { auth: { user: USER } });

const textsInOrder = () =>
  screen
    .getAllByRole('article')
    .map((article) => within(article).getByText(/^Post /).textContent);

describe('Feed', () => {
  it('marks where the posts from people you follow end', async () => {
    serveFeed({
      '': {
        items: [item('a', true), item('b', true), item('c', false)],
        nextCursor: null,
      },
    });
    renderFeed();

    await screen.findByText('Post c');

    const separator = screen.getByRole('heading', {
      name: 'More posts from Pulse',
    });
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(
      separator.compareDocumentPosition(screen.getByText('Post b')) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(
      separator.compareDocumentPosition(screen.getByText('Post c')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('only labels the posts from everyone when no one you follow posted', async () => {
    serveFeed({
      '': { items: [item('a', false)], nextCursor: null },
    });
    renderFeed();

    expect(
      await screen.findByRole('heading', { name: 'Posts from Pulse' }),
    ).toBeInTheDocument();
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
  });

  it('shows a post once when it comes back on the next page', async () => {
    serveFeed({
      '': { items: [item('a', true), item('b', false)], nextCursor: 'p2' },
      p2: { items: [item('a', false), item('c', false)], nextCursor: null },
    });
    const { user } = renderFeed();

    await user.click(
      await screen.findByRole('button', { name: 'Show more posts' }),
    );
    await screen.findByText('Post c');

    expect(textsInOrder()).toEqual(['Post a', 'Post b', 'Post c']);
  });

  it('offers post options only on your own posts', async () => {
    serveFeed({
      '': {
        items: [
          item('mine', true, {
            id: USER.id,
            userName: USER.userName,
            imageUrl: null,
          }),
          item('theirs', true),
        ],
        nextCursor: null,
      },
    });
    renderFeed();

    const mine = (await screen.findByText('Post mine')).closest('article')!;
    const theirs = screen.getByText('Post theirs').closest('article')!;

    expect(
      within(mine).getByRole('button', { name: 'Post options' }),
    ).toBeInTheDocument();
    expect(
      within(theirs).queryByRole('button', { name: 'Post options' }),
    ).not.toBeInTheDocument();
  });
});

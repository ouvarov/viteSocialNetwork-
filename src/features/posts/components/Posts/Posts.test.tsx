import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PostPageTypes, PostTypes } from '@/features/posts/types.ts';
import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, USER } from '@/test/server.ts';

import { Posts } from './index.tsx';

const post = (id: string, overrides: Partial<PostTypes> = {}): PostTypes => ({
  id,
  ownerId: USER.id,
  author: { id: USER.id, userName: USER.userName, imageUrl: null },
  imageUrl: null,
  imageWidth: null,
  imageHeight: null,
  text: `Post ${id}`,
  created: '2026-10-01T12:00:00.000Z',
  editedAt: null,
  likeCount: 0,
  likedByMe: false,
  ...overrides,
});

const servePages = (pages: Record<string, PostPageTypes>) =>
  server.use(
    http.get(`${API}/users/${USER.id}/posts`, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor') ?? '';
      return HttpResponse.json(pages[cursor]);
    }),
  );

const serveOnePage = (...items: PostTypes[]) =>
  servePages({ '': { items, nextCursor: null } });

const deferred = () => {
  let release: (response: Response) => void = () => {};
  const response = new Promise<Response>((resolve) => {
    release = resolve;
  });

  return { response, release };
};

const likeButton = (text: string) =>
  within(screen.getByText(text).closest('article')!).getByRole('button', {
    name: /Like/,
  });

const renderPosts = (isOwnProfile = false) =>
  renderWithProviders(<Posts userId={USER.id} isOwnProfile={isOwnProfile} />);

describe('Posts', () => {
  it('shows a different empty state on your own profile', async () => {
    serveOnePage();
    renderPosts(true);
    expect(
      await screen.findByText("You haven't posted yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Write your first post' }),
    ).toHaveAttribute('href', '/');
  });

  it('shows the API error and loads again on Try again', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/users/${USER.id}/posts`, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ message: 'User not found' }, { status: 404 })
          : HttpResponse.json({ items: [post('a')], nextCursor: null });
      }),
    );
    const { user } = renderPosts();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'User not found',
    );
    expect(calls).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Post a')).toBeInTheDocument();
  });

  it('loads the next page and says when the end is reached', async () => {
    servePages({
      '': { items: [post('a')], nextCursor: 'page-2' },
      'page-2': { items: [post('b')], nextCursor: null },
    });
    const { user } = renderPosts();

    await user.click(
      await screen.findByRole('button', { name: 'Show more posts' }),
    );

    expect(await screen.findByText('Post b')).toBeInTheDocument();
    expect(screen.getByText('Post a')).toBeInTheDocument();
    expect(screen.getByText('You have reached the end.')).toBeInTheDocument();
  });

  it('likes a post at once and then takes the count from the server', async () => {
    serveOnePage(post('a', { likeCount: 2 }));
    const like = deferred();
    server.use(http.put(`${API}/posts/a/like`, () => like.response));
    const { user } = renderPosts();

    await user.click(await screen.findByRole('button', { name: 'Like 2' }));

    expect(likeButton('Post a')).toHaveAccessibleName('Like 3');
    expect(likeButton('Post a')).toHaveAttribute('aria-pressed', 'true');

    like.release(
      HttpResponse.json(post('a', { likeCount: 7, likedByMe: true })),
    );
    await waitFor(() =>
      expect(likeButton('Post a')).toHaveAccessibleName('Like 7'),
    );
  });

  it('undoes the like when the server refuses it', async () => {
    serveOnePage(post('a', { likeCount: 2 }));
    const like = deferred();
    server.use(http.put(`${API}/posts/a/like`, () => like.response));
    const { user } = renderPosts();

    await user.click(await screen.findByRole('button', { name: 'Like 2' }));
    expect(likeButton('Post a')).toHaveAccessibleName('Like 3');

    like.release(HttpResponse.json({}, { status: 500 }));
    await waitFor(() =>
      expect(likeButton('Post a')).toHaveAccessibleName('Like 2'),
    );
    expect(likeButton('Post a')).toHaveAttribute('aria-pressed', 'false');
  });

  it('removes a deleted post from the list', async () => {
    serveOnePage(post('a'), post('b'));
    server.use(
      http.delete(
        `${API}/posts/a`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const { user } = renderPosts(true);

    const article = (await screen.findByText('Post a')).closest('article')!;
    await user.click(
      within(article).getByRole('button', { name: 'Post options' }),
    );
    await user.click(
      within(article).getByRole('button', { name: 'Delete post' }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: 'Delete this post?' }),
      ).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('Post a')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Post b')).toBeInTheDocument();
  });

  it('offers no post options on another profile', async () => {
    serveOnePage(post('a'));
    renderPosts(false);

    await screen.findByText('Post a');
    expect(
      screen.queryByRole('button', { name: 'Post options' }),
    ).not.toBeInTheDocument();
  });
});

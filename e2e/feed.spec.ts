import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import type { TestUser } from './support.ts';
import { apiCall, countRequests, registerUser, signIn } from './support.ts';

type ServerPost = { text: string; likedByMe: boolean; likeCount: number };

const TOTAL_POSTS = 23;

const seedPosts = async (
  request: APIRequestContext,
  user: TestUser,
  count: number,
) => {
  for (let index = 1; index <= count; index += 1) {
    await apiCall(request, user, 'POST', '/posts', { text: `post ${index}` });
  }
};

const serverPost = async (
  request: APIRequestContext,
  user: TestUser,
  text: string,
) => {
  const page = await apiCall<{ items: ServerPost[] }>(
    request,
    user,
    'GET',
    `/users/${user.id}/posts?limit=50`,
  );
  const post = page.items.find((item) => item.text === text);
  if (!post) throw new Error(`${text} not found`);

  return `${post.likedByMe}:Like ${post.likeCount}`;
};

const openFeed = async (page: Page, user: TestUser) => {
  const listRequests = countRequests(
    page,
    (url, method) =>
      method === 'GET' && url.pathname === `/api/users/${user.id}/posts`,
  );
  await signIn(page, user);
  await expect(page.locator('main article')).toHaveCount(10);

  return listRequests;
};

const firstPageLoads = (urls: string[]) =>
  urls.filter((url) => !new URL(url).searchParams.has('cursor')).length;

const card = (page: Page, text: string) =>
  page
    .locator('main article')
    .filter({ has: page.getByText(text, { exact: true }) });

const likeButton = (page: Page, text: string) =>
  card(page, text).getByRole('button', { name: /^Like/ });

const likeState = async (page: Page, text: string) => {
  const button = likeButton(page, text);

  return `${await button.getAttribute('aria-pressed')}:${(await button.textContent())?.trim()}`;
};

test.describe('profile feed', () => {
  let author: TestUser;

  test.beforeAll(async ({ request }) => {
    author = await registerUser(request, 'Feed');
    await seedPosts(request, author, TOTAL_POSTS);
  });

  test('scrolling loads every page in order with cursors', async ({ page }) => {
    const listRequests = await openFeed(page, author);
    await expect(page.locator('main article').first()).toContainText(
      `post ${TOTAL_POSTS}`,
    );
    expect(listRequests).toHaveLength(1);

    const end = page.getByText('You have reached the end.');
    for (
      let attempt = 0;
      attempt < 20 && !(await end.isVisible());
      attempt += 1
    ) {
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(400);
    }
    await expect(end).toBeVisible();

    const expected = Array.from(
      { length: TOTAL_POSTS },
      (_, index) => `post ${TOTAL_POSTS - index}`,
    );
    await expect(page.locator('main article p')).toHaveText(expected);
    expect(listRequests).toHaveLength(3);
    expect(
      listRequests
        .slice(1)
        .every((url) => new URL(url).searchParams.has('cursor')),
    ).toBe(true);
    await expect(
      page.getByRole('button', { name: 'Show more posts' }),
    ).toHaveCount(0);
  });

  test('a like shows before the server answers and stays after', async ({
    page,
  }) => {
    const listRequests = await openFeed(page, author);
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/posts/*/like', async (route) => {
      await gate;
      await route.continue();
    });

    await likeButton(page, 'post 15').click();
    await expect(likeButton(page, 'post 15')).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 1000 },
    );
    const answered = page.waitForResponse((response) =>
      response.url().endsWith('/like'),
    );
    release();
    await answered;
    await page.waitForTimeout(300);
    expect(await likeState(page, 'post 15')).toBe('true:Like 1');
    expect(firstPageLoads(listRequests)).toBe(1);
  });

  test('a failed like rolls back', async ({ page }) => {
    const listRequests = await openFeed(page, author);
    await page.route('**/api/posts/*/like', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route
        .fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"message":"boom"}',
        })
        .catch(() => undefined);
    });

    await likeButton(page, 'post 16').click();
    await expect(likeButton(page, 'post 16')).toHaveText('Like 1', {
      timeout: 700,
    });
    await expect(likeButton(page, 'post 16')).toHaveText('Like 0');
    await expect(likeButton(page, 'post 16')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(firstPageLoads(listRequests)).toBe(1);
  });

  test('a burst of clicks ends in the server state with one refetch', async ({
    page,
    request,
  }) => {
    const listRequests = await openFeed(page, author);
    for (let index = 0; index < 5; index += 1) {
      await likeButton(page, 'post 17').click();
    }
    await expect.poll(() => firstPageLoads(listRequests)).toBe(2);
    await page.waitForTimeout(500);

    expect(await likeState(page, 'post 17')).toBe(
      await serverPost(request, author, 'post 17'),
    );
    expect(firstPageLoads(listRequests)).toBe(2);
  });

  test('a stale like response arriving last does not win', async ({
    page,
    request,
  }) => {
    const listRequests = await openFeed(page, author);
    await page.route('**/api/posts/*/like', async (route) => {
      if (route.request().method() !== 'PUT') return route.continue();
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return route.fulfill({ response }).catch(() => undefined);
    });

    await likeButton(page, 'post 18').click();
    await page.waitForTimeout(400);
    await likeButton(page, 'post 18').click();
    await expect
      .poll(() => firstPageLoads(listRequests), { timeout: 10_000 })
      .toBe(2);
    await page.waitForTimeout(300);

    const server = await serverPost(request, author, 'post 18');
    expect(server).toBe('false:Like 0');
    expect(await likeState(page, 'post 18')).toBe(server);
  });

  test('a failed next page keeps the posts and recovers with Try again', async ({
    page,
  }) => {
    let failNextPage = true;
    await page.route(`**/api/users/${author.id}/posts?**`, (route) => {
      const hasCursor = new URL(route.request().url()).searchParams.has(
        'cursor',
      );
      if (hasCursor && failNextPage) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"message":"Feed is down"}',
        });
      }

      return route.continue();
    });
    await openFeed(page, author);

    await page
      .getByRole('button', { name: 'Show more posts' })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Feed is down' }),
    ).toBeVisible();
    await expect(page.locator('main article')).toHaveCount(10);

    failNextPage = false;
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('main article')).toHaveCount(20);
  });
});

test('creating and deleting a post updates the feed without a refetch', async ({
  page,
  request,
}) => {
  const author = await registerUser(request, 'Editor');
  await seedPosts(request, author, 3);
  const listRequests = countRequests(
    page,
    (url, method) =>
      method === 'GET' && url.pathname === `/api/users/${author.id}/posts`,
  );
  await signIn(page, author);
  await expect(page.locator('main article')).toHaveCount(3);

  await page.getByRole('textbox', { name: 'New post' }).fill('fresh post');
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.locator('main article').first()).toContainText(
    'fresh post',
  );

  await card(page, 'post 1').getByRole('button', { name: 'Delete' }).click();
  await expect(card(page, 'post 1')).toHaveCount(0);
  expect(firstPageLoads(listRequests)).toBe(1);
});

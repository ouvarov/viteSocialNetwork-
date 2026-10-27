import { expect, test } from '@playwright/test';

import {
  createChat,
  horizontalOverflow,
  registerUser,
  signIn,
} from './support.ts';

const UNKNOWN_USER_ID = '00000000-0000-4000-8000-000000000000';

test('the sign-in page has a title and fits a small phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page).toHaveTitle('Sign in · Pulse');
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});

test('a sleeping API shows the wake-up notice and the session waits for it', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Sleepy');
  let release = () => {};
  const isAwake = new Promise<void>((resolve) => {
    release = resolve;
  });
  const refreshesBeforeWake: string[] = [];
  let isWaking = true;
  page.on('request', (sent) => {
    if (isWaking && sent.url().endsWith('/api/auth/refresh')) {
      refreshesBeforeWake.push(sent.url());
    }
  });
  await page.route('**/api/health/live', async (route) => {
    await isAwake;
    isWaking = false;
    await route.continue();
  });

  await signIn(page, user);
  const notice = page.getByText(/Waking up the server/);
  await expect(notice).toBeVisible({ timeout: 6000 });
  expect(refreshesBeforeWake).toEqual([]);

  release();
  await expect(page.getByText('No posts yet')).toBeVisible();
  await expect(notice).toHaveCount(0);
});

test('own profile: empty state, title, active link and a long post on a phone', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Shell');
  await page.setViewportSize({ width: 360, height: 740 });
  await signIn(page, user);

  await expect(page.getByText('No posts yet')).toBeVisible();
  await expect(page).toHaveTitle('Shell · Pulse');
  await expect(page.getByRole('link', { name: 'Profile' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await page
    .getByRole('textbox', { name: 'New post' })
    .fill(`A long word: ${'x'.repeat(120)}`);
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.locator('main article')).toHaveCount(1);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});

test('keyboard: skip link, focus ring and focus moving to main on navigation', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Keys');
  await signIn(page, user);
  await expect(page.getByText('No posts yet')).toBeVisible();

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  expect((await skipLink.boundingBox())?.width).toBeGreaterThan(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(
      () => getComputedStyle(document.activeElement as Element).outlineStyle,
    ),
  ).not.toBe('none');

  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveTitle('Users · Pulse');
});

test('empty chats link to the users page', async ({ page, request }) => {
  const user = await registerUser(request, 'Lonely');
  await signIn(page, user, '/chats');
  await expect(page.getByText('No chats yet')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Find someone to talk to' }),
  ).toBeVisible();
});

test('the users list shows the API error and recovers with Try again', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Viewer');
  const other = await registerUser(request, 'Listed');
  await page.route('**/api/users', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: '{"message":"Database is down"}',
    }),
  );
  await signIn(page, user, '/users');

  const error = page
    .getByRole('alert')
    .filter({ hasText: 'Could not load users' });
  await expect(error).toContainText('Database is down', { timeout: 15_000 });
  await page.unroute('**/api/users');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator(`a[href="/profile/${other.id}"]`)).toBeVisible();
});

test('an unknown profile fails fast without retries', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Seeker');
  await signIn(page, user);
  await expect(page.getByText('No posts yet')).toBeVisible();

  const startedAt = Date.now();
  await page.goto(`/profile/${UNKNOWN_USER_ID}`);
  await expect(page.getByText('Could not load this profile')).toBeVisible();
  expect(Date.now() - startedAt).toBeLessThan(5000);
});

test("another user's profile shows a loading state and its own empty copy", async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Visitor');
  const other = await registerUser(request, 'Quiet');
  await page.route(`**/api/users/${other.id}/posts**`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await signIn(page, user, `/profile/${other.id}`);

  await expect(
    page.getByRole('status', { name: 'Loading posts' }),
  ).toBeVisible();
  await expect(page.getByText('Nothing has been posted here.')).toBeVisible();
});

test('every page fits 360px and 1280px', async ({ page, request }) => {
  const user = await registerUser(request, 'Wide');
  const other = await registerUser(
    request,
    'Maximilian-Alexander-Wolfeschlegelstein',
  );
  const chatId = await createChat(request, user, [other]);
  const pages = [
    `/profile/${user.id}`,
    `/profile/${other.id}`,
    '/users',
    '/chats',
    `/chat/${chatId}`,
  ];
  await signIn(page, user);

  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(
        await horizontalOverflow(page),
        `${path} at ${width}px`,
      ).toBeLessThanOrEqual(0);
    }
  }
});

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import {
  axeViolations,
  collectPageErrors,
  createChat,
  registerUser,
  signIn,
} from './support.ts';

const trackScripts = (page: Page) => {
  const scripts = new Map<string, string>();
  page.on('response', async (response) => {
    if (!response.url().endsWith('.js')) return;
    scripts.set(response.url(), await response.text().catch(() => ''));
  });

  return {
    urls: () => new Set(scripts.keys()),
    hasSocket: () =>
      [...scripts.values()].some((code) => code.includes('engine.io')),
    hasForms: () =>
      [...scripts.values()].some(
        (code) => code.includes('zod') && code.includes('Invalid input'),
      ),
  };
};

const notFound = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Page not found' });

const pageError = (page: Page) =>
  page.getByRole('alert').filter({ hasText: 'This page could not be shown' });

test('an unknown URL shows the 404 page without loading feature code', async ({
  page,
}) => {
  const scripts = trackScripts(page);
  await page.goto('/does-not-exist');

  await expect(notFound(page)).toBeVisible();
  await expect(page).toHaveTitle('Page not found · Pulse');
  expect(await axeViolations(page)).toEqual([]);
  expect(scripts.hasSocket()).toBe(false);
  expect(scripts.hasForms()).toBe(false);

  await page.getByRole('link', { name: 'Go to the home page' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('the socket code loads only with the chat', async ({ page, request }) => {
  const user = await registerUser(request, 'Lazy');
  const other = await registerUser(request, 'Other');
  const chatId = await createChat(request, user, [other]);
  const scripts = trackScripts(page);

  await page.goto('/sign-in');
  await expect(page.getByRole('textbox', { name: 'Your email' })).toBeVisible();
  expect(scripts.hasSocket()).toBe(false);

  await signIn(page, user);
  await expect(page.getByText('No posts yet')).toBeVisible();
  expect(scripts.hasSocket()).toBe(false);

  const socketOpened = page.waitForEvent('websocket');
  await page.getByRole('link', { name: 'Chats' }).click();
  await page.locator(`main a[href="/chat/${chatId}"]`).click();
  await expect(page.getByRole('log', { name: 'Messages' })).toBeVisible();
  await socketOpened;
  expect(scripts.hasSocket()).toBe(true);
});

test('a signed-in user gets the 404 page and a link back to their profile', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Lost');
  await signIn(page, user, '/nowhere/at/all');

  await expect(notFound(page)).toBeVisible();
  await page.getByRole('link', { name: 'Go to the home page' }).click();
  await expect(page).toHaveURL(new RegExp(`/profile/${user.id}$`));
});

test('a crashing page keeps the shell and clears on navigation', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Crash');
  await signIn(page, user);
  await expect(page.getByText('No posts yet')).toBeVisible();

  await page.route('**/api/chat', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        })
      : route.continue(),
  );
  await page.getByRole('link', { name: 'Chats' }).click();

  await expect(pageError(page)).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);

  await page.unroute('**/api/chat');
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Users' }),
  ).toBeVisible();
  await expect(pageError(page)).toHaveCount(0);
});

test('a page chunk that fails to load shows the error, and Reload page recovers', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Stale');
  const scripts = trackScripts(page);
  await signIn(page, user, '/users');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Users' }),
  ).toBeVisible();

  const loaded = scripts.urls();
  let isBlocking = true;
  await page.route('**/assets/*.js', (route) =>
    isBlocking && !loaded.has(route.request().url())
      ? route.abort()
      : route.continue(),
  );
  await page.getByRole('link', { name: 'Chats' }).click();
  await expect(pageError(page)).toBeVisible();

  isBlocking = false;
  await page.getByRole('button', { name: 'Reload page' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Chats' }),
  ).toBeVisible();
});

test('a slow page chunk shows the progress bar and marks main busy', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Slow');
  const errors = collectPageErrors(page);
  const scripts = trackScripts(page);
  await signIn(page, user, '/users');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Users' }),
  ).toBeVisible();

  const loaded = scripts.urls();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/assets/*.js', async (route) => {
    if (!loaded.has(route.request().url())) await gate;
    await route.continue();
  });

  await page.getByRole('link', { name: 'Chats' }).click();
  const progress = page.locator('[class*="progress"]');
  await expect(progress).toBeVisible();
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'true');

  release();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Chats' }),
  ).toBeVisible();
  await expect(progress).toHaveCount(0);
  await expect(page.locator('main')).not.toHaveAttribute('aria-busy');
  expect(errors).toEqual([]);
});

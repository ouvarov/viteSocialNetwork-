import type { Page, Route } from '@playwright/test';
import { expect, test } from '@playwright/test';

import {
  PASSWORD,
  UNAUTHORIZED_BODY,
  countRequests,
  createChat,
  fillSignIn,
  logOut,
  registerUser,
  signIn,
  uniqueEmail,
} from './support.ts';

const fieldError = (page: Page, label: string) =>
  page.getByLabel(label).evaluate((element) => {
    const id = element.getAttribute('aria-describedby');

    return {
      invalid: element.getAttribute('aria-invalid'),
      message: id ? document.getElementById(id)?.textContent : null,
    };
  });

test('sign up lands on the home feed and keeps the token out of web storage', async ({
  page,
}) => {
  await page.goto('/sign-up');
  await expect(page.getByRole('button', { name: 'Sign up' })).toBeEnabled();
  await page.getByRole('textbox', { name: 'Your name' }).fill('Ada');
  await page
    .getByRole('textbox', { name: 'Your email' })
    .fill(uniqueEmail('ada'));
  await page.getByLabel('Your password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page).toHaveURL(/:3001\/$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Home' }),
  ).toBeAttached();
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
});

test('sign-up validates on the client before sending anything', async ({
  page,
}) => {
  const registers = countRequests(page, (url) =>
    url.pathname.endsWith('/auth/register'),
  );
  await page.goto('/sign-up');
  const name = page.getByRole('textbox', { name: 'Your name' });

  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(
    page.getByText(/^Enter your (name|email)$|^Use at least 8 characters$/),
  ).toHaveCount(3);
  expect(await fieldError(page, 'Your name')).toEqual({
    invalid: 'true',
    message: 'Enter your name',
  });
  await expect(name).toBeFocused();

  await name.fill('Forms');
  await expect(page.getByText('Enter your name')).toBeHidden();

  await page.getByRole('textbox', { name: 'Your email' }).fill('ada@');
  await page.getByLabel('Your password').fill('short');
  await page.getByRole('button', { name: 'Sign up' }).click();
  expect((await fieldError(page, 'Your email')).message).toBe(
    'Enter a valid email',
  );
  expect((await fieldError(page, 'Your password')).message).toBe(
    'Use at least 8 characters',
  );
  expect(registers).toHaveLength(0);
});

test('sign-up shows the server error for a taken email', async ({
  page,
  request,
}) => {
  const taken = await registerUser(request, 'Taken');
  const registers = countRequests(page, (url) =>
    url.pathname.endsWith('/auth/register'),
  );
  await page.goto('/sign-up');
  await page.getByRole('textbox', { name: 'Your name' }).fill('Again');
  await page
    .getByRole('textbox', { name: 'Your email' })
    .fill(`  ${taken.email}  `);
  await page.getByLabel('Your password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  expect(registers).toHaveLength(1);
});

test('sign-in validates on the client, and a double click sends one request', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Bob');
  const logins = countRequests(page, (url) =>
    url.pathname.endsWith('/auth/login'),
  );
  await page.goto('/sign-in');

  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Enter your password')).toBeVisible();
  expect(logins).toHaveLength(0);

  await fillSignIn(page, user.email, 'definitely-wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).dblclick();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.waitForTimeout(500);
  expect(logins).toHaveLength(1);

  await page.getByLabel('Your password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/:3001\/$/);
});

test('logging out clears the previous user from the cache', async ({
  page,
  request,
}) => {
  const secret = `Secret ${Date.now()}`;
  const shared = `Shared ${Date.now()}`;
  const ada = await registerUser(request, shared);
  const bob = await registerUser(request, 'Bob');
  const carol = await registerUser(request, secret);
  await createChat(request, ada, carol);
  await createChat(request, ada, bob);

  await signIn(page, ada, '/chats');
  await expect(page.getByRole('link', { name: secret })).toBeVisible();
  await logOut(page);
  await expect(page).toHaveURL(/\/sign-in$/);

  await fillSignIn(page, bob.email);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/:3001\/$/);
  await page.getByRole('link', { name: 'Chats' }).click();
  await expect(page.getByRole('link', { name: shared })).toBeVisible();
  await expect(page.getByRole('link', { name: secret })).toHaveCount(0);
});

test('parallel requests with an expired token share one refresh', async ({
  page,
  request,
}) => {
  const viewer = await registerUser(request, 'Viewer');
  const author = await registerUser(request, 'Author');
  await signIn(page, viewer, '/users');
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();

  const refreshes = countRequests(page, (url) =>
    url.pathname.endsWith('/auth/refresh'),
  );
  const rejected = new Set<string>();
  const rejectOnce = (route: Route) => {
    const path = new URL(route.request().url()).pathname;
    if (rejected.has(path)) return route.continue();
    rejected.add(path);

    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: UNAUTHORIZED_BODY,
    });
  };
  await page.route(`**/api/users/${author.id}`, rejectOnce);
  await page.route(`**/api/users/${author.id}/posts**`, rejectOnce);

  await page.locator(`main a[href="/profile/${author.id}"]`).click();
  await expect(page.getByRole('heading', { name: 'Author' })).toBeVisible();
  await expect(page.getByText('Nothing has been posted here.')).toBeVisible();
  expect(rejected.size).toBe(2);
  expect(refreshes).toHaveLength(1);
});

test('a failed refresh signs out, and signing in returns to the wanted page', async ({
  page,
  request,
}) => {
  const viewer = await registerUser(request, 'Viewer');
  const other = await registerUser(request, 'Other');
  await signIn(page, viewer, '/users');
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();

  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
  await page.route(`**/api/users/${other.id}**`, (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
  await page.locator(`main a[href="/profile/${other.id}"]`).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.unrouteAll();

  await fillSignIn(page, viewer.email);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(new RegExp(`/profile/${other.id}$`));
});

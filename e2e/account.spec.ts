import { expect, test } from '@playwright/test';

import {
  API,
  PASSWORD,
  axeViolations,
  fillSignIn,
  registerUser,
  signIn,
} from './support.ts';

test('deleting your account asks for the password and signs you out', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Leaving');
  await signIn(page, user);
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  const password = dialog.getByLabel('Your password');

  await page.getByRole('button', { name: 'Delete account' }).click();
  await expect(dialog).toContainText('Your profile, posts and likes');
  expect(await axeViolations(page)).toEqual([]);

  await dialog.getByRole('button', { name: 'Delete account' }).click();
  await expect(password).toHaveAccessibleDescription('Enter your password');

  await password.fill('wrong-password');
  await password.press('Enter');
  await expect(password).toHaveAccessibleDescription('Wrong password');
  await expect(page).toHaveURL(new RegExp(`/profile/${user.id}$`));

  await password.fill(PASSWORD);
  await dialog.getByRole('button', { name: 'Delete account' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await fillSignIn(page, user.email);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  const profile = await request.get(`${API}/users/${user.id}`, {
    headers: { authorization: `Bearer ${user.token}` },
  });
  expect(profile.status()).toBe(404);
});

test('registering with an email that differs only in case is refused with a way to sign in', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Ada');
  await page.goto('/sign-up');

  await page.getByLabel('Your name').fill('Ada again');
  await page
    .getByRole('textbox', { name: 'Your email' })
    .fill(user.email.toUpperCase());
  await page.getByLabel('Your password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign up' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText(
    'An account with this email already exists.',
  );
  await alert.getByRole('link', { name: 'Sign in instead' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

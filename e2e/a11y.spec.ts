import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import {
  PASSWORD,
  axeViolations,
  createChat,
  registerUser,
  signIn,
  uniqueEmail,
} from './support.ts';

const DARK_BACKGROUND = 'rgb(17, 15, 23)';
const LIGHT_BACKGROUND = 'rgb(246, 244, 250)';

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('dark system theme', () => {
  test.use({ colorScheme: 'dark' });

  test('is the default, toggles to light and remembers the choice before React renders', async ({
    page,
  }) => {
    await page.goto('/sign-up');
    await expect(
      page.getByRole('textbox', { name: 'Your name' }),
    ).toBeVisible();
    expect(await bodyBackground(page)).toBe(DARK_BACKGROUND);
    expect(await axeViolations(page)).toEqual([]);

    await page.getByRole('textbox', { name: 'Your name' }).fill('Theme');
    await page
      .getByRole('textbox', { name: 'Your email' })
      .fill(uniqueEmail('theme'));
    await page.getByLabel('Your password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page
      .getByRole('textbox', { name: 'New post' })
      .fill('Contrast check');
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(
      page.getByText('Contrast check', { exact: true }),
    ).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);

    await page.getByRole('button', { name: 'Light theme' }).click();
    expect(await bodyBackground(page)).toBe(LIGHT_BACKGROUND);
    await expect(
      page.getByRole('button', { name: 'Dark theme' }),
    ).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);

    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(
      await page.evaluate(() => document.documentElement.dataset.theme),
    ).toBe('light');
  });
});

test.describe('light system theme', () => {
  test.use({ colorScheme: 'light' });

  test('is followed without a stored choice', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByLabel('Your email')).toBeVisible();
    expect(await bodyBackground(page)).toBe(LIGHT_BACKGROUND);
    expect(
      await page.evaluate(() => document.documentElement.dataset.theme ?? null),
    ).toBeNull();
    expect(await axeViolations(page)).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shortens animations', async ({ page }) => {
    await page.goto('/sign-in');
    const duration = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.animation = 'spin 1s infinite';
      document.body.append(probe);

      return getComputedStyle(probe).animationDuration;
    });
    expect(['1e-05s', '0.00001s']).toContain(duration);
  });
});

for (const theme of ['dark', 'light']) {
  test(`every signed-in page has no axe violations in the ${theme} theme`, async ({
    page,
    request,
  }) => {
    const user = await registerUser(request, 'Axe');
    const other = await registerUser(request, 'Other');
    const chatId = await createChat(request, user, [other]);
    await page.addInitScript((value) => {
      localStorage.setItem('pulse-theme', value);
    }, theme);
    await signIn(page, user);

    for (const path of [
      `/profile/${user.id}`,
      `/profile/${other.id}`,
      '/users',
      '/chats',
      `/chat/${chatId}`,
    ]) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await axeViolations(page), path).toEqual([]);
    }
  });
}

import { expect, test } from '@playwright/test';

import { countRequests, registerUser, signIn } from './support.ts';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test('image upload shows the API error for a non-image and a preview for a PNG', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Uploader');
  await signIn(page, user, '/');
  const fileInput = page.locator('input[type=file]');

  await fileInput.setInputFiles({
    name: 'fake.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not really an image'),
  });
  await expect(page.getByRole('alert')).toBeVisible();

  await fileInput.setInputFiles({
    name: 'dot.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  });
  await expect(page.locator('figure img').first()).toHaveAttribute(
    'src',
    /\/uploads\/users\//,
  );
});

test('a post can be published, liked and unliked', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Author');
  await signIn(page, user, '/');
  const text = `hello ${Date.now()}`;

  await page.getByRole('textbox', { name: 'New post' }).fill(text);
  await page.getByRole('button', { name: 'Publish' }).click();
  const post = page
    .locator('main article')
    .filter({ has: page.getByText(text, { exact: true }) });
  const like = post.getByRole('button', { name: /^Like/ });

  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toHaveText('Like 1');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await expect(like).toHaveText('Like 0');
});

test('the post form validates and trims before sending', async ({
  page,
  request,
}) => {
  const user = await registerUser(request, 'Writer');
  const creates = countRequests(
    page,
    (url, method) => method === 'POST' && url.pathname === '/api/posts',
  );
  await signIn(page, user, '/');
  const field = page.getByRole('textbox', { name: 'New post' });
  const publish = page.getByRole('button', { name: 'Publish' });

  await field.fill('    ');
  await publish.click();
  await expect(page.getByText('Write something first')).toBeVisible();

  await field.fill('x'.repeat(2001));
  await publish.click();
  await expect(page.getByText('Keep it under 2000 characters')).toBeVisible();
  expect(creates).toHaveLength(0);

  await field.fill('  Trimmed post  ');
  await publish.click();
  await expect(page.getByText('Trimmed post', { exact: true })).toBeVisible();
  await expect(field).toHaveValue('');
  expect(creates).toHaveLength(1);
});

import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import type { TestUser } from './support.ts';
import { API, axeViolations, registerUser, signIn } from './support.ts';

const uniqueName = (name: string) => `${name} ${randomUUID().slice(0, 8)}`;

const setUpPeople = async (request: APIRequestContext) => ({
  ada: await registerUser(request, uniqueName('Ada')),
  bob: await registerUser(request, uniqueName('Bob')),
  carol: await registerUser(request, uniqueName('Carol')),
});

const choosePerson = (page: Page, user: TestUser) =>
  page.getByRole('checkbox', { name: user.name }).check();

const createGroup = async (
  page: Page,
  owner: TestUser,
  people: TestUser[],
  title: string,
) => {
  await signIn(page, owner, '/chats');
  await page.getByRole('button', { name: 'New group' }).click();
  await page.getByRole('textbox', { name: 'Group name' }).fill(title);
  for (const user of people) await choosePerson(page, user);
  await page.getByRole('button', { name: 'Create group' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
};

test('creating a group asks for a name and at least one person', async ({
  page,
  request,
}) => {
  const { ada } = await setUpPeople(request);
  await signIn(page, ada, '/chats');

  await page.getByRole('button', { name: 'New group' }).click();
  await page.getByRole('button', { name: 'Create group' }).click();
  await expect(page.getByText('Name the group')).toBeVisible();

  await page.getByRole('textbox', { name: 'Group name' }).fill('Team');
  await page.getByRole('button', { name: 'Create group' }).click();
  await expect(page.getByText('Choose at least one person')).toBeVisible();
});

test('a group shows who wrote what, and its members can talk', async ({
  browser,
  page,
  request,
}) => {
  const { ada, bob, carol } = await setUpPeople(request);
  await createGroup(page, ada, [bob, carol], 'Launch crew');
  const chatUrl = page.url();

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await signIn(bobPage, bob, '/chats');
  await expect(
    bobPage.getByRole('link', { name: /Launch crew/ }),
  ).toBeVisible();
  await bobPage.goto(chatUrl);
  await expect(
    bobPage.getByRole('heading', { name: 'Launch crew' }),
  ).toBeVisible();

  await page.getByRole('textbox', { name: 'Message' }).fill('Ship it');
  await page.getByRole('button', { name: 'Send' }).click();

  const fromAda = bobPage
    .getByRole('log', { name: 'Messages' })
    .locator('li:not([data-day])')
    .filter({ hasText: 'Ship it' });
  await expect(fromAda).toContainText(ada.name);

  await bobContext.close();
});

test('the owner manages people and someone removed loses the chat at once', async ({
  browser,
  page,
  request,
}) => {
  const { ada, bob, carol } = await setUpPeople(request);
  await createGroup(page, ada, [bob, carol], 'Moderated');
  const chatUrl = page.url();

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await signIn(bobPage, bob, chatUrl);
  await expect(
    bobPage.getByRole('heading', { name: 'Moderated' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Group info' }).click();
  await page
    .getByRole('button', { name: `Make ${carol.name} a moderator` })
    .click();
  await expect(
    page.getByRole('button', {
      name: `Make ${carol.name} a member`,
    }),
  ).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);

  await page.getByRole('button', { name: `Remove ${bob.name}` }).click();
  await page
    .getByRole('dialog', { name: `Remove ${bob.name}?` })
    .getByRole('button', { name: 'Remove' })
    .click();
  await expect(
    page.getByRole('button', { name: `Remove ${bob.name}` }),
  ).toHaveCount(0);

  await expect(bobPage.getByText('Could not open this chat')).toBeVisible();
  await bobContext.close();
});

test('a member sees no management, and leaving returns to the list', async ({
  browser,
  page,
  request,
}) => {
  const { ada, bob, carol } = await setUpPeople(request);
  await createGroup(page, ada, [bob, carol], 'Plain');
  const chatUrl = page.url();

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await signIn(bobPage, bob, chatUrl);

  await bobPage.getByRole('button', { name: 'Group info' }).click();
  await expect(bobPage.getByRole('button', { name: 'Add people' })).toHaveCount(
    0,
  );
  await expect(
    bobPage.getByRole('button', { name: `Remove ${carol.name}` }),
  ).toHaveCount(0);
  await expect(
    bobPage.getByRole('button', { name: 'Delete group' }),
  ).toHaveCount(0);

  await bobPage.getByRole('button', { name: 'Leave group' }).click();
  await bobPage
    .getByRole('dialog', { name: 'Leave Plain?' })
    .getByRole('button', { name: 'Leave' })
    .click();
  await expect(bobPage).toHaveURL(/\/chats$/);
  await expect(bobPage.getByRole('link', { name: /Plain/ })).toHaveCount(0);
  await bobContext.close();
});

test('closing group info returns focus to the button that opened it', async ({
  page,
  request,
}) => {
  const { ada, bob } = await setUpPeople(request);
  await createGroup(page, ada, [bob], 'Focused');

  await page.getByRole('button', { name: 'Group info' }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByRole('button', { name: 'Group info' })).toBeFocused();
});

test('a failed refresh keeps the open chat on screen', async ({
  page,
  request,
}) => {
  const { ada, bob } = await setUpPeople(request);
  await createGroup(page, ada, [bob], 'Steady');
  await page.getByRole('textbox', { name: 'Message' }).fill('Still here');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Still here')).toBeVisible();
  const chatId = page.url().split('/').pop();

  await page.route(`**/api/chat/find/${chatId}`, (route) =>
    route.fulfill({ status: 503, body: '{}' }),
  );
  const refreshFailed = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/chat/find/${chatId}`) &&
      response.status() === 503,
  );
  const renamed = await request.patch(`${API}/chat/${chatId}`, {
    headers: { authorization: `Bearer ${ada.token}` },
    data: { title: 'Renamed elsewhere' },
  });
  expect(renamed.ok()).toBe(true);
  await refreshFailed;

  await expect(page.getByText('Could not open this chat')).toHaveCount(0);
  await expect(page.getByText('Still here')).toBeVisible();
});

test('the owner deletes the group for everyone', async ({ page, request }) => {
  const { ada, bob } = await setUpPeople(request);
  await createGroup(page, ada, [bob], 'Short lived');

  await page.getByRole('button', { name: 'Group info' }).click();
  await page.getByRole('button', { name: 'Delete group' }).click();
  await page
    .getByRole('dialog', { name: 'Delete Short lived?' })
    .getByRole('button', { name: 'Delete group' })
    .click();

  await expect(page).toHaveURL(/\/chats$/);
  await expect(page.getByRole('link', { name: /Short lived/ })).toHaveCount(0);
});

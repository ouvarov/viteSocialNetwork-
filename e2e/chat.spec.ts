import type { APIRequestContext, Page, WebSocketRoute } from '@playwright/test';
import { expect, test } from '@playwright/test';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import type { TestUser } from './support.ts';
import {
  API_ORIGIN,
  axeViolations,
  collectPageErrors,
  countRequests,
  createChat,
  registerUser,
  signIn,
} from './support.ts';

type SocketControl = {
  block: (isBlocked: boolean) => void;
  drop: () => void;
  rejectNextToken: () => void;
};

const rejectedToken = () => {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'expired', typ: 'access', iat: now - 3600, exp: now - 1800 })}.invalid-signature`;
};

const controlSocket = async (page: Page): Promise<SocketControl> => {
  let isBlocked = false;
  let rejectNext = false;
  const open = new Set<WebSocketRoute>();

  await page.routeWebSocket(/\/socket\.io\//, (ws) => {
    if (isBlocked) {
      const refused = ws.connectToServer();
      refused.onClose(() => void ws.close());
      void refused.close();
      return;
    }

    const server = ws.connectToServer();
    const reject = rejectNext;
    rejectNext = false;
    open.add(ws);
    ws.onClose(() => {
      open.delete(ws);
      void server.close();
    });
    server.onClose(() => void ws.close());
    ws.onMessage((message) => {
      if (
        reject &&
        typeof message === 'string' &&
        message.startsWith('40/chat,')
      ) {
        server.send(`40/chat,${JSON.stringify({ token: rejectedToken() })}`);
        return;
      }
      server.send(message);
    });
    server.onMessage((message) => ws.send(message));
  });

  return {
    block: (value) => {
      isBlocked = value;
    },
    drop: () => open.forEach((ws) => void ws.close()),
    rejectNextToken: () => {
      rejectNext = true;
    },
  };
};

const connectAs = async (user: TestUser, chatId: string) => {
  const socket: Socket = io(`${API_ORIGIN}/chat`, {
    transports: ['websocket'],
    auth: { token: user.token },
  });
  await new Promise<void>((resolve) => socket.once('connect', () => resolve()));
  await socket.timeout(5000).emitWithAck('joinChat', { chatId });

  return {
    say: (content: string) =>
      socket.timeout(5000).emitWithAck('createMessage', { chatId, content }),
    close: () => socket.disconnect(),
  };
};

const setUpChat = async (request: APIRequestContext, name?: string) => {
  const ada = await registerUser(request, 'Ada');
  const bob = await registerUser(request, 'Bob');
  const chatId = await createChat(request, ada, [bob], name);

  return { ada, bob, chatId };
};

const messages = (page: Page) =>
  page.getByRole('log', { name: 'Messages' }).locator('li');

const message = (page: Page, text: string) =>
  messages(page).filter({ hasText: text });

const connecting = (page: Page) =>
  page.getByRole('status').filter({ hasText: 'Connecting to the chat…' });

const send = async (page: Page, text: string) => {
  await page.getByRole('textbox', { name: 'Message' }).fill(text);
  await page.getByRole('button', { name: 'Send' }).click();
};

test.describe('realtime chat', () => {
  test('live messages land in the cache, and your own shows once', async ({
    page,
    request,
  }) => {
    const { ada, bob, chatId } = await setUpChat(request);
    const bobSocket = await connectAs(bob, chatId);
    await bobSocket.say('history from bob');
    const errors = collectPageErrors(page);
    const chatLoads = countRequests(page, (url) =>
      url.pathname.startsWith('/api/chat/find/'),
    );

    await signIn(page, ada, `/chat/${chatId}`);
    await expect(message(page, 'history from bob')).toBeVisible();
    await expect(connecting(page)).toHaveCount(0);
    await expect.poll(() => chatLoads.length).toBe(2);

    await bobSocket.say('live from bob');
    await expect(message(page, 'live from bob')).toBeVisible();
    expect(chatLoads).toHaveLength(2);

    await send(page, 'hello from ada');
    await expect(message(page, 'hello from ada')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(message(page, 'hello from ada')).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue(
      '',
    );
    expect(errors).toEqual([]);
    bobSocket.close();
  });

  test('messages sent while offline appear after reconnecting, and a timed-out send is not replayed', async ({
    page,
    request,
  }) => {
    const { ada, bob, chatId } = await setUpChat(request);
    const bobSocket = await connectAs(bob, chatId);
    const socket = await controlSocket(page);
    await signIn(page, ada, `/chat/${chatId}`);
    await expect(page.getByText('No messages yet')).toBeVisible();
    await expect(connecting(page)).toHaveCount(0);

    socket.block(true);
    socket.drop();
    await expect(connecting(page)).toBeVisible();
    await bobSocket.say('missed one');
    await bobSocket.say('missed two');

    await send(page, 'sent while offline');
    await expect(
      page.getByRole('alert').filter({ hasText: 'Message not sent' }),
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue(
      'sent while offline',
    );

    socket.block(false);
    await expect(connecting(page)).toHaveCount(0, { timeout: 15_000 });
    await expect(message(page, 'missed two')).toBeVisible();

    await page.getByRole('button', { name: 'Send' }).click();
    await expect(message(page, 'sent while offline')).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(messages(page)).toHaveText([
      'missed one',
      'missed two',
      'sent while offline',
    ]);
    bobSocket.close();
  });

  test('a message arriving during a refetch survives the older response', async ({
    page,
    request,
  }) => {
    const { ada, bob, chatId } = await setUpChat(request);
    const bobSocket = await connectAs(bob, chatId);
    const socket = await controlSocket(page);
    await signIn(page, ada, `/chat/${chatId}`);
    await expect(page.getByText('No messages yet')).toBeVisible();
    await expect(connecting(page)).toHaveCount(0);

    let markFetched = () => {};
    const fetched = new Promise<void>((resolve) => {
      markFetched = resolve;
    });
    await page.route(`**/api/chat/find/${chatId}`, async (route) => {
      const response = await route.fetch();
      markFetched();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({ response }).catch(() => undefined);
    });

    socket.drop();
    await fetched;
    await bobSocket.say('during the refetch');
    await expect(message(page, 'during the refetch')).toBeVisible({
      timeout: 1500,
    });
    await page.waitForTimeout(3000);
    await expect(message(page, 'during the refetch')).toHaveCount(1);
    bobSocket.close();
  });

  test('a message arriving before the first history load is not lost', async ({
    page,
    request,
  }) => {
    const { ada, bob, chatId } = await setUpChat(request);
    const bobSocket = await connectAs(bob, chatId);
    let fetchedCount = 0;
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`**/api/chat/find/${chatId}`, async (route) => {
      const response = await route.fetch();
      fetchedCount += 1;
      await gate;
      await route.fulfill({ response }).catch(() => undefined);
    });

    await signIn(page, ada, `/chat/${chatId}`);
    await expect.poll(() => fetchedCount).toBe(2);
    await bobSocket.say('before the history');
    await page.waitForTimeout(500);
    release();

    await expect(message(page, 'before the history')).toBeVisible();
    bobSocket.close();
  });

  test('a rejected token refreshes the session and the socket reconnects', async ({
    page,
    request,
  }) => {
    const { ada, bob, chatId } = await setUpChat(request);
    const bobSocket = await connectAs(bob, chatId);
    const socket = await controlSocket(page);
    await signIn(page, ada, `/chat/${chatId}`);
    await expect(page.getByText('No messages yet')).toBeVisible();
    await expect(connecting(page)).toHaveCount(0);

    const refreshed = page.waitForRequest((request) =>
      request.url().endsWith('/api/auth/refresh'),
    );
    socket.rejectNextToken();
    socket.drop();
    await refreshed;
    await expect(connecting(page)).toHaveCount(0, { timeout: 15_000 });
    await page.waitForTimeout(500);

    await bobSocket.say('after the refresh');
    await expect(message(page, 'after the refresh')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/chat/${chatId}$`));
    bobSocket.close();
  });

  test('logging out closes the chat socket', async ({ page, request }) => {
    const { ada, chatId } = await setUpChat(request);
    const opened = page.waitForEvent('websocket');
    await signIn(page, ada, `/chat/${chatId}`);
    const socket = await opened;
    await expect(page.getByText('No messages yet')).toBeVisible();
    await expect(connecting(page)).toHaveCount(0);

    const closed = socket.waitForEvent('close');
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await closed;
  });
});

test('starting a chat from a profile, renaming it and messaging', async ({
  page,
  request,
}) => {
  const ada = await registerUser(request, 'Ada');
  const bob = await registerUser(request, 'Bob');
  const renames = countRequests(page, (url) =>
    url.pathname.endsWith('/chat/update'),
  );
  await signIn(page, ada, `/profile/${bob.id}`);

  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  await expect(page.getByText('No messages yet')).toBeVisible();

  await send(page, '  ');
  await expect(page.getByText('Write a message first')).toBeVisible();
  await send(page, 'hi bob');
  await expect(message(page, 'hi bob')).toBeVisible();

  const rename = page.getByRole('button', { name: 'Rename' });
  await rename.click();
  await expect(rename).toHaveAttribute('aria-expanded', 'true');
  const chatName = page.getByRole('textbox', { name: 'Chat name' });
  await expect(chatName).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Delete chat' }),
  ).toHaveAttribute('type', 'button');

  await chatName.fill('   ');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByText('Enter a chat name')).toBeVisible();
  expect(renames).toHaveLength(0);

  const name = `Plans ${Date.now()}`;
  await chatName.fill(name);
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();

  await page.getByRole('link', { name: 'Chats' }).click();
  await expect(page.getByRole('link', { name })).toBeVisible();
});

test('deleting a chat asks for confirmation', async ({ page, request }) => {
  const name = `Doomed ${Date.now()}`;
  const { ada, chatId } = await setUpChat(request, name);
  await signIn(page, ada, `/chat/${chatId}`);
  const deleteButton = page.getByRole('button', { name: 'Delete chat' });
  const dialog = page.getByRole('dialog', { name: 'Delete this chat?' });

  await deleteButton.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  expect(await axeViolations(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(deleteButton).toBeFocused();

  await page.route(`**/api/chat/${chatId}`, (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"message":"Could not reach the database"}',
        })
      : route.continue(),
  );
  await deleteButton.click();
  await dialog.getByRole('button', { name: 'Delete chat' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'Could not reach the database',
  );
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await page.unroute(`**/api/chat/${chatId}`);

  await deleteButton.click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Delete chat' }).click();
  await expect(page).toHaveURL(/\/chats$/);
  await expect(page.getByRole('heading', { name: 'Chats' })).toBeVisible();
  await expect(page.getByRole('link', { name })).toHaveCount(0);
});

import { randomUUID } from 'node:crypto';

import { AxeBuilder } from '@axe-core/playwright';
import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

const API_ORIGIN = process.env.E2E_API_ORIGIN ?? 'http://localhost:5000';
const API = `${API_ORIGIN}/api`;
const SOCKET_ORIGIN = process.env.E2E_SOCKET_ORIGIN ?? 'http://localhost:5000';
const PASSWORD = 'correct-horse-battery';
const UNAUTHORIZED_BODY = '{"statusCode":401,"message":"Unauthorized"}';

type TestUser = { id: string; name: string; email: string; token: string };

type AuthResponse = { access_token: string; userData: { id: string } };

const uniqueEmail = (name: string) =>
  `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 20)}-${randomUUID()}@example.com`;

const registerUser = async (
  request: APIRequestContext,
  name = 'User',
): Promise<TestUser> => {
  const email = uniqueEmail(name);
  const response = await request.post(`${API}/auth/register`, {
    data: { email, password: PASSWORD, userName: name },
  });
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as AuthResponse;

  return { id: body.userData.id, name, email, token: body.access_token };
};

const apiCall = async <Body>(
  request: APIRequestContext,
  user: TestUser,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown,
): Promise<Body> => {
  const response = await request.fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${user.token}` },
    data,
  });
  expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBe(
    true,
  );
  const text = await response.text();

  return (text ? JSON.parse(text) : undefined) as Body;
};

const createChat = async (
  request: APIRequestContext,
  owner: TestUser,
  members: TestUser[],
  name?: string,
) => {
  const { chatId } = await apiCall<{ chatId: string }>(
    request,
    owner,
    'POST',
    '/chat/create',
    { userIds: members.map(({ id }) => id) },
  );

  if (name) {
    await apiCall(request, owner, 'PUT', '/chat/update', {
      chatId,
      newChatName: name,
    });
  }

  return chatId;
};

const signIn = async (page: Page, user: TestUser, path?: string) => {
  const response = await page.request.post(`${API}/auth/login`, {
    data: { email: user.email, password: PASSWORD },
  });
  expect(response.ok()).toBe(true);
  await page.goto(path ?? `/profile/${user.id}`);
};

const fillSignIn = async (page: Page, email: string, password = PASSWORD) => {
  await page.getByRole('textbox', { name: 'Your email' }).fill(email);
  await page.getByLabel('Your password').fill(password);
};

const axeViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  return violations.map(
    ({ id, nodes }) => `${id} (${nodes.length}: ${nodes[0]?.target.join(' ')})`,
  );
};

const horizontalOverflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

const countRequests = (
  page: Page,
  matches: (url: URL, method: string) => boolean,
) => {
  const urls: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (matches(url, request.method())) urls.push(url.href);
  });

  return urls;
};

const collectPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
};

export {
  API,
  SOCKET_ORIGIN,
  PASSWORD,
  UNAUTHORIZED_BODY,
  apiCall,
  axeViolations,
  collectPageErrors,
  countRequests,
  createChat,
  fillSignIn,
  horizontalOverflow,
  registerUser,
  signIn,
  uniqueEmail,
};
export type { TestUser };

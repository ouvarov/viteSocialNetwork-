import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ChatsDataTypes } from '@/features/chat/types.ts';
import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, USER } from '@/test/server.ts';

import { Chats } from './index.tsx';

const BOB = {
  id: '22222222-2222-4222-8222-222222222222',
  userName: 'Bob',
  imageUrl: null,
};

const chat = (overrides: Partial<ChatsDataTypes>): ChatsDataTypes => ({
  chatId: '33333333-3333-4333-8333-333333333333',
  peer: BOB,
  lastMessageAt: null,
  lastMessage: null,
  unreadCount: 0,
  ...overrides,
});

const serveChats = (...chats: ChatsDataTypes[]) =>
  server.use(http.get(`${API}/chat`, () => HttpResponse.json(chats)));

const rowOf = async (name: string) =>
  screen.findByRole('link', { name: new RegExp(name) });

describe('Chats', () => {
  it('previews the last message and counts the unread ones', async () => {
    serveChats(
      chat({
        lastMessage: {
          content: 'Did the build pass?',
          senderId: BOB.id,
          sentAt: new Date().toISOString(),
        },
        unreadCount: 3,
      }),
    );
    renderWithProviders(<Chats />, { auth: { user: USER } });

    const row = await rowOf('Bob');
    expect(within(row).getByText('Did the build pass?')).toBeInTheDocument();
    expect(within(row).getByLabelText('3 unread')).toHaveTextContent('3');
  });

  it('marks your own last message and shows no badge when all is read', async () => {
    serveChats(
      chat({
        lastMessage: {
          content: 'Green on the first try',
          senderId: USER.id,
          sentAt: new Date().toISOString(),
        },
      }),
    );
    renderWithProviders(<Chats />, { auth: { user: USER } });

    const row = await rowOf('Bob');
    expect(
      within(row).getByText('You: Green on the first try'),
    ).toBeInTheDocument();
    expect(within(row).queryByLabelText(/unread/)).not.toBeInTheDocument();
  });

  it('says when a chat has no messages yet', async () => {
    serveChats(chat({}));
    renderWithProviders(<Chats />, { auth: { user: USER } });

    expect(
      within(await rowOf('Bob')).getByText('No messages yet'),
    ).toBeInTheDocument();
  });
});

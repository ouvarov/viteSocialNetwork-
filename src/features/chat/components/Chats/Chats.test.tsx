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
  kind: 'direct',
  title: null,
  memberCount: 2,
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
  it('shows a group by its name, with who wrote the last message', async () => {
    serveChats(
      chat({
        kind: 'group',
        title: 'Launch crew',
        memberCount: 3,
        peer: null,
        lastMessage: {
          content: 'Ship it',
          senderId: BOB.id,
          senderName: BOB.userName,
          sentAt: new Date().toISOString(),
        },
      }),
    );
    renderWithProviders(<Chats />, { auth: { user: USER } });

    const row = await rowOf('Launch crew');
    expect(within(row).getByText('Bob: Ship it')).toBeInTheDocument();
  });

  it('counts people in a group with no messages yet', async () => {
    serveChats(
      chat({ kind: 'group', title: 'Quiet', memberCount: 4, peer: null }),
    );
    renderWithProviders(<Chats />, { auth: { user: USER } });

    const row = await rowOf('Quiet');
    expect(within(row).getByText('4 people')).toBeInTheDocument();
  });

  it('previews the last message and counts the unread ones', async () => {
    serveChats(
      chat({
        lastMessage: {
          content: 'Did the build pass?',
          senderId: BOB.id,
          senderName: BOB.userName,
          sentAt: new Date().toISOString(),
        },
        unreadCount: 3,
      }),
    );
    renderWithProviders(<Chats />, { auth: { user: USER } });

    const row = await rowOf('Bob');
    expect(within(row).getByText('Did the build pass?')).toBeInTheDocument();
    expect(row).toHaveAccessibleName(/3 unread/);
  });

  it('marks your own last message and shows no badge when all is read', async () => {
    serveChats(
      chat({
        lastMessage: {
          content: 'Green on the first try',
          senderId: USER.id,
          senderName: USER.userName,
          sentAt: new Date().toISOString(),
        },
      }),
    );
    renderWithProviders(<Chats />, { auth: { user: USER } });

    const row = await rowOf('Bob');
    expect(
      within(row).getByText('You: Green on the first try'),
    ).toBeInTheDocument();
    expect(row).not.toHaveAccessibleName(/unread/);
  });

  it('says when a chat has no messages yet', async () => {
    serveChats(chat({}));
    renderWithProviders(<Chats />, { auth: { user: USER } });

    expect(
      within(await rowOf('Bob')).getByText('No messages yet'),
    ).toBeInTheDocument();
  });
});

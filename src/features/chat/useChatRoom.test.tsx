import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/api/query-client.ts';

import { ChatSocketError, useChatRoom } from './useChatRoom.ts';

type Ack = (timeoutError: Error | null, result: unknown) => void;

const fakeSocket = vi.hoisted(() => ({
  connected: true,
  connect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  answers: new Map<string, unknown[]>(),
  timeout() {
    return {
      emit: (event: string, _payload: unknown, ack: Ack) => {
        const [result, ...rest] = fakeSocket.answers.get(event) ?? [];
        fakeSocket.answers.set(event, rest.length ? rest : [result]);
        ack(null, result);
      },
    };
  },
}));

vi.mock('@/api/socket.ts', () => ({ socket: fakeSocket }));

const CHAT_ID = '22222222-2222-4222-8222-222222222222';
const JOIN_FAILED = {
  ok: false,
  error: { statusCode: 404, message: 'Chat not found' },
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useChatRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeSocket.answers.clear();
  });

  it('reports a failed join and joins again on retry', async () => {
    fakeSocket.answers.set('joinChat', [JOIN_FAILED, { ok: true, data: null }]);
    const { result } = renderHook(() => useChatRoom(CHAT_ID), { wrapper });

    await waitFor(() => expect(result.current.isJoinFailed).toBe(true));

    act(() => result.current.retryJoin());

    await waitFor(() => expect(result.current.isJoinFailed).toBe(false));
  });

  it('rejects a send with the error from the ack', async () => {
    fakeSocket.answers.set('joinChat', [{ ok: true, data: null }]);
    fakeSocket.answers.set('createMessage', [
      { ok: false, error: { statusCode: 410, message: 'User deleted' } },
    ]);
    const { result } = renderHook(() => useChatRoom(CHAT_ID), { wrapper });

    const sending = result.current.sendMessage('Hello');

    await expect(sending).rejects.toBeInstanceOf(ChatSocketError);
    await expect(sending).rejects.toMatchObject({
      statusCode: 410,
      message: 'User deleted',
    });
  });

  it('leaves the room on unmount', () => {
    fakeSocket.answers.set('joinChat', [{ ok: true, data: null }]);
    const { unmount } = renderHook(() => useChatRoom(CHAT_ID), { wrapper });

    unmount();

    expect(fakeSocket.emit).toHaveBeenCalledWith('leaveChat', {
      chatId: CHAT_ID,
    });
  });
});

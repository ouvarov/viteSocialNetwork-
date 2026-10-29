import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FC } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { readAccessToken } from '@/api/access-token.ts';
import { createQueryClient } from '@/api/query-client.ts';
import { API, http, HttpResponse, server, session } from '@/test/server.ts';

import { AuthProvider } from './AuthProvider.tsx';
import { useAuth } from './useAuth.ts';

vi.mock('@/api/wake.ts', () => ({ wakeApi: () => Promise.resolve() }));

const SessionProbe: FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p>Restoring</p>;

  return <p>{user ? `Signed in as ${user.userName}` : 'Signed out'}</p>;
};

const renderProvider = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    </QueryClientProvider>,
  );

const refreshAnswering = (status: number) =>
  server.use(
    http.post(`${API}/auth/refresh`, () =>
      status === 200
        ? HttpResponse.json(session('access-2'))
        : HttpResponse.json({ statusCode: status }, { status }),
    ),
  );

describe('AuthProvider', () => {
  it('restores the session from the refresh cookie', async () => {
    refreshAnswering(200);
    renderProvider();

    expect(
      await screen.findByText('Signed in as Ada Lovelace'),
    ).toBeInTheDocument();
    expect(readAccessToken()).toBe('access-2');
  });

  it('starts signed out when the refresh cookie is rejected', async () => {
    renderProvider();

    expect(await screen.findByText('Signed out')).toBeInTheDocument();
  });

  it.each([503, 429])(
    'offers a retry instead of signing out on a %i',
    async (status) => {
      refreshAnswering(status);
      renderProvider();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "Pulse can't reach its server",
      );
      expect(screen.queryByText('Signed out')).not.toBeInTheDocument();

      refreshAnswering(200);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

      expect(
        await screen.findByText('Signed in as Ada Lovelace'),
      ).toBeInTheDocument();
    },
  );

  it('offers a retry when the network is down', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.error()));
    renderProvider();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Pulse can't reach its server",
    );
  });
});

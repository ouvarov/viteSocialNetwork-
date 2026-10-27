import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

import { createQueryClient } from '@/api/query-client.ts';
import type { AuthContextType } from '@/features/auth/types.ts';
import { AuthContext } from '@/features/auth/useAuth.ts';

type RenderOptions = {
  auth?: Partial<AuthContextType>;
  queryClient?: QueryClient;
};

const renderWithProviders = (
  ui: ReactNode,
  { auth, queryClient = createQueryClient() }: RenderOptions = {},
) => {
  const authValue: AuthContextType = {
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    hasSignedOut: false,
    ...auth,
  };

  return {
    user: userEvent.setup(),
    auth: authValue,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>{ui}</MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    ),
  };
};

export { renderWithProviders };

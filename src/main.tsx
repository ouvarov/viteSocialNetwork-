import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiError } from '@/api/errors.ts';
import App from '@/App';
import { AuthProvider } from '@/features/auth/AuthProvider.tsx';

import '@/styles/global.scss';

const MINUTE_MS = 60 * 1000;
const MAX_RETRIES = 2;

const shouldRetry = (failureCount: number, error: unknown): boolean =>
  !(error instanceof ApiError && error.status < 500) &&
  failureCount < MAX_RETRIES;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * MINUTE_MS,
      gcTime: 30 * MINUTE_MS,
      refetchOnWindowFocus: true,
      retry: shouldRetry,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

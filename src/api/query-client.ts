import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors.ts';

const MINUTE_MS = 60 * 1000;
const MAX_RETRIES = 2;

const shouldRetry = (failureCount: number, error: unknown): boolean =>
  !(error instanceof ApiError && error.status < 500) &&
  failureCount < MAX_RETRIES;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * MINUTE_MS,
        gcTime: 30 * MINUTE_MS,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
      },
    },
  });

export { createQueryClient, shouldRetry };

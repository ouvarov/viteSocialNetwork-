import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';

const USERS_PAGE_SIZE = 20;

const useUsers = () =>
  useInfiniteQuery({
    queryKey: queryKeys.users(),
    queryFn: ({ pageParam, signal }) =>
      unwrap(
        client.GET('/api/users', {
          params: { query: { limit: USERS_PAGE_SIZE, cursor: pageParam } },
          signal,
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

const useUser = (userId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.user(String(userId)),
    queryFn: () =>
      unwrap(
        client.GET('/api/users/{id}', {
          params: { path: { id: String(userId) } },
        }),
      ),
    enabled: Boolean(userId),
  });

export { useUser, useUsers };

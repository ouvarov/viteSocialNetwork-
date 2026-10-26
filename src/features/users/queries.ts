import { useQuery } from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';

const useUsers = () =>
  useQuery({
    queryKey: queryKeys.users(),
    queryFn: () => unwrap(client.GET('/api/users')),
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

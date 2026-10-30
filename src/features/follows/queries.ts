import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';
import { useAuth } from '@/features/auth/useAuth.ts';

import type {
  FollowStateTypes,
  PeoplePageTypes,
  ProfileTypes,
} from './types.ts';

type PeopleData = InfiniteData<PeoplePageTypes, string | undefined>;
type FollowView = Pick<FollowStateTypes, 'isFollowedByMe' | 'followersCount'>;

const findFollowView = (
  queryClient: QueryClient,
  userId: string,
): FollowView | undefined => {
  const source =
    queryClient.getQueryData<ProfileTypes>(queryKeys.user(userId)) ??
    queryClient
      .getQueryData<PeopleData>(queryKeys.users())
      ?.pages.flatMap((page) => page.items)
      .find((person) => person.id === userId);

  return (
    source && {
      isFollowedByMe: source.isFollowedByMe,
      followersCount: source.followersCount,
    }
  );
};

const updateFollowView = (
  queryClient: QueryClient,
  userId: string,
  update: (view: FollowView) => FollowView,
) => {
  queryClient.setQueryData<ProfileTypes>(queryKeys.user(userId), (profile) =>
    profile ? { ...profile, ...update(profile) } : profile,
  );
  queryClient.setQueryData<PeopleData>(queryKeys.users(), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((person) =>
              person.id === userId ? { ...person, ...update(person) } : person,
            ),
          })),
        }
      : data,
  );
};

const toggledView =
  (shouldFollow: boolean) =>
  (view: FollowView): FollowView =>
    view.isFollowedByMe === shouldFollow
      ? view
      : {
          isFollowedByMe: shouldFollow,
          followersCount: view.followersCount + (shouldFollow ? 1 : -1),
        };

const requestFollow = (userId: string, shouldFollow: boolean) => {
  const params = { path: { id: userId } };

  return unwrap(
    shouldFollow
      ? client.PUT('/api/users/{id}/follow', { params })
      : client.DELETE('/api/users/{id}/follow', { params }),
  );
};

const useToggleFollow = (userId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    scope: { id: `follow:${userId}` },
    mutationFn: (shouldFollow: boolean) => requestFollow(userId, shouldFollow),
    onMutate: async (shouldFollow) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.user(userId),
          exact: true,
        }),
        queryClient.cancelQueries({ queryKey: queryKeys.users(), exact: true }),
      ]);

      const previousView = findFollowView(queryClient, userId);
      updateFollowView(queryClient, userId, toggledView(shouldFollow));

      return { previousView };
    },
    onError: (_error, _shouldFollow, context) => {
      const previousView = context?.previousView;
      if (!previousView) return;

      updateFollowView(queryClient, userId, () => previousView);
    },
    onSuccess: ({ isFollowedByMe, followersCount }) => {
      updateFollowView(queryClient, userId, () => ({
        isFollowedByMe,
        followersCount,
      }));
      void queryClient.invalidateQueries({
        queryKey: queryKeys.feed(),
        exact: true,
      });

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.user(user.id),
          exact: true,
        });
      }
    },
  });
};

export { useToggleFollow };

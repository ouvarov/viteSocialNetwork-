import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useRef } from 'react';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';

import type {
  FeedPageTypes,
  PostPageTypes,
  PostTypes,
  ResPostTypes,
} from './types.ts';

const POSTS_PAGE_SIZE = 10;
const FEED_PAGE_SIZE = 20;
const LIKE_MUTATION_KEY = ['posts', 'like'] as const;

type PostListData = InfiniteData<PostPageTypes, string | undefined>;
type FeedData = InfiniteData<FeedPageTypes, string | undefined>;

const updatePostLists = (
  queryClient: QueryClient,
  updateItems: (items: PostTypes[]) => PostTypes[],
) =>
  queryClient.setQueriesData<PostListData>(
    { queryKey: queryKeys.postLists() },
    (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: updateItems(page.items),
            })),
          }
        : data,
  );

const replacePost = (
  queryClient: QueryClient,
  postId: string,
  update: (post: PostTypes) => PostTypes,
) =>
  updatePostLists(queryClient, (items) =>
    items.map((post) =>
      post.id === postId ? { ...post, ...update(post) } : post,
    ),
  );

const prependToFirstPage = <Page extends { items: unknown[] }>(
  data: InfiniteData<Page, string | undefined> | undefined,
  item: Page['items'][number],
) =>
  data
    ? {
        ...data,
        pages: data.pages.map((page, index) =>
          index === 0 ? { ...page, items: [item, ...page.items] } : page,
        ),
      }
    : data;

const flipLike = (post: PostTypes): PostTypes => ({
  ...post,
  likedByMe: !post.likedByMe,
  likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
});

const usePosts = (userId: string) =>
  useInfiniteQuery({
    queryKey: queryKeys.userPosts(userId),
    queryFn: ({ pageParam }) =>
      unwrap(
        client.GET('/api/users/{userId}/posts', {
          params: {
            path: { userId },
            query: { limit: POSTS_PAGE_SIZE, cursor: pageParam },
          },
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(userId),
  });

const useFeed = () =>
  useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) =>
      unwrap(
        client.GET('/api/feed', {
          params: { query: { limit: FEED_PAGE_SIZE, cursor: pageParam } },
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ResPostTypes) =>
      unwrap(client.POST('/api/posts', { body })),
    onSuccess: (post) => {
      queryClient.setQueryData<PostListData>(
        queryKeys.userPosts(post.ownerId),
        (data) => prependToFirstPage(data, post),
      );
      queryClient.setQueryData<FeedData>(queryKeys.feed(), (data) =>
        prependToFirstPage(data, { ...post, fromFollowing: true }),
      );
    },
  });
};

const useToggleLike = () => {
  const queryClient = useQueryClient();
  const overlappingLikes = useRef(new Set<string>());

  const pendingLikes = (postId: string) =>
    queryClient.isMutating({
      mutationKey: LIKE_MUTATION_KEY,
      predicate: (mutation) =>
        (mutation.state.variables as PostTypes | undefined)?.id === postId,
    });

  return useMutation({
    mutationKey: LIKE_MUTATION_KEY,
    mutationFn: ({ id, likedByMe }: PostTypes) => {
      const params = { path: { id } };

      return unwrap(
        likedByMe
          ? client.DELETE('/api/posts/{id}/like', { params })
          : client.PUT('/api/posts/{id}/like', { params }),
      );
    },
    onMutate: async ({ id }) => {
      if (pendingLikes(id) > 1) overlappingLikes.current.add(id);

      await queryClient.cancelQueries({ queryKey: queryKeys.postLists() });
      replacePost(queryClient, id, flipLike);
    },
    onError: (_error, { id }) => {
      replacePost(queryClient, id, flipLike);
    },
    onSettled: (serverPost, _error, { id }) => {
      if (pendingLikes(id) > 1) return;

      if (overlappingLikes.current.delete(id)) {
        return queryClient.invalidateQueries({
          queryKey: queryKeys.postLists(),
        });
      }

      if (serverPost) replacePost(queryClient, id, () => serverPost);
    },
  });
};

const useEditPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, text }: Pick<PostTypes, 'id' | 'text'>) =>
      unwrap(
        client.PATCH('/api/posts/{id}', {
          params: { path: { id } },
          body: { text },
        }),
      ),
    onSuccess: (post) => replacePost(queryClient, post.id, () => post),
  });
};

const useRemovePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(
        client.DELETE('/api/posts/{id}', { params: { path: { id } } }),
      );
    },
    onSuccess: (_result, postId) =>
      updatePostLists(queryClient, (items) =>
        items.filter((post) => post.id !== postId),
      ),
  });
};

export {
  useCreatePost,
  useEditPost,
  useFeed,
  usePosts,
  useRemovePost,
  useToggleLike,
};

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

import type { PostPageTypes, PostTypes, ResPostTypes } from './types.ts';

const POSTS_PAGE_SIZE = 10;
const LIKE_MUTATION_KEY = ['posts', 'like'] as const;

type PostsData = InfiniteData<PostPageTypes, string | undefined>;

const updatePosts = (
  queryClient: QueryClient,
  userId: string,
  updatePage: (items: PostTypes[], pageIndex: number) => PostTypes[],
) =>
  queryClient.setQueryData<PostsData>(queryKeys.posts(userId), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page, pageIndex) => ({
            ...page,
            items: updatePage(page.items, pageIndex),
          })),
        }
      : data,
  );

const replacePost = (
  queryClient: QueryClient,
  userId: string,
  postId: string,
  update: (post: PostTypes) => PostTypes,
) =>
  updatePosts(queryClient, userId, (items) =>
    items.map((post) => (post.id === postId ? update(post) : post)),
  );

const flipLike = (post: PostTypes): PostTypes => ({
  ...post,
  likedByMe: !post.likedByMe,
  likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
});

const usePosts = (userId: string) =>
  useInfiniteQuery({
    queryKey: queryKeys.posts(userId),
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

const useCreatePost = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ResPostTypes) =>
      unwrap(client.POST('/api/posts', { body })),
    onSuccess: (post) => {
      if (!queryClient.getQueryData(queryKeys.posts(userId))) {
        return queryClient.invalidateQueries({
          queryKey: queryKeys.posts(userId),
        });
      }

      updatePosts(queryClient, userId, (items, pageIndex) =>
        pageIndex === 0 ? [post, ...items] : items,
      );
    },
  });
};

const useToggleLike = (userId: string) => {
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

      await queryClient.cancelQueries({ queryKey: queryKeys.posts(userId) });
      replacePost(queryClient, userId, id, flipLike);
    },
    onError: (_error, { id }) => {
      replacePost(queryClient, userId, id, flipLike);
    },
    onSettled: (serverPost, _error, { id }) => {
      if (pendingLikes(id) > 1) return;

      if (overlappingLikes.current.delete(id)) {
        return queryClient.invalidateQueries({
          queryKey: queryKeys.posts(userId),
        });
      }

      if (serverPost) replacePost(queryClient, userId, id, () => serverPost);
    },
  });
};

const useRemovePost = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(
        client.DELETE('/api/posts/{id}', { params: { path: { id } } }),
      );
    },
    onSuccess: (_result, postId) =>
      updatePosts(queryClient, userId, (items) =>
        items.filter((post) => post.id !== postId),
      ),
  });
};

const useUploadImage = () =>
  useMutation({
    mutationFn: (image: File) =>
      unwrap(
        client.POST('/api/upload', {
          body: { image },
          bodySerializer: (body) => {
            const formData = new FormData();
            formData.append('image', body.image);
            return formData;
          },
        }),
      ),
  });

export {
  useCreatePost,
  usePosts,
  useRemovePost,
  useToggleLike,
  useUploadImage,
};

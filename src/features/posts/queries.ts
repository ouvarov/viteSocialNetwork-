import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';

import type { PostTypes, ResPostTypes } from './types.ts';

const POSTS_PAGE_SIZE = 50;

const usePosts = (userId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.posts(String(userId)),
    queryFn: () =>
      unwrap(
        client.GET('/api/users/{userId}/posts', {
          params: {
            path: { userId: String(userId) },
            query: { limit: POSTS_PAGE_SIZE },
          },
        }),
      ),
    enabled: Boolean(userId),
  });

const useInvalidatePosts = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.posts(String(userId)),
    });
};

const useCreatePost = (userId: string | undefined) => {
  const invalidatePosts = useInvalidatePosts(userId);

  return useMutation({
    mutationFn: (body: ResPostTypes) =>
      unwrap(client.POST('/api/posts', { body })),
    onSuccess: invalidatePosts,
  });
};

const useToggleLike = (userId: string | undefined) => {
  const invalidatePosts = useInvalidatePosts(userId);

  return useMutation({
    mutationFn: ({ id, likedByMe }: PostTypes) => {
      const params = { path: { id } };

      return unwrap(
        likedByMe
          ? client.DELETE('/api/posts/{id}/like', { params })
          : client.PUT('/api/posts/{id}/like', { params }),
      );
    },
    onSuccess: invalidatePosts,
  });
};

const useRemovePost = (userId: string | undefined) => {
  const invalidatePosts = useInvalidatePosts(userId);

  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(
        client.DELETE('/api/posts/{id}', { params: { path: { id } } }),
      );
    },
    onSuccess: invalidatePosts,
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

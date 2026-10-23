import type { AxiosResponse } from 'axios';

import { api } from '@/api';
import type { PostPageTypes, PostTypes, ResPostTypes } from '@/types/post.ts';
import type { UserDataTypes } from '@/types/user.ts';

const POSTS_PAGE_SIZE = 50;

const getUser = (id: string): Promise<AxiosResponse<UserDataTypes>> =>
  api.get(`users/${id}`);

const createPost = (data: ResPostTypes): Promise<AxiosResponse<PostTypes>> =>
  api.post('posts', data);

const getPosts = (userId: string): Promise<AxiosResponse<PostPageTypes>> =>
  api.get(`users/${userId}/posts`, { params: { limit: POSTS_PAGE_SIZE } });

const removePost = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`posts/${id}`);

const likePost = (id: string): Promise<AxiosResponse<PostTypes>> =>
  api.put(`posts/${id}/like`);

const unlikePost = (id: string): Promise<AxiosResponse<PostTypes>> =>
  api.delete(`posts/${id}/like`);

export { createPost, getPosts, getUser, likePost, removePost, unlikePost };

import { api } from '@/api';
import { AxiosResponse } from 'axios';
import { PostTypes } from '@/types/post.ts';

const createPost = (data: PostTypes): Promise<AxiosResponse<PostTypes>> => {
  return api.post<any>('post/create', data);
};

const getPost = (data: { id: string }): Promise<AxiosResponse<PostTypes>> => {
  return api.post<any>('post/getPosts', data);
};

export { getPost, createPost };

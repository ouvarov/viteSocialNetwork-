import { api } from '@/api';
import { AxiosResponse } from 'axios';
import { PostDataTypes, ResPostTypes } from '@/types/post.ts';

const createPost = (
  data: ResPostTypes,
): Promise<AxiosResponse<PostDataTypes>> => {
  return api.post('post/create', data);
};

const getPost = (id: string): Promise<AxiosResponse<PostDataTypes>> => {
  return api.get(`post/getPosts/${id}`);
};

const removePost = (id: string): Promise<AxiosResponse<PostDataTypes>> => {
  return api.delete(`post/${id}`);
};

const likePost = (id: string): Promise<AxiosResponse<PostDataTypes>> => {
  return api.put(`post/like`, { postId: id });
};

export { getPost, createPost, removePost, likePost };

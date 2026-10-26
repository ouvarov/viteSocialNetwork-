import type { AxiosResponse } from 'axios';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api';
import type {
  ChatDataTypes,
  ChatsDataTypes,
  CreatedChatTypes,
  RenameChatTypes,
} from '@/types/chat.ts';

const createChat = (
  userIds: string[],
): Promise<AxiosResponse<CreatedChatTypes>> =>
  api.post('chat/create', { userIds });

const getChat = (id: string): Promise<AxiosResponse<ChatDataTypes>> =>
  api.get(`chat/find/${id}`);

const deleteChat = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`chat/${id}`);

const renameChat = (
  body: RenameChatTypes,
): Promise<AxiosResponse<ChatsDataTypes>> => api.put('chat/update', body);

const getAllChat = (): Promise<AxiosResponse<ChatsDataTypes[]>> =>
  api.get('chat');

const useCreateChat = () =>
  useMutation({
    mutationFn: async (usersIds: string[]) => {
      const response = await createChat(usersIds);
      return response.data;
    },
  });

export {
  createChat,
  useCreateChat,
  getChat,
  getAllChat,
  deleteChat,
  renameChat,
};

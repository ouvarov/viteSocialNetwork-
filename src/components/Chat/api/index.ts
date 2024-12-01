import { AxiosResponse } from 'axios';
import { api } from '@/api';
import { useMutation } from 'react-query';

const createChat = (userIds: string[]): Promise<AxiosResponse> => {
  return api.post('chat/create', { userIds });
};
const getChat = (id: string): Promise<AxiosResponse> => {
  return api.get(`chat/find/${id}`);
};

const deleteChat = (id: string): Promise<AxiosResponse> => {
  return api.delete(`chat/${id}`);
};

const renameChat = (body: {
  chatId: string;
  newChatName: string;
}): Promise<AxiosResponse> => {
  return api.put(`chat/update`, body);
};

const getAllChat = (): Promise<AxiosResponse> => {
  return api.get(`chat/`);
};

const useCreateChat = () => {
  return useMutation({
    mutationFn: async (usersIds: string[]) => {
      const response = await createChat(usersIds);
      return response?.data;
    },
  });
};

export {
  createChat,
  useCreateChat,
  getChat,
  getAllChat,
  deleteChat,
  renameChat,
};

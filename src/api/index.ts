import axios from 'axios';
import type { AxiosResponse } from 'axios';
import io from 'socket.io-client';

const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN;

const readAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

const socket = io(`${import.meta.env.VITE_SOCKET_URL}/chat`, {
  transports: ['websocket'],
  autoConnect: false,
  auth: (setAuth) => setAuth({ token: readAccessToken() }),
});

const api = axios.create({
  withCredentials: true,
  baseURL: `${import.meta.env.VITE_API_URL}`,
});

api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${readAccessToken()}`;
  return config;
});

const upload = (image: FormData): Promise<AxiosResponse<{ url: string }>> => {
  return api.post('/upload', image);
};

export { ACCESS_TOKEN_KEY, api, socket, upload };

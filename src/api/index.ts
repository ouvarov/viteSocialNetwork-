import axios from 'axios';
import io from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
  transports: ['websocket'],
});

const api = axios.create({
  withCredentials: true,
  baseURL: `${import.meta.env.VITE_API_URL}`,
});

api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
  return config;
});

export { api, socket };

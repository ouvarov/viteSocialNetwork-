import { isAxiosError } from 'axios';

const TOO_MANY_REQUESTS = 429;

type ApiErrorBody = { message?: string | string[] };

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError<ApiErrorBody>(error) || !error.response) return fallback;

  if (error.response.status === TOO_MANY_REQUESTS) {
    return 'Too many attempts. Try again in a minute.';
  }

  const { message } = error.response.data ?? {};

  if (Array.isArray(message)) return message.join('. ');

  return message ?? fallback;
};

export { getApiErrorMessage };

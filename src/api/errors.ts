const TOO_MANY_REQUESTS = 429;

type ApiErrorBody = { message?: string | string[] };

type FetchResult<Data> = {
  data?: Data;
  error?: unknown;
  response: Response;
};

const readMessage = (body: unknown): string | undefined => {
  const { message } = (body ?? {}) as ApiErrorBody;

  return Array.isArray(message) ? message.join('. ') : message;
};

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(readMessage(body) ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

const unwrap = async <Data>(
  request: Promise<FetchResult<Data>>,
): Promise<Data> => {
  const { data, error, response } = await request;

  if (!response.ok) throw new ApiError(response.status, error);

  return data as Data;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof ApiError)) return fallback;

  if (error.status === TOO_MANY_REQUESTS) {
    return 'Too many attempts. Try again in a minute.';
  }

  return readMessage(error.body) ?? fallback;
};

export { ApiError, getApiErrorMessage, unwrap };

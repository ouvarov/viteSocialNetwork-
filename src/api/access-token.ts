const ACCESS_TOKEN_KEY = 'pulse_access_token';

const readAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

const saveAccessToken = (token: string): void =>
  localStorage.setItem(ACCESS_TOKEN_KEY, token);

const clearAccessToken = (): void => localStorage.removeItem(ACCESS_TOKEN_KEY);

export { clearAccessToken, readAccessToken, saveAccessToken };

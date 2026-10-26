let accessToken: string | null = null;

const readAccessToken = (): string | null => accessToken;

const saveAccessToken = (token: string): void => {
  accessToken = token;
};

const clearAccessToken = (): void => {
  accessToken = null;
};

export { clearAccessToken, readAccessToken, saveAccessToken };

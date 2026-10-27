import type { LoginTypes } from './types.ts';

const readDemoAccount = (): LoginTypes | undefined => {
  const email = import.meta.env.VITE_DEMO_EMAIL;
  const password = import.meta.env.VITE_DEMO_PASSWORD;

  return email && password ? { email, password } : undefined;
};

export { readDemoAccount };

import { API, PASSWORD } from './support.ts';

const RATE_LIMIT_PROBES = 6;

const globalSetup = async () => {
  const health = await fetch(`${API}/health/ready`).catch(() => undefined);

  if (!health?.ok) {
    throw new Error(
      `The API is not reachable at ${API}. Start it with RATE_LIMIT_DISABLED=true (see README).`,
    );
  }

  for (let attempt = 0; attempt < RATE_LIMIT_PROBES; attempt += 1) {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'rate-limit-probe@example.com',
        password: PASSWORD,
      }),
    });

    if (response.status === 429) {
      throw new Error(
        'The API rate limits sign-in. Restart it with RATE_LIMIT_DISABLED=true.',
      );
    }
  }
};

export default globalSetup;

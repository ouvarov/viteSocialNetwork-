import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const BUILD_DIR = 'dist';
const OUTPUT_DIR = '.vercel/output';

const readEnv = (name) => {
  const value = process.env[name];

  if (!value) throw new Error(`${name} is required to build for Vercel`);

  return value;
};

const apiOrigin = new URL(readEnv('VITE_SOCKET_URL')).origin;
const originSecret = readEnv('ORIGIN_SECRET');

const config = {
  version: 3,
  routes: [
    {
      src: '^/api/(.*)$',
      dest: `${apiOrigin}/api/$1`,
      headers: { 'x-vercel-enable-rewrite-caching': '0' },
      transforms: [
        {
          type: 'request.headers',
          op: 'set',
          target: { key: 'x-origin-secret' },
          args: originSecret,
        },
      ],
    },
    { handle: 'filesystem' },
    { src: '^/(.*)$', dest: '/index.html' },
  ],
};

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });
await cp(BUILD_DIR, `${OUTPUT_DIR}/static`, { recursive: true });
await writeFile(
  `${OUTPUT_DIR}/config.json`,
  `${JSON.stringify(config, null, 2)}\n`,
);

process.stdout.write(`Wrote ${OUTPUT_DIR}, /api/* -> ${apiOrigin}\n`);

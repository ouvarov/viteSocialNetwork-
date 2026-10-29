import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const BUILD_DIR = 'dist';
const OUTPUT_DIR = '.vercel/output';
const ONE_YEAR_SECONDS = 31_536_000;
const INLINE_SCRIPT = /<script>([\s\S]*?)<\/script>/g;

const readEnv = (name) => {
  const value = process.env[name];

  if (!value) throw new Error(`${name} is required to build for Vercel`);

  return value;
};

const apiOrigin = new URL(readEnv('VITE_SOCKET_URL')).origin;
const socketOrigin = apiOrigin.replace(/^http/, 'ws');
const originSecret = readEnv('ORIGIN_SECRET');

const hashInlineScripts = (html) =>
  [...html.matchAll(INLINE_SCRIPT)].map(([, script]) => {
    const hash = createHash('sha256').update(script).digest('base64');

    return `'sha256-${hash}'`;
  });

const buildContentSecurityPolicy = (scriptHashes) =>
  [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.join(' ')}`,
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${apiOrigin} ${socketOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

const html = await readFile(`${BUILD_DIR}/index.html`, 'utf8');

const securityHeaders = {
  'content-security-policy': buildContentSecurityPolicy(
    hashInlineScripts(html),
  ),
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

const config = {
  version: 3,
  routes: [
    {
      src: '^/assets/(.*)$',
      headers: {
        'cache-control': `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
      },
      continue: true,
    },
    { src: '^/(?!api/).*$', headers: securityHeaders, continue: true },
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
    { src: '^/(?!assets/).*$', dest: '/index.html' },
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

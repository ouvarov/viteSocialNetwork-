# Pulse — web

[![CI](https://github.com/ouvarov/viteSocialNetwork-/actions/workflows/ci.yml/badge.svg)](https://github.com/ouvarov/viteSocialNetwork-/actions/workflows/ci.yml)

React + Vite client for **Pulse**, a small social network: profiles, posts with images, likes and real-time chat.

The API lives in a separate repo: [ouvarov/nestSocialNetwork](https://github.com/ouvarov/nestSocialNetwork) (NestJS, PostgreSQL, Redis, Socket.IO).

> Work in progress. Next: a live demo.

## Stack

- React 19, TypeScript 6 (strict), Vite 8
- TanStack Query v5, React Router 8, socket.io-client
- `openapi-fetch` client typed by the backend OpenAPI spec
- SCSS modules
- ESLint (type-checked, React, hooks, a11y), Stylelint, Prettier, pre-commit hooks

## Getting started

Requires Node.js 22.22+ and a running [API](https://github.com/ouvarov/nestSocialNetwork).

```bash
npm ci
cp .env.example .env
npm run dev
```

The app runs on http://localhost:3001 and expects the API on http://localhost:5000 (see `.env.example`). Like on Vercel, the browser sends REST calls to its own origin: Vite proxies `/api/*` to the API in `dev` and `preview`. Socket.IO connects to the API directly.

## API contract

The backend publishes `openapi.json`. Types in `src/api/generated` are generated from it and committed.

```bash
npm run api:pull     # download the spec from the API main branch and regenerate types
npm run api:check    # fail if the committed types are out of date
OPENAPI_SOURCE=../nestSocialNetwork/openapi.json npm run api:pull   # use a local API checkout
```

Feature types (`src/features/*/types.ts`) are aliases of the generated schemas, so a renamed API field fails `tsc` instead of breaking the UI. Socket.IO events, which OpenAPI does not describe, are typed in `src/api/socket-events.ts`.

## Unit and component tests

Vitest with jsdom, Testing Library and MSW. Tests sit next to the code (`*.test.ts(x)`); MSW answers the HTTP calls, so the real `openapi-fetch` client, TanStack Query cache and forms run unchanged. Shared setup is in `src/test/`.

```bash
npm test
npm run test:watch
```

They cover the session logic in the API client (one shared refresh, retry with the original body, ending the session), error messages and retry rules, chat message merging, the sign-in and sign-up forms, and the feed: paging, optimistic likes with rollback, deleting and its error states.

## End-to-end tests

Playwright tests in `e2e/` run the production build (`vite preview` on port 3001) against a real API. Each test creates its own users through the API, so the API has to run with rate limiting switched off:

```bash
# in the API repo
RATE_LIMIT_DISABLED=true npm run start

# here
npx playwright install chromium   # once
npm run test:e2e
```

`E2E_API_ORIGIN` is where the test helpers send REST calls (default `http://localhost:5000`), and `E2E_SOCKET_ORIGIN` is where their Socket.IO clients connect (same default). The global setup stops early with a hint if the API is down or still rate limited.

To run the suite the way production works, set `ORIGIN_SECRET` on the API and point the helpers at the proxy. The preview proxy then adds the secret header, the way Vercel does:

```bash
# API repo
RATE_LIMIT_DISABLED=true ORIGIN_SECRET=<secret> npm run start
# here
ORIGIN_SECRET=<secret> E2E_API_ORIGIN=http://localhost:3001 npm run test:e2e
```

CI runs it this way.

| Spec          | Covers                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| `auth.spec`   | sign-up and sign-in validation, logout cache reset, shared token refresh            |
| `posts.spec`  | image upload, publishing, likes, post validation                                    |
| `feed.spec`   | infinite scroll, optimistic likes with rollback and race handling, next-page errors |
| `chat.spec`   | live messages, offline gaps, rejected token, delete confirmation, chat forms        |
| `shell.spec`  | titles, focus management, empty and error states, layout at 360px and 1280px        |
| `a11y.spec`   | themes, reduced motion, axe on every page in both themes                            |
| `routes.spec` | lazy chunks, 404, route error boundaries, failed and slow chunks                    |

## CI

`.github/workflows/ci.yml` runs on every pull request and push to `main`:

| Job     | What it checks                                                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quality | type-check, ESLint, Stylelint, Prettier; generated API types match the API `main` branch                                                             |
| Unit    | Vitest                                                                                                                                               |
| Build   | production build                                                                                                                                     |
| E2E     | checks out the API `main` branch, starts it on Postgres and Redis service containers and runs the Playwright suite; uploads the report when it fails |

## Deploy

The web app is deployed on Vercel; the API on Render ([how the pieces fit](https://github.com/ouvarov/nestSocialNetwork#deploy)).

- **`vercel.json`** proxies `/api/*` to the Render service and adds `x-origin-secret` from the `ORIGIN_SECRET` environment variable. Every other path falls back to `index.html` for client-side routes.
- **The browser makes REST calls to its own origin**, so the refresh cookie is first-party.
- **Socket.IO and the wake-up ping go to Render directly** (`VITE_SOCKET_URL`).
- **While the free Render instance starts**, the loader explains the wait (after 3 s). The session restore starts only after the API answers, so the proxy never waits on a sleeping instance.

Vercel project settings:

| Variable          | Value                            |
| ----------------- | -------------------------------- |
| `VITE_SOCKET_URL` | `https://<service>.onrender.com` |
| `ORIGIN_SECRET`   | the same value as on Render      |

The Render service is `pulse-api-044q.onrender.com`; if it ever moves, update the `dest` host in `vercel.json`.

## Structure

```text
src/
  api/          openapi-fetch client, errors, query keys, socket, generated types
  features/
    auth/       session provider, login and sign-up, auth requests
    users/      users list, profile query
    posts/      feed, likes, image upload
    chat/       chats, chat room over Socket.IO
    profile/    profile page composed from users, posts and chat
  components/   shared UI and layout
  routes/       router, guards, paths
```

Components don't call HTTP directly: every request lives in a feature's `queries.ts` as a TanStack Query hook (`usePosts`, `useToggleLike`, `useChat`…), built on the typed client.

## Scripts

| Script             | What it does                               |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Dev server                                 |
| `npm run build`    | Type-check and build                       |
| `npm run check`    | Type-check, ESLint, Stylelint and Prettier |
| `npm run lint:fix` | ESLint with autofix                        |
| `npm run api:pull` | Pull the OpenAPI spec and regenerate types |
| `npm test`         | Unit and component tests                   |
| `npm run test:e2e` | Playwright end-to-end tests                |

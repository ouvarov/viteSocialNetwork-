# Pulse — web

React + Vite client for **Pulse**, a small social network: profiles, posts with images, likes and real-time chat.

The API lives in a separate repo: [ouvarov/nestSocialNetwork](https://github.com/ouvarov/nestSocialNetwork) (NestJS, PostgreSQL, Redis, Socket.IO).

> Work in progress. Next: CI and a live demo.

## Stack

- React 19, TypeScript (strict), Vite
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

The app runs on http://localhost:3001 and expects the API on http://localhost:5000 (see `.env.example`).

## API contract

The backend publishes `openapi.json`. Types in `src/api/generated` are generated from it and committed.

```bash
npm run api:pull     # download the spec from the API main branch and regenerate types
npm run api:check    # fail if the committed types are out of date
OPENAPI_SOURCE=../nestSocialNetwork/openapi.json npm run api:pull   # use a local API checkout
```

Feature types (`src/features/*/types.ts`) are aliases of the generated schemas, so a renamed API field fails `tsc` instead of breaking the UI. Socket.IO events, which OpenAPI does not describe, are typed in `src/api/socket-events.ts`.

## End-to-end tests

Playwright tests in `e2e/` run the production build (`vite preview` on port 3001) against a real API. Each test creates its own users through the API, so the API has to run with rate limiting switched off:

```bash
# in the API repo
RATE_LIMIT_DISABLED=true npm run start

# here
npx playwright install chromium   # once
npm run test:e2e
```

`E2E_API_ORIGIN` points the tests at another API (default `http://localhost:5000`). The global setup stops early with a hint if the API is down or still rate limited.

| Spec          | Covers                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| `auth.spec`   | sign-up and sign-in validation, logout cache reset, shared token refresh            |
| `posts.spec`  | image upload, publishing, likes, post validation                                    |
| `feed.spec`   | infinite scroll, optimistic likes with rollback and race handling, next-page errors |
| `chat.spec`   | live messages, offline gaps, rejected token, delete confirmation, chat forms        |
| `shell.spec`  | titles, focus management, empty and error states, layout at 360px and 1280px        |
| `a11y.spec`   | themes, reduced motion, axe on every page in both themes                            |
| `routes.spec` | lazy chunks, 404, route error boundaries, failed and slow chunks                    |

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
| `npm run test:e2e` | Playwright end-to-end tests                |

# Pulse — web

React + Vite client for **Pulse**, a small social network: profiles, posts with images, likes and real-time chat.

The API lives in a separate repo: [ouvarov/nestSocialNetwork](https://github.com/ouvarov/nestSocialNetwork) (NestJS, PostgreSQL, Redis, Socket.IO).

> Work in progress. The plan: React 19, TanStack Query v5, React Router 7, feature folders, a typed API layer and a live demo.

## Stack

- React 18, TypeScript (strict), Vite
- react-query, react-router, axios, socket.io-client
- SCSS modules
- API types generated from the backend OpenAPI spec with `openapi-typescript`
- ESLint (type-checked, React, hooks, a11y), Stylelint, Prettier, pre-commit hooks

## Getting started

Requires Node.js 24 and a running [API](https://github.com/ouvarov/nestSocialNetwork).

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

Hand-written types in `src/types` are aliases of the generated schemas, so a renamed API field fails `tsc` instead of breaking the UI. Socket.IO events, which OpenAPI does not describe, are typed in `src/api/socket-events.ts`.

## Scripts

| Script             | What it does                               |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Dev server                                 |
| `npm run build`    | Type-check and build                       |
| `npm run check`    | Type-check, ESLint, Stylelint and Prettier |
| `npm run lint:fix` | ESLint with autofix                        |
| `npm run api:pull` | Pull the OpenAPI spec and regenerate types |

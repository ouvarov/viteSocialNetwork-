# ADR-0002: A Vite SPA, not Next.js

- Status: accepted
- Date: 2026-10-20

## Context

The client started as a Vite + React app. Before rebuilding it properly, I had to decide whether to move it to Next.js, the default choice for a new React project in 2026 and what most of my commercial work has used.

## Decision

Keep a client-rendered React 19 SPA built with Vite.

1. **Everything sits behind a login.** A feed, profiles and chats only exist for signed-in users. Server rendering and SEO buy nothing here, and server components would stream a loading state.
2. **The backend is a separate NestJS service** that owns auth (JWT and a rotating refresh cookie) and Socket.IO. Next would need one of two shapes:
   - a backend-for-frontend that proxies cookies, duplicating the API's auth;
   - a client-only Next app, which keeps none of Next's benefits.

   The Socket.IO server can't live in Next route handlers either, so it would stay separate anyway.

3. **The repo shows the parts a framework would hide**: the data layer (TanStack Query with optimistic updates and socket-to-cache sync), session handling (single-flight refresh), real-time state, code splitting and error boundaries with React Router, and a token-based SCSS design system.
4. **A migration costs a lot and shows the user nothing new**: the same features again, plus a new auth topology.

## Consequences

- **The first paint is the SPA shell.** Each page is a lazy chunk, and a progress bar covers chunk loading on navigation.
- **Hosting is static files plus one proxy route** (`/api/*` → the API), which runs on the free Vercel tier.
- **Routing, data loading and errors are wired by hand:** a React Router data router with lazy routes and error boundaries, and query hooks per feature. They're tested with Vitest and Playwright.
- **If a public, crawlable page is ever needed**, such as a landing page or public profiles, a small separate Next.js site is the cheaper path. Moving the whole app is not.

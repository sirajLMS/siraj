# UI Test Rules (`test/ui/`)

All tests under `test/ui/` run with `TEST_SERVER_MODE=production`. Any test that starts the shared Next.js test harness uses **`next start`** against a pre-built production bundle — not `next dev`.

## Prerequisites

**Before E2E tests (or any UI test that hits the running app), build the test production bundle:**

```bash
bun run build:test
```

- Output directory: `.next-test-prod` (override with `TEST_SERVER_DIST_DIR`)
- Uses **only** `.env.test` — injected into the `next build` / `next start` process env (no parent shell env). Per [Next.js test env rules](https://nextjs.org/docs/app/guides/environment-variables#test-environment-variables), keys already set in `process.env` are not overridden by `.env.local` or other files on disk
- Tests do **not** run `next build` automatically; missing build fails fast with a clear error

**Rebuild `build:test` after changes to:** server code, auth/cookies, middleware, API routes, or anything that affects the running Next.js app.

## Test Layers

| Layer | Path | Server | Notes |
|-------|------|--------|-------|
| Component | `test/ui/components/` | None | Happy DOM + mocked Apollo. No browser, no network. |
| E2E | `test/ui/e2e/` | Production (`next start`) | Playwright via `bun:test`. Uses `setupBrowserLifecycle()` → `setupTestServerLifecycle()`. |
| Static checks | `test/ui/mobile-desktop-isolation.test.ts` | None | Import-boundary scans only. |

Component tests do not need `build:test`. E2E tests **do**.

## Commands

```bash
bun run build:test          # Build .next-test-prod (required before E2E)
bun run test:ui:components  # Happy DOM component tests
bun run test:ui:e2e         # Playwright E2E (production server)
bun run test:ui:static      # Mobile/desktop isolation checks
bun run test:ui             # All of the above
bun run test:ui:kill        # Kill test servers on ports 3001/3020–3199 only (never dev:3000 or start:4000)
```

All `test:ui*` scripts preload `test/ui/test-env.ts`, which sets `TEST_SERVER_MODE=production`.

## Shared Test Server Infrastructure

E2E reuses the GraphQL test harness in `frontend/common/graphql/test/`:

- `lifecycle.ts` — `setupTestServerLifecycle()` (port allocation, start/stop)
- `testServer.ts` — spawns `next start` when mode is production
- `testPort.ts` — `getTestServerMode()` defaults to production for any run under `test/ui/`

**GraphQL integration tests** (`frontend/common/graphql/test/`) still use the **dev** server by default. Do not change that unless explicitly requested — `test-helper` mutations are blocked in production `NODE_ENV`.

## E2E Conventions

- Import lifecycle from `@/test/ui/e2e/lifecycle` — call `setupBrowserLifecycle()` at module scope
- Login helpers: `test/ui/e2e/helpers.ts` (`loginAsDemoUser` via `Bun.fetch`, not Playwright `context.request`)
- No `happydom-preload` in E2E — conflicts with Playwright
- No `waitForTimeout` / `networkidle` — use auto-waiting Playwright assertions
- Auth cookies: `AUTH_COOKIE_SECURE=false` in `.env.test` so `http://localhost` works in production mode

## Component Test Conventions

- Preloads: `test/ui/test-env.ts`, `happydom-preload.ts`, `next-dynamic-mock.ts`
- Use `TestWrapper` for Apollo mocks — never hit a real server
- See `frontend/common/components/ui/AGENTS.md` for component test structure

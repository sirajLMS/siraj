# 12 — Cron, Config & Infrastructure Analysis (Siraj)

> Scope: cron job system, background tasks, environment configuration, logging, Redis, config files, and deployment — all analyzed for a certificate feature integration.
> Date: 2026-08-01

---

## Table of Contents

1. [Cron Schema (DB)](#1-cron-schema-db)
2. [Cron Service Layer](#2-cron-service-layer)
3. [Cron API Routes](#3-cron-api-routes)
4. [Cron GraphQL](#4-cron-graphql)
5. [Cron Enums](#5-cron-enums)
6. [Background Jobs / Queue System](#6-background-jobs--queue-system)
7. [Environment Configuration](#7-environment-configuration)
8. [Logging](#8-logging)
9. [Redis](#9-redis)
10. [Config Files](#10-config-files)
11. [Deployment](#11-deployment)
12. [Certificate Feature Integration Notes](#12-certificate-feature-integration-notes)

---

## 1. Cron Schema (DB)

**Finding: There are NO dedicated cron/scheduled-task DB tables.**

The Drizzle schema is organized by domain. The barrel at `/home/ahmed/Projects/siraj-cert/backend/db/schema/index.ts` re-exports these sub-schemas:

```
audit, auth, billing, books, classes, communications, custom-types, enums,
meeting, parents, permissions, shared, storage, students, teachers, users
```

There is **no `cron` domain** in the schema barrel. A grep for `cron|schedule|job` (case-insensitive) across all schema `index.ts` files returned **zero matches**.

**Implication:** Siraj does NOT persist cron job definitions, run history, or lock/mutex state in the database. Cron orchestration is entirely delegated to **Vercel Cron** (declarative `vercel.json`) invoking serverless HTTP routes. There is no DB-backed job-scheduler table (e.g. `cron_jobs`, `scheduled_tasks`, `job_runs`) that a new cron job could be inserted into.

The closest persistence adjacent to cron is:
- **`fx_sync_runs`** table (via `billing` schema) — records FX refresh sync runs (success/partial/failed, trigger `cron`/`manual`), written by `FxIngestionService.refreshRates`.
- **`audit`** schema (`/home/ahmed/Projects/siraj-cert/backend/db/schema/audit/audit.ts`) — matches "cron" via grep (auditable event logging).
- **`system_settings`** table (in `shared` schema) — stores runtime-overridable env config under the `env::<KEY>` prefix (see §7).

---

## 2. Cron Service Layer

**Finding: There is no dedicated `backend/services/cron/` directory.** Cron logic lives in domain services invoked directly by the route handlers.

### 2.1 `ClassReminderService`
**File:** `/home/ahmed/Projects/siraj-cert/backend/services/notification/class-reminder.service.ts`

```typescript
export namespace ClassReminderService {
  export async function dispatchDailyReminders(
    options: { withinHours?: number; locale?: string } = {}
  ): Promise<{ success: boolean; instancesProcessed: number; deliveriesDispatched: number }> {
    const withinHours = options.withinHours ?? 24;
    const locale = options.locale ?? "en"; // cron runs unauthenticated → no ctx.locale

    try {
      const upcoming = await SchedulingRepository.findUpcomingInstances({ withinHours });
      let deliveriesDispatched = 0;
      for (const instance of upcoming) {
        try {
          const delta = await dispatchForInstance(instance, locale);
          deliveriesDispatched += delta;
        } catch (err) {
          // Per-instance failure isolation — does NOT halt the loop
          logger.error("ClassReminderService: per-instance dispatch failed", { ... });
        }
      }
      return { success: true, instancesProcessed: upcoming.length, deliveriesDispatched };
    } catch (error) {
      return { success: false, instancesProcessed: 0, deliveriesDispatched: 0 };
    }
  }
}
```

Key patterns:
- **Failure isolation:** each instance dispatch wrapped in its own `try/catch`; one failure never halts the run.
- **Idempotency key (UTC-DATE bucket):** `class-reminder-${instance.id}-${YYYY-MM-DD}` embedded in payload metadata — reruns on the same UTC day produce the same key (intended for downstream dedupe).
- **Locale default:** `"en"` because cron runs unauthenticated (no per-actor `ctx.locale`).

### 2.2 `ClassInstanceExpiryService` (auto-missed)
**File:** `/home/ahmed/Projects/siraj-cert/backend/services/session/class-instance-expiry.service.ts`

```typescript
export namespace ClassInstanceExpiryService {
  export async function processExpiredInstances(options?: {
    now?: Date; batchSize?: number; locale?: string;
  }): Promise<number> { ... }
}
```

- Marks expired pending class instances as `MISSED` by the system (`markClassMissedBySystem`), batch size default 50.
- Reads grace minutes from `system_settings` (`session_missed_grace_minutes`).
- Dispatches `CLASS_MARKED_MISSED` notifications to the parent only (per-instance try/catch; notification failure never surfaces as 500 since the auto-mark already committed).
- **Trigger location:** NOT a Vercel cron route. It is invoked **lazily** from `daily-schedule.repository.ts` (line 24-25) via dynamic import on every daily-schedule read:
  ```typescript
  const { ClassInstanceExpiryService } = await import("@/backend/services/session/class-instance-expiry.service");
  await ClassInstanceExpiryService.processExpiredInstances({ locale: input.locale });
  ```
  → This is a **lazy/on-demand** cleanup pattern, tied to the `SIGNED_URL_CLEANUP_STRATEGY` philosophy (lazy/cron/both/disabled), **not** a scheduled cron job.

### 2.3 `FxIngestionService.refreshRates`
Invoked by the FX cron route with `trigger: FxSyncTrigger.Cron`, `force: false`, `triggeredByUserId: null`. Staff manual refresh goes through the GraphQL `refreshExchangeRates` mutation (trigger `Manual`).

---

## 3. Cron API Routes

**Finding: Two Vercel Cron endpoints exist.** Both are `GET`-only and authenticate via a shared `CRON_SECRET`.

### 3.1 Auth guard — `verifyCronSecretAuth`
**File:** `/home/ahmed/Projects/siraj-cert/backend/lib/cron-auth.ts`

Central cron authentication (requirements R1–R11):

```typescript
export function verifyCronSecretAuth(request: NextRequest): CronAuthResult {
  if (request.method !== "GET") {
    return { authorized: false, response: NextResponse.json({ error: "Method not allowed" }, { status: 405 }) };  // R3
  }
  // R1: production without CRON_SECRET → 500 (server misconfigured)
  // S7: non-test env without secret → 401
  // R4: header-only (no query-string secret)
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { authorized: false, response: ...401 };  // R2/R11
  const provided = authHeader.slice("Bearer ".length);
  // timingSafeSecretCompare — SHA-256 hash + timingSafeEqual (constant-time)
  if (!timingSafeSecretCompare(provided, expected)) return { authorized: false, response: ...401 };
  // R6: log x-vercel-cron-schedule header for audit (no auth reliance)
  return { authorized: true };
}
```

Security characteristics:
- **GET-only** (rejects non-GET with 405).
- **Header-only** secret (`Authorization: Bearer <CRON_SECRET>`), never query-string.
- **Constant-time** comparison via SHA-256 + `timingSafeEqual`.
- Production without `CRON_SECRET` → 500; non-test env without secret → 401; test env without secret → still requires header (fail-closed).
- Logs the `x-vercel-cron-schedule` header for audit (no auth reliance).

Tests: `/home/ahmed/Projects/siraj-cert/backend/lib/cron-auth.test.ts` covers R1–R11.

### 3.2 Route: `/api/cron/class-reminders`
**File:** `/home/ahmed/Projects/siraj-cert/app/api/cron/class-reminders/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const authResult = verifyCronSecretAuth(request);
  if (!authResult.authorized) return authResult.response;

  const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });
  logger.info("Class reminders cron completed", { ... });
  return NextResponse.json(result);
  // catch → logger.error + 500
}
```
- Schedule: `0 6 * * *` (06:00 UTC daily) — `withinHours: 24` covers instances starting between 06:00 today and 06:00 tomorrow UTC.
- Tests: `/home/ahmed/Projects/siraj-cert/scripts/run-test/tests/class-reminders.cron.test.ts`

### 3.3 Route: `/api/fx/refresh`
**File:** `/home/ahmed/Projects/siraj-cert/app/api/fx/refresh/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const authResult = verifyCronSecretAuth(request);
  if (!authResult.authorized) return authResult.response;

  const result = await FxIngestionService.refreshRates({
    triggeredByUserId: null,
    trigger: FxSyncTrigger.Cron,
    force: false,
  });
  return NextResponse.json({ success, pairsWritten, pairsFailed, syncRunId });
  // catch → 500
}
```
- Schedule: `0 6 * * *` (06:00 UTC daily).
- Tests: `/home/ahmed/Projects/siraj-cert/app/api/fx/refresh/route.test.ts`

### 3.4 Declared cron jobs (vercel.json)
**File:** `/home/ahmed/Projects/siraj-cert/vercel.json`
```json
{
  "fluid": true,
  "crons": [
    { "path": "/api/fx/refresh", "schedule": "0 6 * * *" },
    { "path": "/api/cron/class-reminders", "schedule": "0 6 * * *" }
  ]
}
```
Both run at 06:00 UTC daily. `"fluid": true` enables Vercel Fluid compute (stateless function execution, pairs with Neon pooled DB connections — see `backend/lib/env.ts` validation).

### 3.5 Pattern for adding a new cron endpoint
To add a certificate-related cron job (e.g. cert expiry reminders):
1. Add a new route under `app/api/cron/<name>/route.ts` exporting `GET(request)`.
2. Start with `verifyCronSecretAuth(request)` and return `authResult.response` on failure.
3. Call the domain service inside `try/catch`, log via `logger`, return `NextResponse.json(...)`.
4. Register the path+schedule in `vercel.json` `crons[]`.
5. (Optional) If the job is configurable, surface a `*_CRON_SCHEDULE` env var (see §7; the `SIGNED_URL_CLEANUP_CRON_SCHEDULE` pattern is the precedent — though no route currently consumes it).

---

## 4. Cron GraphQL

**Finding: There are NO cron-specific GraphQL queries/mutations.** No `backend/graphql/pothos/cron/` directory exists.

Cron jobs are HTTP-only (Vercel Cron). There is no GraphQL surface to list/trigger/inspect cron jobs. The only GraphQL adjacency to the cron-invoked services is in **FX**:

**File:** `/home/ahmed/Projects/siraj-cert/backend/graphql/pothos/billing/fx-ingestion.pothos.ts`
- **Mutation `refreshExchangeRates`** — staff-triggered manual FX refresh (`trigger: FxSyncTrigger.Manual`, with `BILLING_REFRESH_EXCHANGE_RATES` permission + rate-limit check + `notImpersonating`). This is the **manual** counterpart to the cron route (which uses `FxSyncTrigger.Cron`, `triggeredByUserId: null`).
- **Query `latestFxSyncRun`**, **`fxSyncHealth`**, **`fxProviderConfig`** — read-only inspection of sync runs/status, usable to verify what the cron job wrote.

There is **no** GraphQL mutation/returning for `class-reminders` (the cron route is the only entry point; manual dispatch goes through a Server Action / admin script directly against the service, per the route's own docstring).

---

## 5. Cron Enums

**Finding: No dedicated `backend/enum/cron/` directory exists.** The cron-adjacent enums live in the FX domain.

**File:** `/home/ahmed/Projects/siraj-cert/backend/enum/fx/fx-provider.enum.ts`
```typescript
export enum FxProvider { OpenExchangeRates = "openexchangerates", Fixer = "fixer" }
export enum FxSyncStatus { Running = "running", Success = "success", Partial = "partial", Failed = "failed" }
export enum FxSyncTrigger { Cron = "cron", Manual = "manual" }   // ← distinguishes cron vs manual
export enum FxProviderConfigSource { ENV = "env", DATABASE = "database" }
```

`FxSyncTrigger` is the key enum distinguishing cron-initiated (`"cron"`) vs staff-initiated (`"manual"`) FX runs and is persisted on the `fx_sync_runs` row. The class-reminders cron has no analogous trigger enum (it is cron-only; no manual GraphQL path).

---

## 6. Background Jobs / Queue System

**Finding: There is NO job-queue / worker framework (no BullMQ, pg-boss, Bee-Queue, Agenda, Temporal, or worker scripts).**

- A grep for `bullmq|pg-boss|bull|queue|bee-queue|agenda|temporal` returned only false-positive matches (mostly the `TODO.md`, `bun.lock`, test files, and a **lint-queue dev tool**).
- The "queue" hits are a **local dev lint-queue HTTP server** (`/home/ahmed/Projects/siraj-cert/scripts/lint-queue-config.ts`) — a tiny localhost fastify-style server (port 4777) to parallelize ESLint across files. It is **not** a production job queue and holds no shared state.
- No `worker*.ts` scripts exist anywhere in the repo.
- No background workers run alongside the Next.js app; all scheduled work is **Vercel Cron → serverless HTTP route**, and all on-demand cleanup is **lazy** (executed inline on read, e.g. `ClassInstanceExpiryService` triggered from `daily-schedule.repository.ts`).

**Pattern summary for async work:**
| Work type | Mechanism |
|---|---|
| Scheduled, daily | Vercel Cron (`vercel.json`) → GET route → `verifyCronSecretAuth` → service |
| Per-request, opportunistic cleanup | Lazy inline call during a read query (e.g. expired-instances marking on daily-schedule fetch) |
| User-triggered | GraphQL mutation → service (e.g. `refreshExchangeRates`) |
| Fire-and-forget within a request | (not found as a distinct pattern; services are awaited inline) |

**Implication for certificates:** There is no queue to enqueue cert-generation or cert-issuance jobs. Any "background" cert work must either: (a) be synchronous within the request, (b) be a Vercel Cron route, or (c) be lazy during a read. Introducing BullMQ/pg-boss would be a new architectural addition not currently present.

---

## 7. Environment Configuration

### 7.1 Core env module
**File:** `/home/ahmed/Projects/siraj-cert/backend/lib/env.ts`

Exports `validateEnvironment()` → `EnvironmentConfig`, with a process-global singleton via `ensureEnvironmentValidated()` (symbol key `siraj.env`), and `resetEnvironmentCache()`.

Key cron-relevant config in `EnvironmentConfig`:
- `cronSecret?: string` — required in production (`validateRequiredAppSecret("CRON_SECRET")` throws in prod if unset; non-prod returns `""`).
- `cacheProvider: "redis" | "postgres"` — selects cache backend (defaults `"redis"`).
- `redisProvider: "local" | "upstash"`, `redisUrl`, `upstashRedisUrl/Token`.
- `signedUrlCleanupStrategy?: string`, `cleanupEnabled?: boolean`.
- `dbConnectionMode?: "auto" | "pg" | "neon"`, `dbProvider?: "postgres" | "neon"`.

Validation helpers:
- `getStringEnv`, `getBooleanEnv`, `getEnumEnv` (with allowed-values guard), `requireEnv`, `getEnv`.
- `validateNodeEnv()` — restricts to `development|production|test|staging`.
- `validateJwtSecret()` — ≥32 chars in production, random fallback in dev.
- `validateDatabaseUrl()` — must be `postgresql://` or `postgres://`; on Vercel enforces `sslmode=verify-full` (or `sslmode=require`+`uselibpqcompat=true`) and warns if Neon isn't pooled (`-pooler.` host).
- `validateNoPlaceholderSecrets()` — rejects env values still containing `<`/`>` (unreplaced `.env.example` placeholders); throws in production.

### 7.2 Type declarations
**File:** `/home/ahmed/Projects/siraj-cert/environment.d.ts` — augments `NodeJS.ProcessEnv`. Cron/adjacent keys:
- `SIGNED_URL_CLEANUP_STRATEGY?: "lazy" | "cron" | "both" | "disabled"`
- `SIGNED_URL_CLEANUP_CRON_SCHEDULE?: string` (default in `.env.example`: `0 * * * *`)
- `CRON_SECRET?: string`
- `VERCEL_ENV?: "production" | "preview" | "development"` + `VERCEL?` and other serverless-platform detection flags (`NETLIFY`, `AWS_LAMBDA_FUNCTION_NAME`, `K_SERVICE`, `FUNCTION_TARGET`, `FUNCTIONS_WORKER_RUNTIME`, `CF_PAGES`, `RAILWAY_ENVIRONMENT`).

### 7.3 DB-overridable env registry (Settings → Environment Config)
**File:** `/home/ahmed/Projects/siraj-cert/backend/lib/env-config-keys.ts`

Defines `ENV_CONFIG_KEYS[]` — every env var surfaced in the Settings UI for runtime DB override (written to `system_settings` under `env::<KEY>`). Resolution is **DB-first / env-fallback** via `env-config-resolver.ts`.

Cron-relevant registry entries:
| key | category | secret | excludeFromDb | displayStrategy |
|---|---|---|---|---|
| `CRON_SECRET` | app | ✅ | false | `db_with_mask_only` |
| `SIGNED_URL_CLEANUP_STRATEGY` | app | ❌ | false | `plain` |
| `SIGNED_URL_CLEANUP_CRON_SCHEDULE` | app | ❌ | false | `plain` |
| `ENABLE_LOGGING` | app | ❌ | false | `plain` |

Boot-critical secrets (`DATABASE_URL`, `JWT_SECRET`, `DATABASE_ENCRYPTION_KEY`, `GRAPHQL_ENCRYPTION_KEY`, `ADMIN_EMAIL/PASSWORD`, `ALLOWED_ORIGIN`, `IS_DEMO`, `GOOGLE_FONTS_API_KEY`) are `excludeFromDb: true` (env-only).

**Note:** `CRON_SECRET` is DB-overridable here, but `env.ts` reads it from `process.env` at boot via `validateRequiredAppSecret`. The cron-auth guard uses `getEnvironmentConfig()` (the boot singleton), so a Settings DB override of `CRON_SECRET` would NOT take effect for cron auth until `resetEnvironmentCache()` is called — important if cert cron auth rotates the secret.

### 7.4 .env.example cron entries
```
SIGNED_URL_CLEANUP_CRON_SCHEDULE=0 * * * *
CRON_SECRET=<your-cron-secret-here>
```

---

## 8. Logging

### 8.1 Server logger
**File:** `/home/ahmed/Projects/siraj-cert/backend/lib/logger.ts`
```typescript
class ServerLogger extends BaseLogger { constructor() { super("server"); } }
export const logger = new ServerLogger();
```

### 8.2 Base logger
**File:** `/home/ahmed/Projects/siraj-cert/shared/lib/logger/base-logger.ts`

```typescript
export abstract class BaseLogger {
  protected enabled: boolean;        // NODE_ENV !== "production" || ENABLE_LOGGING === "true"
  protected logsDir: string;          // join(process.cwd(), "logs")
  protected logKey: string;            // "server"
  protected writeToFileEnabled: boolean;

  protected async writeToFile(level, message): Promise<void> {
    const timestamp = formatTimestamp();
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    const logFilePath = join(this.logsDir, `${this.logKey}.log`);  // → logs/server.log
    await writeFile(logFilePath, logLine, { flag: "a" });           // append
  }
  // console + file for: log, info, warn, error, debug
}
```

**Log format:** `[<timestamp>] [<LEVEL>] <message>` — single-line, appended to `logs/server.log`. Levels: `log`, `info`, `warn`, `error`, `debug`. Console output mirrors the same prefix via `util.format`.

**Gating:** disabled in production unless `ENABLE_LOGGING=true`. Writes silently fail (swallowed catch) to avoid infinite loops. The server log file is `logs/server.log`.

---

## 9. Redis

### 9.1 Architecture (Adapter Pattern)
**File:** `/home/ahmed/Projects/siraj-cert/backend/services/redis/` (+ `README.md`)

```
IRedisService (interface — alias of ICacheServiceBase)
  ├── LocalRedisAdapter   (ioredis — dev / self-hosted)
  └── UpstashRedisAdapter (@upstash/redis — serverless prod)
        ▲
  RedisServiceFactory (singleton via global symbol `siraj.redisState`)
```

**Files:**
- `IRedisService.ts` — type alias for `ICacheServiceBase` + `RedisProvider = "local" | "upstash"`.
- `BaseRedisAdapter.ts` — shared `get/set/incr/expire/ttl/del/pipeline/ping/stats` + `getNativeClient()`.
- `LocalRedisAdapter.ts`, `UpstashRedisAdapter.ts` — concrete adapters.
- `RedisServiceFactory.ts` — singleton `getRedisService()` (Promise-returning, in-flight init dedupe), `resetRedisService()`, `checkRedisHealth()`.
- `SessionRedisService.ts` — session store (see below).
- `index.ts` — public exports.

### 9.2 Provider selection
Driven by `REDIS_PROVIDER` env var (validated in `env.ts`), with **DB-first override** via `resolveEnvConfig("REDIS_PROVIDER")`:
- `local` → `createLocalRedis()` — URL resolved DB-first (`REDIS_URL`), falls back to `redis://localhost:6379`.
- `upstash` → `createUpstashRedis()` — `UPSTASH_REDIS_REST_URL`/`_TOKEN` resolved DB-first in one batched call.
- `resetRedisService()` disconnects, clears the singleton, and invalidates the env-config cache for all 4 Redis keys (so the next `getRedisService()` re-resolves against the DB).

### 9.3 API surface (`redisService` singleton)
All methods are **async** (each internally awaits `getRedisService()`): `get`, `set(key, value, {ex|px})`, `del`, `expire`, `ttl`, `incr`, `pipeline([{command,args}])`, `ping`, `disconnect`, `stats`.

### 9.4 Usage in Siraj
- **Sessions:** `SessionRedisService` — keys `session:<id>` (JSON `RedisSessionData`, TTL) + `user_sessions:<userId>` (Redis SET for concurrent-session tracking). Supports touch, delete, `getUserSessions` (SMEMBERS), `countUserSessions` (SCARD), `enforceConcurrentLimit` (evicts oldest), `deleteUserSessions`. Uses native client for set ops (`SADD`/`SREM`/`SMEMBERS`/`SCARD`).
- **Caching:** `CACHE_PROVIDER=redis|postgres` (env); when `redis`, the `EntityCacheService` + `redisService` back entity caching. Cache stats exposed via `stats()` (`dbsize` + entity hit counters).
- **Rate limiting:** documented pattern (counter + TTL) in README; `DISABLE_RATE_LIMITING` env bypasses.

**Redis is NOT used for:** job queues, cron locks/mutexes, or pub/sub between cron runs. Cron jobs have no Redis-backed dedupe lock (idempotency is by metadata key only — see §2.1).

### 9.5 Local Redis container
**File:** `/home/ahmed/Projects/siraj-cert/.container/redis/docker-compose.yml`
```yaml
services:
  redis:
    image: redis:latest
    container_name: siraj_redis
    ports: ["6379:6379"]
    volumes: [redis_data:/data, ./redis.conf:/usr/local/etc/redis/redis.conf]
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck: [CMD, redis-cli, ping] # 10s interval, 3 retries
```
(Also a Postgres container under `.container/postgres/`.)

---

## 10. Config Files

### 10.1 `next.config.ts`
**File:** `/home/ahmed/Projects/siraj-cert/next.config.ts`
- `distDir` from `NEXT_DIST_DIR` (default `.next`).
- `generateBuildId` resolves a build ID from `NEXT_PUBLIC_BUILD_ID` → `.next-locale-snapshots-version` file → random UUID.
- `serverExternalPackages`: `["pg", "@neondatabase/serverless", "drizzle-orm", "ws", "@vercel/functions"]` — kept external (not bundled) for serverless compat.
- `experimental.optimizePackageImports`: MUI x-data-grid/x-date-pickers/icons-material/material + date-fns.
- `allowedDevOrigins`: localhost + LAN IPs + `DEV_ORIGIN` (dev only).
- **Security headers** on `/(.*)`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 0`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- `images.unoptimized` in dev; `remotePatterns` for localhost/127.0.0.1/backend, images.unsplash.com, flagcdn.com, `*.blob.vercel-storage.com`, vercel.live.
- No cron-specific settings here (cron is declared in `vercel.json`).

### 10.2 `drizzle.config.ts`
**File:** `/home/ahmed/Projects/siraj-cert/drizzle.config.ts`
```typescript
export default defineConfig({
  out: "./backend/drizzle",
  dialect: "postgresql",
  schema: "./backend/db/schema/index.ts",
  schemaFilter: ["public"],          // don't touch neon_auth, etc.
  dbCredentials: { url: process.env.DATABASE_URL },
});
```
Migrations output to `backend/drizzle/`. Only the `public` schema is managed.

### 10.3 `tsconfig.json`
**File:** `/home/ahmed/Projects/siraj-cert/tsconfig.json`
- `target/lib/module: esnext`, `moduleResolution: bundler`, `jsx: react-jsx`, `isolatedModules: true`, `incremental: true`, strict + `noUnusedLocals/Parameters/noFallthroughCasesInSwitch`.
- `paths: { "@/*": ["./*"] }` — `@/backend/...` resolves from repo root.
- `types: ["bun"]`.
- Excludes `.ai`, `.agents`, `.next*`, `node_modules`, `dist/out/build`, `frontend/common/graphql/generated`, `**/unRefactored_tests`.
- Includes `next-env.d.ts`, generated `.next*/types`.

### 10.4 `vercel.json` (recap)
`{ "fluid": true, "crons": [ ... two 06:00 UTC daily jobs ... ] }`.

---

## 11. Deployment

### 11.1 GitHub Actions deploy workflow
**File:** `/home/ahmed/Projects/siraj-cert/.github/workflows/deploy.yml`

Injects cron-related env into the Vercel deployment across environments:
- `CRON_SECRET: ${{ secrets.CRON_SECRET }}` (secret) — 3 occurrences (build env, runtime .env, preview/production).
- `SIGNED_URL_CLEANUP_CRON_SCHEDULE: ${{ vars.SIGNED_URL_CLEANUP_CRON_SCHEDULE }}` (variable) — 3 environments.
- `SIGNED_URL_CLEANUP_STRATEGY: ${{ vars.SIGNED_URL_CLEANUP_STRATEGY }}` — 3 environments.
- Also passes `DATABASE_URL`, `REDIS_*`, `JWT_SECRET`, `GRAPHQL_ENCRYPTION_KEY`, `DATABASE_ENCRYPTION_KEY`, etc.

### 11.2 Docker / Compose
- **Project-level app Dockerfile:** NOT present (the app is serverless on Vercel; no Dockerfile at repo root).
- **Dev container:** `/home/ahmed/Projects/siraj-cert/.devcontainer/Dockerfile` + `docker-compose.yml`.
- **Infra containers:** `.container/redis/docker-compose.yml` and `.container/postgres/docker-compose.yml` (local dev Postgres + Redis).
- **Sonar scanner:** `scripts/health/sonar/docker-compose.yml`.
- **Chatwoot (third-party):** `chatwoot/` has its own Dockerfiles + compose files (production/test/dev) — a separate service, not the Siraj app.

### 11.3 Serverless-platform detection
`env.ts` and `environment.d.ts` detect `VERCEL`, `NETLIFY`, `AWS_LAMBDA_FUNCTION_NAME`, `K_SERVICE` (Cloud Run), `FUNCTION_TARGET`, `FUNCTIONS_WORKER_RUNTIME`, `CF_PAGES`, `RAILWAY_ENVIRONMENT`. `VERCEL` is checked explicitly in `env.ts` to enforce Neon SSL + pooled connection requirements.

### 11.4 PM2 / process managers
None found — the app does not run as a long-lived process; it's serverless (Next.js on Vercel). No `ecosystem.config.js`, no `systemd` units, no supervisor configs.

---

## 12. Certificate Feature Integration Notes

Synthesis for integrating a certificate feature into this cron/config/infra landscape:

### 12.1 Adding a cert cron job
1. **Route:** create `app/api/cron/<cert-job>/route.ts` exporting `GET(request)`; begin with `verifyCronSecretAuth(request)` and return `authResult.response` on failure (mirror `class-reminders/route.ts`).
2. **Schedule:** add a new entry to `vercel.json` `crons[]` (e.g. `0 6 * * *` daily or a cert-specific cadence).
3. **Secret:** reuse `CRON_SECRET` (already DB-overridable in Settings; already declared in `environment.d.ts` + `env-config-keys.ts` + deploy.yml). No new auth infra needed.
4. **Service:** put logic in a `ClassReminderService`-style namespace service under `backend/services/<domain>/` with per-item failure isolation and a UTC-DATE idempotency key in payload metadata (the established pattern).
5. **Schema:** if cert issuance needs audit/run history, add a Drizzle table under a new or existing `backend/db/schema/<domain>/` barrel (there is no `cron` table pattern to follow — `fx_sync_runs` is the closest precedent: a domain table recording triggered runs with a `trigger` column of `cron|manual`).
6. **GraphQL (optional):** add a staff manual-trigger mutation mirroring `refreshExchangeRates` (`FxSyncTrigger.Manual`) so admins can retry cert issuance, with a `*_CRON`/`manual` discriminator persisted on the run row.

### 12.2 Concurrency / idempotency
- There is **no queue** and **no Redis mutex** for cron. If cert cron must be single-flight across overlapping Vercel invocations, you must **introduce** a lock (Redis `SET NX EX` via `redisService.set(key, "1", {ex})` + `del` on completion) — this pattern is documented in the Redis README as a rate-limitting/idempotency primitive but is **not currently used by any cron route**.
- Idempotency today = UTC-DATE key in notification payload metadata (soft dedupe, no DB UNIQUE constraint). For cert issuance, prefer a DB UNIQUE constraint on `(certId, utcDate)` or a dedicated `cert_issuance_runs` table with a status enum (`running|success|partial|failed`) modeled on `FxSyncStatus`.

### 12.3 Config surface
- For any cert-specific toggles, surface env vars through: (a) `environment.d.ts` type decl, (b) `ENV_CONFIG_KEYS[]` registry with `category`/`isSecret`/`displayStrategy`, (c) `.env.example`, (d) deploy.yml step. The `SIGNED_URL_CLEANUP_*` pair is the precedent for a strategy+schedule config knob.

### 12.4 Logging
- Reuse `logger` (`@/backend/lib/logger`) → `logs/server.log` with `[ts] [LEVEL] msg`. Disabled in prod unless `ENABLE_LOGGING=true`; for cert cron triage, set `ENABLE_LOGGING=true` on the deployment.

### 12.5 Cache / sessions
- If cert viewing needs caching or short-lived tokens, use `redisService` (DB-overridable provider) or `CACHE_PROVIDER=postgres` fallback. Sessions are already Redis-backed via `SessionRedisService`.

### 12.6 Deployment
- CI/CD is GitHub Actions → Vercel. Add cert env vars to the deploy.yml env steps (mirror `CRON_SECRET`/`SIGNED_URL_*`). No Docker changes needed unless you introduce a long-running worker (currently none exist).

---

### Quick-reference file index

| Topic | File |
|---|---|
| Cron routes | `app/api/cron/class-reminders/route.ts`, `app/api/fx/refresh/route.ts` |
| Cron auth | `backend/lib/cron-auth.ts` (+ `.test.ts`) |
| Cron schedule decl | `vercel.json` |
| Class-reminder service | `backend/services/notification/class-reminder.service.ts` |
| Class-expiry service (lazy) | `backend/services/session/class-instance-expiry.service.ts` |
| FX enums (FxSyncTrigger) | `backend/enum/fx/fx-provider.enum.ts` |
| FX GraphQL (manual refresh) | `backend/graphql/pothos/billing/fx-ingestion.pothos.ts` |
| Env config | `backend/lib/env.ts`, `environment.d.ts`, `backend/lib/env-config-keys.ts` |
| Logger | `backend/lib/logger.ts`, `shared/lib/logger/base-logger.ts` |
| Redis | `backend/services/redis/*` (+ README), `.container/redis/docker-compose.yml` |
| Config files | `next.config.ts`, `drizzle.config.ts`, `tsconfig.json` |
| Deploy | `.github/workflows/deploy.yml`, `.devcontainer/*`, `.container/*` |
| Schema barrel (no cron domain) | `backend/db/schema/index.ts` |
| Cron-secret tests | `backend/lib/cron-auth.test.ts`, `scripts/run-test/tests/class-reminders.cron.test.ts`, `app/api/fx/refresh/route.test.ts` |

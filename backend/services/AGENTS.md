# Backend Service Layer Rules

- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern (e.g., `PermissionsService`, `ScheduleService`). 
- **NO Monolithic Services**: Do not create generic, monolithic services (like a single `DashboardService` handling everything). 
- **Business Logic Hub**: This layer should contain all business rules, orchestration, and complex permission gating before calling the repository layer.
- **SSR Usage**: Services can be used directly by Next.js Server Components (SSR) or Server Actions, so they must not rely on GraphQL-specific contexts unless passed explicitly.
- **i18n / Localized Error Messages**: All user-facing error messages, alerts, and feedback generated in services must use the compile-time TypeScript translation system via `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (optionally accepts a `locale?: string` parameter). Hardcoded strings for exceptions or responses are forbidden. The legacy `getBackendTranslations` helper from `@/backend/lib/intl` is deprecated and must not be used.
- **Type Definition Pattern**: Services should import and use types from `backend/types/` (e.g., `{Entity}ReturnType`, `{Entity}SubmitInput`) rather than creating ad-hoc type definitions or directly referencing schema types. These types should be imported from `@/backend/types` and used for function parameters, return types, and data transformations.
- **Batch Service Methods for DataLoader**: Services that are called from GraphQL field resolvers MUST expose batch versions of single-entity lookup methods to support Pothos DataLoader batching. Batch methods accept `userIds: string[]` (or `ids: string[]`) and return `Map<string, T | null>`. Naming convention: `resolve{Entity}IdsForUsers` or `get{Entity}Contexts`. See `docs/graphql/dataloader-batching.md` for the complete pattern reference.

## Seed services (`backend/services/seed/`)

- **Not production domain services.** Modules here provision demo/seed data for `bun db seed` and GraphQL test helpers (`ensureDemoUsers`). They must never be imported from GraphQL resolvers, API routes, or production request handlers.
- **Naming:** `*SeedService` namespaces with `seed*` write methods (e.g. `UserSeedService.seedAvatarUrl`, `StudentSeedService.seedStudentByKey`).
- **Production safety:** All writes call `assertSeedWriteAllowed()` from `backend/lib/bootstrap-gate.ts` (blocked on real Vercel production; allowed in local dev and CI test servers via `TEST_SERVER` / `TEST_CI`).

## Testing (`backend/services/**/*.test.ts`)

Service tests live next to the code they cover (`*.test.ts` or `test/` subdirectories). Run via `bun run test:services`.

### No real external APIs (mandatory)

Service tests **must never** make real network calls to third-party providers. Always mock outbound integrations before exercising the service under test:

- **Notifications:** `spyOn(CommunicationService, "dispatchMulti")`, `spyOn(..., "dispatch")`, and/or `spyOn` / `mock.module` on `dispatchWithPreferences` from `@/backend/services/notification/notification-dispatch.helpers`
- **Email / SMS / push:** mock channel facades (`emailChannel`, `smsChannel`, `pushChannel`) or the adapters — never let tests reach Resend, Twilio, or FCM
- **FX:** mock provider adapters or the ingestion service — never call Fixer / OpenExchangeRates live
- **Redis / cache providers:** mock `cacheService` or `ICacheService` — never hit Upstash / Redis Cloud in service tests
- **Permissions fan-out:** mock `PermissionsService.getUserIdsWithPermission` when the code dispatches notifications to reviewer lists

If a test needs to confirm a live provider is wired, add a **single smoke** under `test/integration/` and run `bun run test:integration` — not here.

### Provider integration tests belong in `test/integration/`

**Do NOT add `*.integration.test.ts` or live provider smokes under `backend/services/`** (including channel adapters, FX providers, or any subdirectory). Examples:

- Resend / Twilio / FCM live adapter smokes → `test/integration/communication/`
- Fixer / OpenExchangeRates live FX fetches → `test/integration/fx/`
- Upstash / Redis Cloud → `test/integration/redis/` (when added)

Run integration smokes with:

- `bun run test:integration` — all provider smokes (parallel runner)
- `bun run test:live-comm` — communication channels only
- `bun run test:live-fx` — FX providers only

Each integration file gets **one** smoke test (single API call) to confirm the adapter reaches the live provider — not full service or app behaviour.

## Meeting Provider Adapters (CRITICAL)

- **All meeting URL generation MUST go through `MeetingChannelFactory.getMeetingChannel(slug)`** (or the `meetingChannel` delegating object from `@/backend/services/meeting/channels/MeetingChannelFactory`). Never construct `ZoomMeetingAdapter`, `GoogleMeetAdapter`, or `MicrosoftTeamsAdapter` directly — the factory guarantees race-safe per-slug singletons, env resolution, and cache invalidation on credential changes.
- **Hybrid auth resolution order**: org-level credentials first (S2S / service-account + DWD / client-credentials), per-user OAuth refresh-token fallback second (`MeetingProviderTokenRepository.getByUserAndProvider`), `NoOrgCredentialsNoUserTokenError` if neither are available.
- **`providerKindToSlug(providerKind)`** is the canonical mapping from the `meeting_providers.provider_kind` column to the adapter slug. Unknown kinds throw `UnsupportedProviderKindError`.
- **Booking-time generation is non-blocking**: `maybeGenerateUrl` runs adapter calls outside the booking DB transaction; a class booking must never fail because a provider API is down.
- See `docs/services/meeting-providers.md` for the complete pattern reference (interface, factory, adapter examples, deployment prerequisites, rollout summary).

## WhatsApp Cloud API Integration

- **Canonical reference**: `docs/services/whatsapp-cloud-api.md` — covers the full integration (adapter, factory, webhook, dispatch, schema, opt-in, frontend).
- **Service modules**: `backend/services/whatsapp/` — `WhatsappChannelFactory.ts` (lazy singleton + `resetWhatsappChannel()`), `MetaCloudApiAdapter.ts`, `whatsapp-account.service.ts`, `whatsapp-template.service.ts`.
- **Channel dispatch**: WhatsApp has its **own dispatch branch** (`dispatchWhatsapp` in `notification-dispatch.helpers.ts`) — never routed through email/SMS-shaped `dispatchRecipientChannel`. Extracts `whatsappTemplate` from `payload.metadata`, fails fast if absent.
- **Template-only sends (B1)**: `WhatsappPayload` has no free-text `body` field — only `template` + `components[]`. Free-text deferred to v2.
- **Rate limiting**: Pair-rate-limit via Redis (`whatsapp:pair:<e164>`, TTL 60s, 6s min interval). Concurrency cap (P1) via `activeCalls` semaphore (max 10). Never marks FAILED on guard hit — only defers.
- **Credentials**: `encryptedAccessToken`/`encryptedTwoStepPin` use `encryptedText` Drizzle type (auto-encrypt/decrypt). `ReturnType` types `Omit` encrypted columns — never leak to API. `resolveCredentials()` decrypts per-send; never holds plaintext on singleton.
- **Q4 Budget accounting**: `sendAttempted: boolean` on `WhatsappSendResult` — `true` whenever a Graph API fetch was executed (including errors). `dispatchMulti` counts these for `whatsappBudgetConsumed`.
- **Webhook**: Route at `app/api/webhooks/whatsapp` — GET verification (timingSafeEqual, S5), POST with HMAC-SHA256 body validation (S2). Returns 200 immediately, defers via `after()` (C3, not `queueMicrotask`). Strips `messages[]` defensively (S3).
- **B3 Forward-only status**: `STATUS_RANK` enforces monotonic transitions. `tryB3Resurrection()` for edge-case FAILED→DELIVERED.
- **Opt-in (REQ-10)**: Per-user via existing `userNotificationPreferences` table across all `NotificationEventType` values with `NotificationChannel.WHATSAPP`. Gate applied in `dispatchWithPreferences`, not in builders (builders are pure/no I/O).

## Hot-resolver & Read Caching (`EntityCacheService`)

- **Cache Keys**: Always use identity+role-scoped key formats:
  - User profile / context: `ec:user:${userId}:${roleId}`
  - Teacher by User ID: `ec:teacher:byUserId:${userId}:${roleId}`
  - Parent by User ID: `ec:parent:byUserId:${userId}:${roleId}`
  - Staff Directory: `ec:teacher:dir:${roleId}:${stableStringify(queryArgs)}`
  - Parent Directory: `ec:parent:dir:${roleId}:${stableStringify(queryArgs)}`
  - Parent Dashboard: `ec:parent:dash:metrics:${parentId}`
  - Supervisor Dashboard: `ec:supervisor:dash:${actorUserId}`
- **Fail-Open Contract**: All cache reads and invalidation calls MUST wrap provider errors in `try/catch` and fall through gracefully to the underlying data source / database without crashing caller requests.
- **Permission Checking**: Keep permission gating (e.g. `assertDirectoryAccess`, `hasPermission`) OUTSIDE `cachedRead` — authorization checks must execute before cache lookups so unauthorized users never receive cached payloads or execute cache queries.
- **Tag Invalidation**: Use named helpers (`invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`) in mutation write paths.

## Cron Service (`backend/services/cron/`)

- **Pluggable Queue Backends**: Queue adapters are loaded lazily via `await import(...)` in `queue-adapter.factory.ts`. The active backend is resolved from `CRON_QUEUE_BACKEND` env config (default `PG_BOSS`). See `docs/services/cron-service.md` for the complete pattern reference.
- **Hybrid Trigger Model**: Vercel ticker (`/api/cron/ticker`) dispatches due schedules + runs drain loop; manual trigger via GraphQL `cronRunTrigger` mutation or `/api/cron/execute` route.
- **Idempotent Dispatch**: `CronService.dispatchDueSchedules()` claims schedules atomically by advancing `nextRunAt` before enqueueing. Handlers MUST be idempotent.
- **Concurrency Policy**: `CronConcurrencyPolicy` enum (`ALLOW`, `REPLACE`, `SKIP`) controls behavior when a previous run is still in-flight.
- **Worker Runtime**: `cron-worker.runtime.ts` `runDrainLoop()` fetches batches, sets `RUNNING`, writes heartbeats, invokes `JobHandlerRegistry.getHandler()`, and handles success/retry/fail with max-retries exhaustion.
- **Handler Registry**: `job-handler-registry.ts` maps `CronJobKind` → handler function. The `NOOP` handler is auto-registered. Unregistered kinds fail the run with "No handler registered for jobKind=<X>".

## Quota System Integration

The Quota System (`QuotaService`, `QuotaNotificationService`, `AvailabilityService`) is an append-only ledger-based class credit tracking system. See `docs/billing/quota-system.md` for the complete architecture reference. Key service-level rules:

### QuotaService (`backend/services/billing/quota.service.ts`)

- **All methods are permission-gated**: `QUOTAS_VIEW` for reads, `QUOTAS_MANAGE` for writes via `requireManagePermission` / `requireViewPermission`
- **Single-writer principle**: QuotaService is the ONLY service authorized to call `QuotaRepository` write methods. Other services (CreditService, RecurringClassService, ClassSessionService) call QuotaService — never QuotaRepository directly.
- **FIFO auto-selection**: `selectQuotaForBooking(studentId, tx?)` uses `QuotaRepository.selectQuotaForBookingFIFO` internally
- **On-demand refresh**: `refreshStudentOndemandInstances(studentId, tx)` must be called by CreditService after ANY credit change

### AvailabilityService (`backend/services/scheduling/availability.service.ts`)

- Provides point-in-time slot availability checks using `class_instances` lookups + `TeacherAvailabilityRepository.validateBookingAvailability`
- Used by: RecurringClassService (create/update schedule), on-demand instance generator script

### QuotaNotificationService (`backend/services/billing/quota-notification.service.ts`)

- 7 notification methods: `sendQuotaExpiringSoon`, `sendQuotaExpired`, `sendQuotaLowBalance`, `sendOndemandInstancePendingCredit`, `sendOndemandInstanceReminderT3`, `sendOndemandInstanceReminderT1`, `sendOndemandTeacherDailyDigest`
- All dispatch via `dispatchWithPreferences`, not raw `CommunicationService.dispatch`
- Each event has a `NotificationEventCategory` tag (info/reminder/urgent/digest)

### Service Integration Rules

- **CancelSchedule**: `RecurringClassService.cancelSchedule` releases quota reservations via `QuotaService.releaseForRecurringSchedule`
- **Mode Switch**: `switchSchedulingMode` adjusts quota reservations based on mode transitions (SCHEDULED → ON_DEMAND releases; ON_DEMAND → SCHEDULED reverts)
- **Session Start**: `ClassSessionService` calls `QuotaService.redeemForInstance` for ON_DEMAND PENDING_CREDIT instances
- **Manual Entry**: `TeacherDashboardService.createManualEntry` delegates to `QuotaService.redeemForInstance` when quota-backed (prevents double deduction)

## Canonical Service Pattern (Duplication Elimination)

When utility functions in `backend/lib/` duplicate service-layer logic, the service file is canonical. Delete the `lib/` duplicate and update importers to use `@/backend/services/<module>` barrel. See `docs/frontend/duplication-elimination-patterns.md` Pattern 4.

Completed consolidations:
- `backend/lib/auth/permissions.ts` → `backend/services/auth/permissions.service.ts` (Task 2.18)
- `backend/lib/env-config-resolver.ts` → `backend/services/system/environment-config.service.ts` (Task 2.19)



## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)

Oxlint is the project's linter (`bun run oxlint`). It uses type-aware mode (`typeAware: true`, `typeCheck: true` in `oxlint.config.mts`). NEVER add `oxlint-disable` comments — fix the root cause instead.

### no-unsafe-type-assertion (STRICT — stricter than ESLint)

Oxlint's `no-unsafe-type-assertion` rule flags ALL `as Type` assertions that narrow from a wider type to a narrower one. **`as unknown as Type` (double assertion) does NOT bypass this rule.**

**Use type guards instead of `as`:**
```ts
// WRONG — flagged by oxlint
const record = value as Record<string, unknown>;
const error = caught as Error;
const row = result as EntitySelectType;

// RIGHT — type guard (not flagged)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const record = isRecord(value) ? value : {};

// RIGHT — instanceof for errors
if (error instanceof Error) return error;
throw new Error(String(error));

// RIGHT — find() with widening cast for enum narrowing
const match = Object.values(SomeEnum).find(v => (v as string) === value);
// `(v as string)` is a widening cast (safe, not flagged)
```

**For Drizzle pgEnum columns** (inferred as `string` not the enum type):
- Add `.$type<EnumType>()` to the column definition in the schema to fix at source
- OR use type guards: `function isStatus(value: string): value is Status { return (Object.values(Status) as readonly string[]).includes(value); }`

**For `response.json()` (returns `any`):**
- Type the variable: `const data: SomeType = await response.json();`
- OR use a type guard: `const data: unknown = await response.json(); if (!isSomeType(data)) throw ...;`

### no-await-in-loop

`await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.

**Use `Promise.all` for independent iterations:**
```ts
// WRONG
for (const item of items) { await process(item); }

// RIGHT — parallel
await Promise.all(items.map(item => process(item)));
```

**Use recursive helper for sequential iterations (shared transactions, ordered timestamps):**
```ts
async function processNext(index: number): Promise<void> {
  if (index >= items.length) return;
  await process(items[index]);
  return processNext(index + 1);
}
await processNext(0);
```

**Use `reduce` chain as alternative:**
```ts
await items.reduce(async (prev, item) => {
  await prev;
  return processOne(item);
}, Promise.resolve());
```

**`for await...of` is NOT flagged** (async iterable iteration).

**DO NOT parallelize when:** iterations share a DB transaction connection, each depends on the previous result, or ordering matters (e.g., sequential timestamps for pagination tests).

### consistent-function-scoping

Functions defined inside another function that don't capture any variables from the enclosing scope should be at module scope.

```ts
// WRONG — doesn't capture anything from parent
function component() {
  const helper = (x: string) => x.toUpperCase(); // flagged
  return helper("test");
}

// RIGHT — moved to module scope
const helper = (x: string) => x.toUpperCase();
function component() {
  return helper("test");
}
```

### no-object-type-as-default-prop

React component default props must not be object/array literals (re-created every render, breaks referential equality).

```ts
// WRONG
function Component({ options = {} }: Props) { ... }
function Component({ items = [] }: Props) { ... }

// RIGHT — stable module-level reference
const DEFAULT_OPTIONS = {};
const DEFAULT_ITEMS: readonly ItemType[] = [];
function Component({ options = DEFAULT_OPTIONS, items = DEFAULT_ITEMS }: Props) { ... }
```

### no-underscore-dangle

Identifiers with leading underscores are flagged. Fix by renaming, or use bracket notation for external API fields:

```ts
// WRONG
const value = obj._ref;
function _helper() { ... }

// RIGHT — rename
const value = obj.ref;
function helper() { ... }

// RIGHT — bracket notation for external API fields (not flagged)
const refKey = "_ref";
const value = obj[refKey];
// OR: const { _ref } = obj; (destructuring not flagged)
```

### no-unsafe-enum-comparison

Comparing values of different enum types (or enum vs string) is flagged.

```ts
// WRONG — enum vs string
if (row.status === SomeEnum.VALUE) { ... }

// RIGHT — both sides as string
if (String(row.status) === String(SomeEnum.VALUE)) { ... }
// OR use string literals
if (row.status === "VALUE") { ... }
// OR use Set-based lookup
const VALID_STATUSES = new Set(Object.values(SomeEnum) as string[]);
if (VALID_STATUSES.has(row.status)) { ... }
```

### no-shadow

Variable names shadowing an outer scope variable are flagged. Fix with destructuring rename or `_` prefix for unused params:

```ts
// WRONG
const studentHref = "...";
function Card({ studentHref }: Props) { ... } // shadows

// RIGHT — destructuring rename
function Card({ studentHref: href }: Props) { ... }

// RIGHT — unused param prefix (config: argsIgnorePattern: "^_")
async function test(_tx: DBTransaction) { ... }
```

### consistent-return

Functions must consistently return values or not return values (no mixing `return value` and `return;`).

```ts
// WRONG — mixes void and value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return; // void return — flagged
}

// RIGHT — consistent value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return undefined; // or return null;
}
```

**Config override exists** for `useEffect` callbacks (false positives — the rule doesn't understand React cleanup patterns). Already configured in `oxlint.config.mts`.

### Config Overrides (legitimate — NOT `oxlint-disable`)

The `oxlint.config.mts` has `overrides` for:
- **Test files**: `@typescript-eslint/unbound-method: "off"` (false positive for mock function references)
- **`useEffect` files**: `@typescript-eslint/consistent-return: "off"` (false positive for cleanup callbacks)
- **Logger/scripts**: `no-console: "off"` (intentional console usage)

These are config-level overrides, NOT inline `oxlint-disable` comments.

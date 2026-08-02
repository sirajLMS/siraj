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



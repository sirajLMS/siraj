# Backend Service Layer Rules

- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern (e.g., `PermissionsService`, `ScheduleService`). 
- **NO Monolithic Services**: Do not create generic, monolithic services (like a single `DashboardService` handling everything). 
- **Business Logic Hub**: This layer should contain all business rules, orchestration, and complex permission gating before calling the repository layer.
- **Single-Orchestrator Write Pattern**: When one user action writes multiple related rows (invoice + payment + ledger + balance), ONE service method owns the entire transaction (advisory locks, in-tx re-validation, idempotency keys, post-commit notifications) — never split the write across services. See `docs/billing/credit-hours-system.md` for a reference implementation.
- **SSR Usage**: Services can be used directly by Next.js Server Components (SSR) or Server Actions, so they must not rely on GraphQL-specific contexts unless passed explicitly.
- **i18n / Localized Error Messages**: All user-facing error messages, alerts, and feedback generated in services must use the compile-time TypeScript translation system via `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (optionally accepts a `locale?: string` parameter). Hardcoded strings for exceptions or responses are forbidden. The legacy `getBackendTranslations` helper from `@/backend/lib/intl` is deprecated and must not be used.
- **Type Definition Pattern**: Services should import and use types from `backend/types/` (e.g., `{Entity}ReturnType`, `{Entity}SubmitInput`, `DBTransaction`) rather than creating ad-hoc type definitions or directly referencing schema types. These types should be imported from `@/backend/types` and used for function parameters, return types, and data transformations.
- **Service-layer `.types.ts` files are prohibited.** All types live in `backend/types/`. Provider-specific types (e.g., `FixerLatestResponse`, `ZoomTokenResponse`) are in `backend/types/<domain>/`. If a service file contains both types and runtime code, split: types → `backend/types/`, runtime → stays in the service layer with a non-`.types` filename (e.g., `.helpers.ts`, `.constants.ts`).
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
- **Zoom refresh-token re-auth**: Treat `invalid_grant` as the sole authoritative trigger for re-auth — do NOT build proactive renewal on a hardcoded 90-day clock. See `docs/services/zoom-token-types.md`.
- See `docs/services/meeting-providers.md` for the complete pattern reference (interface, factory, adapter examples, deployment prerequisites, rollout summary).

## Important References

- `docs/services/meeting-providers.md` - Meeting provider adapter/factory pattern reference
- `docs/services/zoom-token-types.md` - Zoom token kinds semantics and constraints
- `docs/services/whatsapp-cloud-api.md` - WhatsApp Cloud API integration reference
- `docs/billing/quota-system.md` - Quota System architecture reference
- `docs/services/cron-service.md` - Cron service pattern reference
- `docs/services/entity-cache-service.md` - Entity Cache Service pattern reference
- `docs/services/general-user-creation.md` - General user creation pattern
- `docs/backend/service-base-pattern.md` - Service base and shared helpers reference
- `docs/backend/meeting-adapter-base.md` - Meeting provider adapter base class pattern reference
- `docs/auth/manager-role-mapping.md` - Manager role mapping architecture & permission group slug convention
- `docs/backend/serverless-cold-start-optimization.md` - Serverless cold-start optimization patterns
- `docs/quality/linting-rules.md` - Oxlint & ESLint/sonarjs fix recipes

## Meeting Provider Adapter Base Class (Duplication Elimination)

Multiple meeting provider adapters (Zoom, Google Meet, Teams) share identical getter/setter/logic structure. Use `MeetingProviderAdapterBase` from `__shared__/meetingProviderAdapterBase.ts` as the abstract base class. See `docs/backend/meeting-adapter-base.md` for the complete pattern reference.

## General User Onboarding (`createUserOfType` Null-Extension Pattern)

When creating a user without a specialized profile extension (teacher, parent, student, manager), use `createUserOfType<void>` with `createExtension: async () => null` and `afterExtension: undefined`. The service rejects specialized group slugs (student, teacher, parent) via `isSpecializedGroup()` from `@/shared/constants/specialized-groups.constants` before calling the pipeline. The `groupSlug` parameter in `CreateUserOfTypeOptions` is typed as `string` (widened from `SystemPermissionGroupSlug`) to support custom non-system group slugs. See `docs/services/general-user-creation.md` for the complete pattern reference.

## Service Base & Shared Helpers (Duplication Elimination)

When multiple service files share identical helper functions (auth preludes, config upserts, insert payload builders, session creators), extract into `__shared__/` modules. See `docs/backend/service-base-pattern.md` for the complete pattern reference.

Completed extractions:
- `ParentServiceBase` — `backend/services/parents/__shared__/ParentServiceBase.ts`
- `resolveTeacherId` — `backend/services/scheduling/__shared__/resolveTeacherId.ts`
- `prepareMeetingConfigUpsert` — `backend/services/meetings/__shared__/prepareMeetingConfigUpsert.ts`
- `buildParentInsertPayload` — `backend/services/parents/__shared__/buildParentInsertPayload.ts`
- `buildTeacherInsertPayload` — `backend/services/teachers/__shared__/buildTeacherInsertPayload.ts`
- `createAuthSession` — `backend/services/auth/__shared__/createAuthSession.ts`

## System Permission Groups

- System permission groups (`supervisor_default`, `academy_admin`, etc.) can have their **permission bundle** (`permissionIds`) edited via `updateGroup` (superadmin-only via `requireManageAccess`). Name, slug, and description are immutable for system groups. System groups cannot be deleted (`deleteGroup` throws `cannotDeleteSystemPermissionGroup`).
- `resolveTeacherId` accepts `TEACHERS_MANAGE_SCHEDULE` as an admin-level permission (in addition to `STAFF_VIEW_DIRECTORY` and `SCHEDULE_VIEW_ALL`), allowing supervisors to view any teacher's schedule.
- **Manager Onboarding Role Mapping**: `ManagerOnboardingService.createManager` maps `ManagerAccountType.manager` to `SystemPermissionGroupSlug.ACADEMY_ADMIN` and `ManagerAccountType.supervisor` to `SystemPermissionGroupSlug.SUPERVISOR_DEFAULT`. The `admin` account type is removed from onboarding and enum definitions. See `docs/auth/manager-role-mapping.md`.

## Serverless Cold-Start Optimization

- **Permission Context Propagation**: Services accepting permission checks MUST accept `UserPermissionContext` parameter from GraphQL context instead of re-querying via `PermissionsService.hasPermission(userId, ...)`. The `UserPermissionContext` type in `@/backend/types/permissions/permission.types.ts` already contains `permissions`, `permissionGroups`, `isSuperAdmin`, and `role` — passing it as the first argument to `hasPermission` eliminates 3 DB queries per call. See `docs/backend/serverless-cold-start-optimization.md`.
- `buildAuthScopes()` in `@/backend/graphql/gqlSchemaBuilder.ts` is dependency-injectable for testability — the `getUserContext` parameter defaults to `PermissionsService.getUserContext` but can be overridden in tests.

## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.


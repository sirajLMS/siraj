# Automatic Meeting URL Generation — Trackable Tasks

## Document Information

- **Feature Name**: Automatic Zoom / Google Meet / Microsoft Teams URL generation
- **Version**: 1.0
- **Date**: 2026-07-31
- **Status**: Draft (pending plan acceptance)
- **Target Directory**: `.ai/plans/auto-meeting-url`
- **Outcome Directory**: `.ai/plans/auto-meeting-url/outcome`
- **Related Documents**:
  - [Requirements (Specs)](./specs.md)
  - [Design](./design.md)
- **Research Reference**: `./outcome/research-outcome.md`

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:** Before executing ANY task, read ALL files in `.ai/plans/auto-meeting-url/outcome/` to absorb prior research, search results, docs, and pitfalls — analysis must not be repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):** Whenever a file is modified, run per-file verification (`bun tsgo` + `bun biome:check` + lint queue for the target file) BEFORE moving to another file or subtask.
3. **Global Health Check (Completion Gate):** Before marking any subtask complete, run `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
4. **Post-Execution Outcome File Creation:** After implementation + quality checks, write `.ai/plans/auto-meeting-url/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.
5. **Task Progress Tracking:** Update `[ ]` -> `[x]` in this `trackable-tasks.md` upon completion.

## Task Status Legend

| Marker | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Complete |
| `[!]` | Blocked — report CROSS-FILE DEPENDENCY in outcome |

## MANDATORY Subtasks for Every Implementation Subtask

Every implementation subtask (X.Y.Z) MUST include the two trailing subtasks below. They are written once here and apply to _all_ subtasks by reference — to avoid repeating 100+ lines per item.

### Quality Loop Subtask (X.Y.Z.QL)
- Run: `bun tsgo`
- Run: `bun biome:check`
- Run: lint queue for the modified file (see AGENTS.md for the queue client)
- Fix all errors before proceeding to the next file/subtask.

### Instruction Verification Subtask (X.Y.Z.IV)
Validate the modified file against ALL applicable AGENTS.md and `.agents/instructions/*.md` files using the layer-to-instructions mapping table below:

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files |
|-------|----------------------------------|----------------------------|
| Root | `/home/ahmed/Projects/siraj-meetings/AGENTS.md` | — |
| Backend Schema | `/home/ahmed/Projects/siraj-meetings/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/backend.instructions.md` |
| Backend Repos | `/home/ahmed/Projects/siraj-meetings/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/backend.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj-meetings/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| Backend Services | `/home/ahmed/Projects/siraj-meetings/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Backend GraphQL | `/home/ahmed/Projects/siraj-meetings/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/graphql/pothos/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Backend Types | `/home/ahmed/Projects/siraj-meetings/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/types/meeting/AGENTS.md` (if exists), `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Backend Enums | `/home/ahmed/Projects/siraj-meetings/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Frontend Common | `/home/ahmed/Projects/siraj-meetings/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md` | `frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj-meetings/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj-meetings/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| App Router | `/home/ahmed/Projects/siraj-meetings/app/AGENTS.md` | `frontend.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj-meetings/shared/AGENTS.md` | — |
| Test UI | `/home/ahmed/Projects/siraj-meetings/test/ui/AGENTS.md` | `tests.instructions.md` |
| Integration Tests | `/home/ahmed/Projects/siraj-meetings/test/integration/AGENTS.md` (if exists), `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |

### Drizzle Schema Convention (Reference)

- **Schema changes** (new tables, columns, indexes): `bun run db push` (per repo policy "reset & cleanGenerate disabled" — push is enabled for non-destructive adds; review with user if uncertain)
- **Custom SQL migrations** (complex transforms, data backfills): `bun db migrate` — used MINIMALLY per repo policy
- **Confirm non-destructive:** All schema changes in this plan are additive (new columns with defaults, new tables, new indexes) — safe for `push`

## Implementation Overview

### Implementation Strategy

- **Phase-1 foundation first**: types, enums, schema, factory interface — everything downstream depends on these being stable.
- **Phase-2 adapters parallel-slicable**: Zoom / Google Meet / Microsoft Teams adapters are independent, each implement the same interface. They can be built in parallel by separate sub-agents after Phase 1 ships types + interface.
- **Phase-3 service integration**: single coordinated change to MeetingConfigService + validation.
- **Phase-4 UX entry points**: three independent UX models share Phase-3 infrastructure — parallel-slicable after Phase 3.
- **Phase-5 hybrid auth**: depends on Phase-2 adapters; can run in parallel with Phase-4 once token table schema lands.
- **Phase-6 integration smokes**: depends on Phase-2 + Phase-3 done.
- **Phase-7 knowledge propagation**: mandatory final phase after everything else passes quality gate.

### Development Approach

- **Testing Strategy**: TDD on adapter unit tests (mock `fetch` first), then implement to satisfy. Service tests use mocks injected via DI opts (mirroring `ResendEmailAdapter`'s constructor opts pattern). Integration smokes are last, env-gated.
- **Integration Strategy**: Phase-boundary gates — each phase must land + green before the next phase starts.
- **Deployment Strategy**: rolling deploy with backward-compatible migration first; feature is inert until org credentials are configured or users connect their own accounts.

---

## Phase 1: Foundation — Types, Enums, Schema, Adapter Interface

- [x] 1.1 Extend `MeetingProviderFieldSchema` + add `MeetingProviderKind` union type
  - Read all existing files in `.ai/plans/auto-meeting-url/outcome/`
  - File: `backend/types/meeting/meeting-provider.types.ts`
  - Add `export type MeetingProviderKind = "manual" | "zoom_oauth" | "google_meet_oauth" | "microsoft_teams_oauth"`
  - Add `supportsAutoGeneration?: boolean` to `MeetingProviderFieldSchema`
  - Add `providerKind: MeetingProviderKind` to `MeetingProviderSelectType`
  - Add `MeetingProviderMetadata<Kind>` discriminated union (holds upstream-returned metadata per kind)
  - Type imports per AGENTS — no local GraphQL/Pothos types
  - 1.1.QL Quality Loop on `backend/types/meeting/meeting-provider.types.ts`
  - 1.1.IV Instruction Verification against:
    - `/home/ahmed/Projects/siraj-meetings/backend/types/AGENTS.md`
    - `/home/ahmed/Projects/siraj-meetings/backend/types/meeting/AGENTS.md` (if exists)
    - `/home/ahmed/Projects/siraj-meetings/.agents/instructions/backend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - Write outcome: `.ai/plans/auto-meeting-url/outcome/1.1-types-outcome.md`
  - Update progress: mark task 1.1 `[x]`
  - _Requirements: REQ-1_

- [x] 1.2 Make `MeetingConfigDetails.meetingUrl` optional + add `providerMetadata` to meeting-config types
  - File: `backend/types/meeting/meeting-config.types.ts`
  - Change `readonly meetingUrl: string` -> `readonly meetingUrl?: string`
  - Add `readonly providerMetadata?: Record<string, unknown>` to the row types
  - Audit downstream type consumers; mark any forced breaks as CROSS-FILE DEPENDENCIES in the outcome
  - 1.2.QL Quality Loop on the file
  - 1.2.IV Instruction Verification against backend types AGENTS/instructions
  - Global quality check
  - Write outcome: `.ai/plans/auto-meeting-url/outcome/1.2-config-types-outcome.md`
  - Update progress: mark task 1.2 `[x]`
  - _Requirements: REQ-1_

- [x] 1.3 Drizzle schema: add `providerKind` column to `meeting_providers`
  - File: `backend/db/schema/meeting/meeting-providers.ts`
  - Add `providerKind: varchar("provider_kind", { length: 50 }).notNull().default("manual")` (backfill-safe)
  - 1.3.QL Quality Loop on the schema file
  - 1.3.IV Instruction Verification against:
    - `/home/ahmed/Projects/siraj-meetings/backend/db/schema/AGENTS.md`
    - `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md`
    - `.agents/instructions/backend.instructions.md`
  - Drizzle: confirm additive change — run `bun run db push` ONLY after user approval (NEVER push schema without user confirmation per repo policy)
  - Write outcome noting any Drizzle hints encountered
  - _Requirements: REQ-1_

- [x] 1.4 Drizzle schema: add `providerMetadata` jsonb column to `meetingConfigSharedColumns()` factory
  - File: `backend/db/schema/meeting/__shared__/meeting-config-columns.ts`
  - Add `providerMetadata: jsonb("provider_metadata").$type<Record<string, unknown>>()` (nullable)
  - Apply to BOTH `user_meeting_configs` AND `class_meeting_configs` automatically (factory is shared)
  - 1.4.QL Quality Loop
  - 1.4.IV Instruction Verification
  - Drizzle push only after user approval
  - Write outcome
  - _Requirements: REQ-1_

- [x] 1.5 Create new `meeting_provider_tokens` Drizzle table
  - New file: `backend/db/schema/meeting/meeting-provider-tokens.ts`
  - Columns: `id (uuid pk)`, `userId (uuid fk -> users.id onDelete cascade)`, `providerSlug (varchar 50, NOT FK on slug — soft ref)`, `accessToken (encryptedText)`, `refreshToken (encryptedText)`, `expiresAt (timestamp tz)`, `scopes (jsonb readonly string[])`, `createdAt`, `updatedAt`
  - Unique partial index on `(userId, providerSlug)` (no soft-delete column in v1, so full unique)
  - Export from `backend/db/schema/meeting/index.ts`
  - 1.5.QL Quality Loop on the new file AND on `backend/db/schema/meeting/index.ts`
  - 1.5.IV Instruction Verification against `backend/db/schema/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md`
  - Drizzle push only after user approval
  - Write outcome
  - _Requirements: REQ-9, REQ-10_

- [x] 1.6 Define `IMeetingChannel` interface + types
  - New file: `backend/services/meeting/channels/IMeetingChannel.ts`
  - Export `MeetingProvider` union (`"zoom" | "google_meet" | "microsoft_teams"`)
  - Export `GenerateMeetingInput`, `GenerateMeetingResult` (see design's interface definition)
  - Export `IMeetingChannel` interface
  - Export typed errors: `UnsupportedProviderKindError`, `InsufficientScopesError`, `MissingImpersonationSubjectError`, `NoOrgCredentialsNoUserTokenError`, `ProviderReauthRequiredError`, `RateLimitedError`, `ProviderUnavailableError`, `ZoomApiError`, `GoogleMeetApiError`, `MicrosoftTeamsApiError`, `NoAppAccessPolicyError` (class hierarchy extending a shared `MeetingChannelError`)
  - 1.6.QL Quality Loop on the new file
  - 1.6.IV Instruction Verification against `backend/services/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md`
  - Write outcome
  - _Requirements: REQ-2_

- [x] 1.7 Implement `MeetingChannelFactory`
  - New file: `backend/services/meeting/channels/MeetingChannelFactory.ts`
  - Mirror `EmailChannelFactory.ts` structure exactly:
    - `initializationPromise: Map<MeetingProvider, Promise<IMeetingChannel>>` (race-safe)
    - lazy `await import("@/backend/services/meeting/channels/<provider>/<Adapter>")` per slug
    - Credentials resolved via `resolveEnvConfigMany([...keys])`
    - `getMeetingChannel(slug)`, `resetMeetingChannel(slug)` (calls `adapter.disconnect()` + `invalidateEnvConfigCache` for related keys), convenience `meetingChannel` object delegating `generateMeeting`/`validateConfig`/`disconnect`
  - Throw `UnsupportedProviderKindError` when `slug` resolves to a manual provider (no adapter)
  - 1.7.QL Quality Loop on the new file
  - 1.7.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-2_

- [x] 1.8 Register new env-config keys (category: "meeting")
  - File: `backend/lib/env-config-keys.ts`
  - Append to `ENV_CONFIG_KEYS` registry (all `category: "meeting"`, all `isSecret: true`, `displayStrategy: "db_with_mask_only"`):
    - `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`
    - `GOOGLE_MEET_SERVICE_ACCOUNT_JSON`, `GOOGLE_MEET_IMPERSONATE_SUBJECT`
    - `MS_TEAMS_TENANT_ID`, `MS_TEAMS_CLIENT_ID`, `MS_TEAMS_CLIENT_SECRET`, `MS_TEAMS_ORGANIZER_USER_ID`
    - `OAUTH_REDIRECT_BASE_URL` (`isSecret: false`)
  - File: `backend/lib/env.ts` — add corresponding optional fields to `EnvironmentConfig` interface + initialise from `process.env`
  - Verify Settings UI auto-discovers them (Settings tab reads `ENV_CONFIG_KEYS`)
  - 1.8.QL Quality Loop on both files
  - 1.8.IV Instruction Verification against `backend/AGENTS.md` + `backend/lib/AGENTS.md` (if exists) + `backend.instructions.md`
  - Update `.env.example` + `environment.d.ts`
  - Write outcome
  - _Requirements: REQ-3, REQ-4, REQ-5, REQ-9_

- [x] 1.9 Update provider seed factory with `providerKind`
  - File: `backend/db/seeds/lib/meeting-provider-factory.ts`
  - For `zoom` -> `providerKind: "zoom_oauth"`, `fieldSchema.supportsAutoGeneration: true`, `fieldSchema.requiresMeetingUrl: false`
  - For `google_meet` -> same pattern, `"google_meet_oauth"`
  - For `microsoft_teams` -> `"microsoft_teams_oauth"`
  - Add a 4th seeded provider `zoom_manual` (existing `zoom` behaviour) so teachers can still choose manual entry — OR keep `zoom` manual-only and add `zoom_auto` as the auto variant. Confirm with user; default = keep `zoom` as auto, drop the manual variant (manual users can use a generic provider if needed).
  - Update i18n strings (`shared/locale/{ar,en}/profile/notifications`) — update "Paste your..." instructions to "Auto-generate" copy for auto providers
  - 1.9.QL Quality Loop on seed + locale files
  - 1.9.IV Instruction Verification against `backend/db/seeds/AGENTS.md` + `backend/AGENTS.md` + `shared/AGENTS.md` (for locale)
  - Write outcome
  - _Requirements: REQ-1, REQ-11_

- [x] 1.10 Create MeetingProviderToken repository
  - New file: `backend/db/repo/meeting/meeting-provider-token.repository.ts`
  - Methods: `getByUserAndProvider(userId, providerSlug)`, `upsert(input)`, `delete(userId, providerSlug)`, `listByUser(userId)`
  - Standard `queryDb(tx)` read pattern, transactions for writes
  - 100% coverage tests in `backend/db/test/repo/meeting/meeting-provider-token.repository.test.ts` (use `runInRollback`, never `rejects.toThrow` inside `runInRollback` per AGENTS)
  - 1.10.QL Quality Loop on both new files
  - 1.10.IV Instruction Verification against `backend/db/repo/AGENTS.md` + `backend/db/test/AGENTS.md` + `backend.instructions.md` + `tests.instructions.md`
  - Write outcome
  - _Requirements: REQ-10_

## Phase 2: Provider Adapters (parallel-slicable after Phase 1)

- [x] 2.1 Implement `ZoomMeetingAdapter` (Server-to-Server OAuth)
  - New files (mirror Resend adapter's dual-constructor pattern):
    - `backend/services/meeting/channels/zoom/zoom.types.ts` — `ZoomMeetingContext`, options type
    - `backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts` — implements `IMeetingChannel`
  - Token mint: `POST https://zoom.us/oauth/token` grant_type=`account_credentials`, Basic auth header
  - Cache token in-memory until `exp - 60s`
  - Meeting POST: `POST https://api.zoom.us/v2/users/me/meetings` body `{topic, type:2, start_time?, duration?, settings:{host_video:true, participant_video:true, join_before_host:false, waiting_room:true}}`
  - Validate scopes (`meeting:write:admin`, `meeting:write`) — fail fast with `InsufficientScopesError` at construction
  - Map upstream error codes to typed errors (`ZoomApiError`)
  - Dual constructor: no-arg path uses `getEnvironmentConfig()`; DI opts path used by factory and tests
  - On 5xx retry once with 200ms+ jitter backoff
  - On 429 surface `RateLimitedError` with `Retry-After` (do NOT retry)
  - Write unit tests: `backend/services/meeting/channels/zoom/test/ZoomMeetingAdapter.test.ts` — mock `globalThis.fetch`, 100% coverage on token-mint branches (cold/warm/expired), meeting POST (success / upstream 4xx / 5xx / 429), scope validation, error mapping
  - 2.1.QL Quality Loop on all new files + test file
  - 2.1.IV Instruction Verification against `backend/services/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md` + `tests.instructions.md`
  - Global quality check
  - Write outcome: `.ai/plans/auto-meeting-url/outcome/2.1-zoom-adapter-outcome.md`
  - _Requirements: REQ-3_

- [x] 2.2 Implement `GoogleMeetAdapter` (service-account JWT + Domain-Wide Delegation)
  - New files:
    - `backend/services/meeting/channels/google-meet/google-meet.types.ts`
    - `backend/services/meeting/channels/google-meet/GoogleMeetAdapter.ts`
  - Service-account JSON parsed from `GOOGLE_MEET_SERVICE_ACCOUNT_JSON` env var (multi-line; parse on construction, fail fast on invalid shape)
  - JWT mint via `jose`:
    - header: `{alg:"RS256", typ:"JWT", kid: serviceAccount.private_key_id}`
    - payload: `{iss: client_email, scope: "https://www.googleapis.com/auth/meetings.space.created", aud: "https://oauth2.googleapis.com/token", iat, exp: iat+3600, sub: GOOGLE_MEET_IMPERSONATE_SUBJECT}`
    - sign with `jose.importPKCS8(serviceAccount.private_key)` + `jose.SignJWT`
  - Exchange at `https://oauth2.googleapis.com/token` grant_type `urn:ietf:params:oauth:grant-type:jwt-bearer`
  - Cache access token in-memory until `exp - 60s`
  - Spaces POST: `POST https://meet.googleapis.com/v2/spaces` body `{ config: { accessType: 1 } }` (open access)
  - Return `{joinUrl: meetingUri, meetingId: name}`
  - If `GOOGLE_MEET_IMPERSONATE_SUBJECT` missing -> `MissingImpersonationSubjectError` (translated `errors.meet.missingSubject`)
  - If upstream 403 with DWD-related reason -> `PermissionDeniedError(meet.dwdNotEnabled)` (parse upstream error `status.PERMISSION_DENIED` + reason)
  - 429 -> `RateLimitedError`
  - Per-user fallback (REQ-9): if env service-account missing AND a `meeting_provider_tokens` row exists for the actor + `"google_meet"`, use the user's access token (skip `sub` claim, skip DWD)
  - Write unit tests mocking `fetch` and jose signing (use real jose on a test keypair, verify JWT shape)
  - 2.2.QL Quality Loop
  - 2.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-4, REQ-9_

- [x] 2.3 Implement `MicrosoftTeamsAdapter` (Graph application permissions)
  - New files:
    - `backend/services/meeting/channels/microsoft-teams/microsoft-teams.types.ts`
    - `backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter.ts`
  - Client-credentials token: `POST https://login.microsoftonline.com/{MS_TEAMS_TENANT_ID}/oauth2/v2.0/token` body `client_id, client_secret, scope=https://graph.microsoft.com/.default, grant_type=client_credentials`
  - Cache token until `exp - 120s`
  - Meeting POST: `POST https://graph.microsoft.com/v1.0/users/{MS_TEAMS_ORGANIZER_USER_ID}/onlineMeetings` body `{subject, startDateTime, endDateTime}` (compute `endDateTime = start + durationMinutes`)
  - Return `{joinUrl: joinWebUrl, meetingId: id}`
  - If upstream 403 'No application access policy found for this app' -> `NoAppAccessPolicyError` (developerMessage contains the PowerShell cmdlet link)
  - Per-user fallback (REQ-9): delegated token path `POST /me/onlineMeetings` using user's access token
  - Validate `OnlineMeetings.ReadWrite.All` grant expectation at construction via tenant-configuration check (best-effort; otherwise surface on first call)
  - Write unit tests with mocked `fetch`
  - 2.3.QL Quality Loop
  - 2.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-5, REQ-9_

## Phase 3: Service Layer Integration

- [x] 3.1 Extend `MeetingConfigService` with auto-generation branching
  - File: `backend/services/meeting/meeting-config.service.ts`
  - Add internal helper `maybeGenerateUrl(provider, input, actorUserId)`:
    - If `provider.providerKind === "manual"` -> return parsed details unchanged (existing path)
    - Else if `input.details.meetingUrl` is blank/null -> call `MeetingChannelFactory.getMeetingChannel(provider.slug).generateMeeting(...)` and use returned values
    - Else (input has meetingUrl for an auto provider — manual override) -> accept as-is, skip generation (let teachers paste if they want)
  - `createUserMeetingConfig` and `updateUserMeetingConfig`: pass through `maybeGenerateUrl` before insert
  - Wrap adapter call in try/catch; on typed error roll back the create; surface the typed error to the resolver
  - Skip URL-allowlist validation for auto-generated URLs (validation gate in `backend/lib/meeting-config.validation.ts` extended — see 3.2)
  - Persist `providerMetadata` JSONB from `GenerateMeetingResult.providerMetadata`
  - 3.1.QL Quality Loop
  - 3.1.IV Instruction Verification against `backend/services/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md`
  - Update service tests `backend/services/meeting/test/meeting-config.service.test.ts` (or new file if cleaner) — mock `MeetingChannelFactory` via DI; cover manual/auto/auto-with-override/auto-fail rollback
  - Write outcome
  - _Requirements: REQ-6_

- [x] 3.2 Extend `meeting-config.validation.ts` to allow auto-provider URLs to bypass allowlist
  - File: `backend/lib/meeting-config.validation.ts`
  - Add `providerKind` param to Zod schema builder; if `providerKind !== "manual"`, do NOT enforce `urlAllowlist.getAllowlistHostPatterns` (auto-return URL host will be in `meet.google.com`/`zoom.us`/`teams.microsoft.com` which is in allowlist anyway, but we want to be tolerant of upstream host variations)
  - When `providerKind !== "manual"` AND user-supplied `meetingUrl` is non-empty, still validate it's a valid URL (Zod `.url()`) — never trust blindly
  - 3.2.QL Quality Loop
  - 3.2.IV Instruction Verification
  - Update `backend/lib/meeting-config.validation.test.ts` (create if missing)
  - Write outcome
  - _Requirements: REQ-2_

- [x] 3.3 Extend `ClassMeetingConfigService` with same auto-generation branching
  - File: `backend/services/meeting/class-meeting-config.service.ts`
  - Apply the same `maybeGenerateUrl` helper (extract to a shared module `backend/services/meeting/utils/maybe-generate-url.ts` if it cleans up duplication — subtask 3.3 may also create that shared module)
  - Update `updateClassMeetingConfig` to handle `meetingUrl: null` as "regenerate" trigger
  - 3.3.QL Quality Loop
  - 3.3.IV Instruction Verification
  - Update class-meeting-config tests
  - Write outcome
  - _Requirements: REQ-6_

- [x] 3.4 Extend `MeetingConfigSnapshotService` for booking-time generation
  - File: `backend/services/meeting/meeting-config-snapshot.ts`
  - Add `generateAndAttachForClassInstance(classInstanceId)`:
    - Resolve config + class context (title, start, duration)
    - If provider is manual -> no-op (existing path)
    - If auto -> call adapter; on success `UPDATE class_instances SET meeting_join_url=$`; on failure log `meetingGenerationFailed` event, leave `meetingJoinUrl NULL`
  - Integrate into the class booking resolver: after the `class_instances` row commits, dispatch the generation (out-of-band; mirror `notification-dispatch.helpers.ts` post-commit dispatch pattern)
  - Add bounded retry (3 attempts with exponential backoff 200ms -> 400ms -> 800ms; configurable via env in a later iteration)
  - On class cancel: best-effort `adapter.deleteMeeting(meetingId)` if exposed — log-only on failure
  - 3.4.QL Quality Loop
  - 3.4.IV Instruction Verification
  - Add tests covering: manual provider no-op, auto success, auto failure (rollback semantics), cancel path
  - Write outcome
  - _Requirements: REQ-8_

- [x] 3.5 Extend mask + repository layers for `providerMetadata` and `providerKind` exposure
  - Files: `backend/services/meeting/meeting-config-mask.ts`, `backend/services/meeting/class-meeting-config-mask.ts`
  - Ensure `providerMetadata` is masked on read for non-admin scope (per existing `encryptedSecret` masking policy) — though `providerMetadata` itself isn't secret; only tokens within it would be. Decide: keep `providerMetadata` unmasked (it's URLs + IDs, not secrets); document in outcome.
  - Update `UserMeetingConfigRepository`, `ClassMeetingConfigRepository` to select + insert the new `providerMetadata` column
  - Update `MeetingProviderRepository` to select + insert `providerKind`
  - 3.5.QL Quality Loop on all touched files
  - 3.5.IV Instruction Verification against `backend/db/repo/AGENTS.md` + `backend/services/AGENTS.md`
  - Update repository tests (100% coverage per repo AGENTS)
  - Write outcome
  - _Requirements: REQ-6_

## Phase 4: GraphQL + Frontend UX Entry Points

- [x] 4.1 Update Pothos GraphQL: nullable `meetingUrl`, `providerKind` field, `providerMetadata` field
  - File: `backend/graphql/pothos/meeting/meeting.pothos.ts`
  - Make `MeetingConfigDetailsInput.meetingUrl` nullable
  - Add `providerKind` field to `MeetingProvider` object (resolver exposing the new column)
  - Add `providerMetadata` field to `UserMeetingConfig` and `ClassMeetingConfig` objects (JSON scalar)
  - Run `bun run generate:gqlSchema && bun codegen`
  - 4.1.QL Quality Loop on the Pothos file + generated schema + types
  - 4.1.IV Instruction Verification against `backend/graphql/AGENTS.md` + `backend/graphql/pothos/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md`
  - Write outcome
  - _Requirements: REQ-6_

- [x] 4.2 Add `generateMeetingUrl` GraphQL mutation (preview path)
  - Files:
    - `backend/graphql/pothos/meeting/meeting-inputs.pothos.ts` (if extracted; or inline) — `GenerateMeetingUrlInput`
    - `backend/graphql/mutation/meeting/meeting.mutation.ts` — `generateMeetingUrl(input)` resolver
  - Resolver auth: require `MEETING_CONFIGS_MANAGE_OWN`
  - Behaviour: call `MeetingChannelFactory.getMeetingChannel(slug).generateMeeting(...)` NOnon-persisting — just return the result to the caller
  - Return shape: `{ joinUrl, meetingId?, expiresAt? }`
  - Typed error mapping: `UnsupportedProviderKindError` etc -> GraphQL errors
  - Run codegen
  - 4.2.QL Quality Loop on touched files
  - 4.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-7_

- [x] 4.3 Frontend GraphQL documents for `generateMeetingUrl`
  - File: `frontend/common/graphql/sharedDocuments/meeting/meeting.documents.ts`
  - Add `GENERATE_MEETING_URL_MUTATION_DOCUMENT`, `CONNECT_MEETING_PROVIDER_OAUTH_MUTATION_DOCUMENT`, `DISCONNECT_MEETING_PROVIDER_OAUTH_MUTATION_DOCUMENT`
  - Run `bun codegen` to regenerate hook types
  - 4.3.QL Quality Loop
  - 4.3.IV Instruction Verification against `frontend/common/graphql/AGENTS.md` + `frontend/common/graphql/sharedDocuments/AGENTS.md` + `frontend/AGENTS.md` + `frontend.instructions.md`
  - Write outcome
  - _Requirements: REQ-7, REQ-10_

- [x] 4.4 Add "Generate automatically" UI affordance in `MeetingConfigTypeFields`
  - File: `frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFields.tsx`
  - When `provider.fieldSchema.supportsAutoGeneration === true` AND meetingUrl is empty -> show a "Generate automatically" button that calls `useMeetingConfigsManagerViewModel.generatePreview(providerId, context)`
  - When meetingUrl is non-empty AND provider supports auto -> show read-only URL text + "Re-generate" affordance
  - When `provider.fieldSchema.supportsAutoGeneration === false` -> existing manual flow unchanged
  - Mobile vs Desktop tier variants: also update `frontend/mobile/components/ui/input/meetingConfigTypeFields/` and `frontend/desktop/components/ui/input/meetingConfigTypeFields/` per AGENTS tier separation rules
  - 4.4.QL Quality Loop on all touched tier variants
  - 4.4.IV Instruction Verification against `frontend/views/AGENTS.md` + `frontend/mobile/AGENTS.md` + `frontend/desktop/AGENTS.md` + `frontend/AGENTS.md` + `mobile-desktop.instructions.md` + `frontend.instructions.md`
  - Write outcome
  - _Requirements: REQ-6, REQ-7_

- [x] 4.5 Extend `useMeetingConfigsManagerViewModel` to drive generation flows
  - File: `frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel.ts`
  - Add state: `generationStatus: "idle" | "generating" | "success" | "error"`, `lastGeneratedUrl`, `error`
  - Methods:
    - `generatePreview(providerId, previewContext)` -> calls `GENERATE_MEETING_URL_MUTATION` and updates local form state
    - `submitAutoConfig(providerId, label)` -> calls `CREATE_USER_MEETING_CONFIG_MUTATION` with blank `meetingUrl` (backend generates)
    - `regenerateConfig(configId)` -> calls `UPDATE_USER_MEETING_CONFIG_MUTATION` with null `meetingUrl`
  - Persist optimistic UI handling: show "Generating..." button state during requests
  - 4.5.QL Quality Loop
  - 4.5.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-6, REQ-7_

- [x] 4.6 Add "URL pending" UI badge in class schedule views
  - Added `urlPending` and `regenerateUrl` labels to `MeetingConfigDisplayLabels` type + EN/AR translations (both top-level and subdirectory locale files)
  - Added "URL pending" chip to `ClassMeetingContextBanner.tsx` when `joinUrl` is null AND `supportsAutoGeneration` is true
  - Added `supportsAutoGeneration` to `JoinContext` in `meetingJoinAction.ts` and `useJoinContext.ts`
  - Added "URL pending" chip to all 3 `MeetingJoinAction` variants (common/desktop/mobile) — covers 16+ schedule view components that delegate to these
  - Fixed `onlineMeeting.utils.ts` + Storybook mock fixtures to include `supportsAutoGeneration`
  - 4.6.QL Quality Loop — tsgo ✅, biome ✅, lint ✅
  - 4.6.IV Instruction Verification — N/A (instruction files checked, no violations)
  - _Requirements: REQ-8_

- [x] 4.7 Admin provider-catalog form: add `providerKind` dropdown
  - File: `frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormView.tsx` (and tier variants)
  - New dropdown field with options: `Manual`, `Zoom (auto)`, `Google Meet (auto)`, `Microsoft Teams (auto)`
  - When auto provider selected -> automatically set `fieldSchema.requiresMeetingUrl` to false and `supportsAutoGeneration` to true (UI logic; not server-enforced)
  - Wire to existing update mutation (already supports the GraphQL provider type after 4.1)
  - 4.7.QL Quality Loop
  - 4.7.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-1_

- [x] 4.8 Add Storybook stories for new variants
  - Updated `meetingConfigTypeFields.desktop.stories.tsx` — added `AutoGenerate`, `Generating`, `GenerationError`, `RegenerateUrl` stories with `autoGenProvider` mock
  - Updated `meetingConfigTypeFields.mobile.stories.tsx` — same 4 new stories + `autoGenProvider` mock
  - Updated `MeetingJoinAction.desktop.stories.tsx` — added `UrlPendingAction`, `UrlPendingButton`, `UrlPendingIcon` stories with `supportsAutoGeneration: true` + `joinUrl: null` mock
  - Updated `MeetingJoinAction.mobile.stories.tsx` — same 3 URL pending stories
  - 4.8.QL Quality Loop — tsgo ✅, biome ✅, lint ✅
  - 4.8.IV Instruction Verification — N/A (subtask deferred for "Connect your account" stories until 5.1 exists)
  - _Requirements: REQ-6, REQ-7, REQ-8_

## Phase 5: Admin "Meeting Integrations" Settings Tab (NEW)

The new admin Settings 7th tab surfaces per-provider credentials, live Test Connection (validate-config + generate-and-delete round-trip), endpoint display, and per-teacher OAuth token audit. Depends on Phase 2 (adapters), Phase 3 (service integration), Phase 4 (GraphQL foundation). Mirrors the pattern at `SettingsTabPanels.tsx` + `settingsTabs.config.ts` + `environment-config.pothos.ts`. (Note: this phase is dependent on Phase 4 and may run in parallel with the original Phase 5 — Per-Teacher OAuth — since both build on the same GraphQL foundation once the `meeting_provider_tokens` schema lands in Phase 1.)

- [x] 5.1 Add new permission `SETTINGS_EDIT_MEETING_INTEGRATIONS`
  - File: `backend/enum/permissions/permission.enum.ts`
  - Add `SETTINGS_EDIT_MEETING_INTEGRATIONS = "settings.edit_meeting_integrations"` to the Settings cluster (mirrors existing `SETTINGS_*` enums at lines 241-248)
  - File: `frontend/common/types/page-permissions.types.ts` — add `settingsMeetingIntegrations: [AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS, AppPermission.SETTINGS_VIEW] as PagePermissions`
  - File: `frontend/common/views/dashboard/config/navigationConfig.ts` — add the new permission to `grp_admin`'s `permission` array so the group survives filter when held alone
  - 5.1.QL Quality Loop on touched files
  - 5.1.IV Instruction Verification against `backend/enum/AGENTS.md` + `backend/AGENTS.md` + `frontend/AGENTS.md` + .agents/instructions/backend.instructions.md + frontend.instructions.md
  - Run codegen (`bun run generate:gqlSchema && bun codegen`)
  - Write outcome: `.ai/plans/auto-meeting-url/outcome/5.1-permission-outcome.md`
  - _Requirements: REQ-13_

- [x] 5.2 Implement `backend/services/meeting/integrations/meeting-integrations.service.ts`
  - New file: `backend/services/meeting/integrations/meeting-integrations.service.ts`
  - Methods:
    - `listIntegrationProviders(): Promise<MeetingIntegrationProvider[]>` — for each `["zoom", "google_meet", "microsoft_teams"]`, resolve adapter via `MeetingChannelFactory`, return `{ slug, kind, credentialsHealthy, lastTestedAt?, connectedTeacherCount, reauthNeededCount, endpoints: readonly string[] }` where `endpoints` is sourced from a new static `ENDPOINTS` field on each adapter class.
    - `listConnectedAccounts(providerSlug): Promise<MeetingIntegrationConnectedAccount[]>` — call `MeetingProviderTokenRepository.listByProvider(slug)` joined with users repo for display name/e-mail; return `{ userId, name, email, connectedAt, expiresAt, lastRefreshedAt, status }` (status = `connected|expiring_soon|reauth_needed|revoked`).
    - `testConnection(providerSlug, mode): Promise<TestMeetingConnectionResult>` — mode union `VALIDATE_CONFIG|GENERATE_AND_DELETE`; for VALIDATE_CONFIG call `adapter.validateConfig()`; for GENERATE_AND_DELETE call `adapter.generateMeeting({topic:"[Test] Siraj integration probe - safe to delete", durationMinutes:15})` then `adapter.deleteMeeting(meetingId)` (tolerate Google Meet's missing delete — mark `deleted: false` with translated note). Always return `{ ok, latencyMs, mode, testJoinUrl?, deleted?, upstreamResponseSummary, errorCode?, errorMessage?, rawUpstreamPayload? }`.
    - `revokeToken(input: {userId, providerSlug}): Promise<AdminRevokeTokenResult>` — best-effort `adapter.disconnect(tokenRow)` (or provider-specific revocation HTTP call documented per adapter), then `tokenRepo.delete(userId, slug)`, then write audit-log entry under `meeting_provider_token.revoked` category.
  - 5.2.QL Quality Loop on the new service file
  - 5.2.IV Instruction Verification against `backend/services/AGENTS.md` + `backend/AGENTS.md` + backend.instructions.md
  - Write unit tests with mocked `MeetingChannelFactory` + token repo + audit log — cover all four state branches + both test modes
  - Global quality check
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.3 Implement Pothos GraphQL for meeting integrations (`environment-config.pothos.ts` style)
  - New file: `backend/graphql/pothos/system/meeting-integrations.pothos.ts`
  - Register object types: `MeetingIntegrationProvider`, `MeetingIntegrationConnectedAccount`, `TestMeetingConnectionResult`, `AdminRevokeTokenResult`
  - Register input types: `TestMeetingConnectionInput { providerSlug: String!, mode: TestMeetingConnectionMode! }`, `AdminRevokeTokenInput { userId: String!, providerSlug: String! }`
  - Register enum: `TestMeetingConnectionMode = VALIDATE_CONFIG | GENERATE_AND_DELETE`
  - Query fields: `meetingIntegrationProviders: [MeetingIntegrationProvider!]!`, `meetingIntegrationConnectedAccounts(providerSlug: String!): [MeetingIntegrationConnectedAccount!]!` — gated by `authScopes: { loggedIn: true }` + resolver-level `assertCanViewMeetingIntegrations(ctx)` (mirrors `assertCanViewEnvironmentConfig` at `environment-config.pothos.ts:108`)
  - Mutation fields: `testMeetingProviderConnection(input: TestMeetingConnectionInput!): TestMeetingConnectionResult!`, `adminRevokeMeetingProviderToken(input: AdminRevokeTokenInput!): AdminRevokeTokenResult!` — gated by `authScopes: { permission: AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS, notImpersonating: true }` (mirrors `upsertEnvConfigEntry` at `environment-config.pothos.ts:165`)
  - Run codegen
  - 5.3.QL Quality Loop on the new Pothos file
  - 5.3.IV Instruction Verification against `backend/graphql/AGENTS.md` + `backend/graphql/pothos/AGENTS.md` + `backend/AGENTS.md` + backend.instructions.md
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.4 Add "Meeting Integrations" tab to Settings config + tab panels
  - File: `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts` — add new tab entry:
    `{ id: "meetingIntegrations", labelKey: "meetingIntegrations", permissions: PAGE_PERMISSIONS.settingsMeetingIntegrations, icon: VideocamOutlined }`
  - File: `frontend/common/views/dashboard/settings/SettingsTabPanels.tsx` — add `LazyMeetingIntegrationsTab = lazy(() => import("@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/MeetingIntegrationsTab").then(...))` + extend `TAB_PANELS` array with the new entry (mirroring existing 6 entries at lines 25-50)
  - File: `shared/locale/{en,ar}/dashboard/settings/` (existing namespaces) — add `meetingIntegrations: "Meeting Integrations"` / `تكامل الاجتماعات` translation key
  - 5.4.QL Quality Loop on touched files
  - 5.4.IV Instruction Verification against `frontend/AGENTS.md` + `shared/AGENTS.md` + .agents/instructions/frontend.instructions.md
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.5 Build `MeetingIntegrationsTab` common switcher + tier desktop/mobile views
  - New files (mirror the `EnvironmentConfigTab` tier-isolation pattern exactly):
    - `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/MeetingIntegrationsTab.tsx` — responsive switcher around `ResponsiveViewSwitch` (mirror `frontend/common/views/dashboard/settings/tabs/environment/EnvironmentConfigTab.tsx`)
    - `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.desktop.tsx`
    - `frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.mobile.tsx`
  - Per-tier view layout per the design wireframe: aggregate health headers at top, per-provider accordion (Zoom first expanded, Meet + Teams collapsed by default), each accordion section = endpoints info + credential form + two Test Connection CTAs + result panel + per-teacher token audit table with per-row kebab menu (View metadata / Revoke)
  - 5.5.QL Quality Loop on all 3 new files
  - 5.5.IV Instruction Verification against `frontend/views/AGENTS.md` + `frontend/desktop/AGENTS.md` + `frontend/mobile/AGENTS.md` + `frontend/AGENTS.md` + .agents/instructions/frontend.instructions.md + mobile-desktop.instructions.md
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.6 Implement `useMeetingIntegrationsViewModel` hook + Apollo documents + Zustand store
  - New file: `frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents.ts` — export `MEETING_INTEGRATION_PROVIDERS_QUERY_DOCUMENT`, `MEETING_INTEGRATION_CONNECTED_ACCOUNTS_QUERY_DOCUMENT`, `TEST_MEETING_PROVIDER_CONNECTION_MUTATION_DOCUMENT`, `ADMIN_REVOKE_MEETING_PROVIDER_TOKEN_MUTATION_DOCUMENT`, plus fragments for the four object types
  - Run `bun codegen` to regenerate hook types
  - New file: `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.ts` — Apollo hooks wiring; exposes `{ providers, refresh, expandedSlug, setExpandedSlug, runTest(providerSlug, mode), lastTestResultByProvider, auditRowsByProvider, revokeAccount(userId, providerSlug) }`; success/error toasts from a new `SettingsMeetingIntegrations` translation namespace
  - New Zustand store `frontend/common/stores/meetingIntegrationsSettingsStore.ts` to hold last-test timestamps + expanded state per provider (mirrors `environmentConfigSettingsStore.ts`)
  - 5.6.QL Quality Loop on new files
  - 5.6.IV Instruction Verification against `frontend/common/graphql/AGENTS.md` + `frontend/common/graphql/sharedDocuments/AGENTS.md` + `frontend/AGENTS.md` + frontend.instructions.md
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.7 Build the per-provider credential form sub-component (reuses env-config mutations)
  - New files:
    - `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.tsx` — per-provider form rendering the `category:"meeting"` env-config rows for that provider; Save/Revert buttons call existing `upsertEnvConfigEntry` / `deleteEnvConfigEntry` mutations (no second storage path); shares the existing `EnvSecretField` mask-toggle field at `frontend/common/views/dashboard/settings/components/environment/EnvSecretField.tsx`
    - `frontend/common/views/dashboard/settings/components/meetingIntegrations/EndpointList.tsx` — read-only endpoints display sourced from the adapter's static `ENDPOINTS` field (returned from the `meetingIntegrationProviders` GraphQL query)
  - 5.7.QL Quality Loop on new files
  - 5.7.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.8 Build `TestConnectionResultPanel` + `ConnectedAccountsTable` sub-components
  - New files:
    - `frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.tsx` — renders success and error result panels per the design wireframe (collapsible `<details>` for raw upstream payload, error-action hint with link to provider marketplace, copy chip for test-join-URL)
    - `frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.tsx` — sortable table; per-row kebab menu (View metadata → opens a dialog showing scopes + expiry + connected-at; Revoke → confirmation dialog → mutation)
    - `frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog.tsx`
  - 5.8.QL Quality Loop on new files
  - 5.8.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.9 Build the aggregate health headers row
  - New file: `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsHealthHeaders.tsx`
  - Renders 4 metric cards (per design wireframe): providers configured / org-creds healthy / teachers connected / reauth-needed + last-tested-at timestamp chip
  - Pulls from the same `useMeetingIntegrationsViewModel` aggregate state
  - 5.9.QL Quality Loop
  - 5.9.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-13_

- [x] 5.10 Add Storybook stories for the new Meeting Integrations tab + sub-components
  - New file: `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.desktop.stories.tsx` (and mobile variant story)
  - Cover these states: configured / unconfigured provider, healthy / unhealthy creds, idle / running-test / test-success / test-failure states per provider, audit table empty / non-empty, revoke dialog open
  - Use mock Apollo stores for stories (per repo conventions — `frontend/stores/` mock-store pattern)
  - 5.10.QL Quality Loop
  - 5.10.IV Instruction Verification against Storybook conventions
  - Write outcome
  - _Requirements: REQ-13_

## Phase 6: Hybrid Authentication — Per-Teacher OAuth

- [x] 6.1 Implement `connectMeetingProviderOAuth` / `disconnectMeetingProviderOAuth` GraphQL mutations
  - Files: `backend/graphql/mutation/meeting/meeting.mutation.ts`
  - `connect`: mint HMAC state nonce (`userId + providerSlug + returnPath`, 10-min TTL), build provider authorize URL, return `{ authorizeUrl, state }`
  - `disconnect`: call provider's revocation endpoint (best-effort), then delete `meeting_provider_tokens` row
  - Auth: `MEETING_CONFIGS_MANAGE_OWN` only
  - 5.1.QL Quality Loop
  - 5.1.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-9, REQ-10_

- [x] 6.2 Implement OAuth callback App Router routes
  - New files:
    - `app/(dashboard)/api/oauth/zoom/callback/route.ts`
    - `app/(dashboard)/api/oauth/google-meet/callback/route.ts`
    - `app/(dashboard)/api/oauth/microsoft-teams/callback/route.ts`
  - Each handler: validate HMAC state -> exchange code for tokens via provider-specific token endpoint -> persist tokens via `MeetingProviderTokenRepository.upsert` -> 302 redirect to `returnPath`, 400 on bad state
  - Update Next.js middleware to skip auth on `/api/oauth/**` (state nonce is the trust anchor instead)
  - 6.2.QL Quality Loop
  - 6.2.IV Instruction Verification against `app/AGENTS.md` + `frontend.instructions.md`
  - Write outcome
  - _Requirements: REQ-10_

- [x] 6.3 Implement the per-teacher OAuth state nonce store
  - Use a short-TTL encrypted cookie OR an in-memory + DB cache (DB-backed singleton table `oauth_state_cache`)
  - HMAC sign `userId + providerSlug + returnPath + nonce` with a server secret; verify on callback
  - Decision: cookie-based encrypted JWT (signed, 10-min exp) — no DB row needed; document in outcome
  - 6.3.QL Quality Loop
  - 6.3.IV Instruction Verification
  - Write outcome with the chosen approach rationale
  - _Requirements: REQ-10_

- [x] 6.4 Frontend "Connect your <Provider> account" button + state UI
  - New file: `frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount.tsx` (or as part of MeetingConfigFormDialog)
  - States: `disconnected` (button "Connect"), `connecting` (spinner, waiting for callback), `connected` ("Connected as <email>" + "Disconnect" button), `reauthNeeded` ("Reconnect your account" callout)
  - Wire to `useMeetingConfigsManagerViewModel.connectProvider(providerSlug)` / `disconnectProvider(providerSlug)`
  - 6.4.QL Quality Loop
  - 6.4.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-10_

- [x] 6.5 Wire per-user fallback into the three adapters
  - Files: `ZoomMeetingAdapter.ts`, `GoogleMeetAdapter.ts`, `MicrosoftTeamsAdapter.ts`
  - Extend `generateMeeting` to accept (internally) an `actorUserId` and resolve credentials:
    - Try `resolveEnvConfigMany([...orgKeys])` first
    - If org creds missing -> look up `MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, slug)` -> exchange refresh token for access token -> use that
    - On `invalid_grant` from refresh exchange -> throw `ProviderReauthRequiredError`
  - Document variant: Google Meet per-user OAuth path skips `sub` claim (user token grants scope directly) and skips DWD
  - 6.5.QL Quality Loop on each adapter (in parallel; sub-agents per adapter)
  - 6.5.IV Instruction Verification per adapter file
  - Update adapter unit tests with the per-user fallback branch
  - Write outcome
  - _Requirements: REQ-9_

- [x] 6.6 Refresh-token rotation: surface "Reconnect" state to the user when tokens are stale
  - File: `useMeetingConfigsManagerViewModel.ts` — derive `requiresReconnect` state from any `ProviderReauthRequiredError` returned from a recent generation attempt; expose to UI (6.4 state)
  - File: `frontend/common/components/ui/display/meetingConfig/MeetingConfigList.tsx` — show a "Reconnect required" badge next to configs whose provider falls back to per-user and has expired tokens
  - 6.6.QL Quality Loop
  - 6.6.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-9, REQ-10_

## Phase 7: Teacher Profile "Meeting Configs" Section Refresh (REQ-14 NEW)

The teacher Profile Meeting Configs section refresh surfaced in REQ-14. Depends on Phase 4 (frontend UX entry points) + Phase 6 (per-teacher OAuth state from ConnectProviderAccount/button). All work is additive — manual-provider flow remains unchanged (REQ-14 AC6 no-regression).

- [x] 7.1 Build `AutoGenerationSupportCallout` component (3 modes explanation + admin docs link)
  - New file: `frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.tsx`
  - Static card explaining: on-save silent / preview button / booking-time generation — with inline link icons to admin docs (`docs/services/meeting-providers.md` public mirror, or to the admin Meeting Integrations tab anchor)
  - Rendered at top of Profile Meeting Configs section
  - i18n: new keys in `shared/locale/{en,ar}/profile/notifications` (existing namespace)
  - 7.1.QL Quality Loop
  - 7.1.IV Instruction Verification against `frontend/views/AGENTS.md` + `frontend/AGENTS.md` + `shared/AGENTS.md` + frontend.instructions.md
  - Write outcome
  - _Requirements: REQ-14_

- [x] 7.2 Build `ReauthNeededBanner` component (per-user token expiry warning + reconnect CTA)
  - New file: `frontend/common/views/dashboard/profile/shared/meeting-configs/ReauthNeededBanner.tsx`
  - Shows when any per-user token is within 7 days of expiry OR in `reauth_needed` state
  - Wires to `useMeetingConfigsManagerViewModel.reauthProviders` (computed from token states)
  - Reconnect button re-initiates the OAuth flow (mutates `connectMeetingProviderOAuth` mutation per REQ-10)
  - 7.2.QL Quality Loop
  - 7.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-14_

- [x] 7.3 Build `AutoGeneratedBadge` component + "Re-generate" overflow action
  - New file: `frontend/common/components/ui/display/meetingConfig/AutoGeneratedBadge.tsx` (placed with existing meeting-config display components)
  - Chip badge with hover-tooltip showing upstream `meetingId` + provider; clicking reveals overflow menu containing "Re-generate" action via `useMeetingConfigsManagerViewModel.regenerateConfig(configId)`
  - Used in `MeetingConfigList.tsx` row rendering for configs where `provider.providerKind !== "manual"`
  - 7.3.QL Quality Loop
  - 7.3.IV Instruction Verification against `frontend/views/AGENTS.md` + mobile-desktop.instructions.md
  - Write outcome
  - _Requirements: REQ-14_

- [x] 7.4 Build `LinkedClassInstancesList` component + "View bookings using this URL" link
  - New file: `frontend/common/views/dashboard/profile/shared/meeting-configs/LinkedClassInstancesList.tsx`
  - Scrollable list filtered by `meetingConfigId` showing the linked `class_instances` rows; each row shows the class-instance title + start time + `meetingJoinUrl` (or "URL pending" badge when null)
  - Triggered from the row's "View bookings using this URL" link in `MeetingConfigList.tsx`
  - Backend reuse: existing `EffectiveMeeting` GraphQL surface (no new query needed; Apollo filtering happens client-side on the existing class-instance query OR a new parameterized query as part of this task — design decision documented in outcome)
  - 7.4.QL Quality Loop
  - 7.4.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-14_

- [x] 7.5 Wire the Profile Meeting Configs section refresh into `MeetingConfigsManager.tsx`
  - File: `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx`
  - Insert `<AutoGenerationSupportCallout />` at top, `<ReauthNeededBanner />` below when applicable, replace per-row rendering to use the new `AutoGeneratedBadge` for auto configs, add "View bookings using this URL" link action when class instances exist
  - Mobile vs Desktop tier variants: extend tier partners at `frontend/mobile/views/dashboard/profile/shared/meeting-configs/` and `frontend/desktop/views/dashboard/profile/shared/meeting-configs/` per AGENTS tier separation
  - 7.5.QL Quality Loop on all touched files
  - 7.5.IV Instruction Verification against `frontend/views/AGENTS.md` + `frontend/mobile/AGENTS.md` + `frontend/desktop/AGENTS.md` + mobile-desktop.instructions.md
  - Write outcome
  - _Requirements: REQ-14_

- [x] 7.6 Add Storybook stories for the Profile Meeting Configs refresh
  - New file: `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.stories.tsx` (extend existing if present)
  - Cover: auto config rows with badges / manual config rows unchanged, reauth banner visible / hidden, linked-class-instances list populated / empty, mobile/desktop variants
  - 7.6.QL Quality Loop
  - 7.6.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-14_

## Phase 8: Integration Smoke Tests

- [x] 8.1 Add `test/integration/meeting/zoom.integration.test.ts`
  - Gated by `describeLiveWhen(hasZoomConfig, ...)` — env: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`
  - Test: create one real meeting via `ZoomMeetingAdapter`, assert `join_url` starts with `https://zoom.us/j/`, then call `deleteMeeting(meetingId)` to clean up
  - Skip cleanly when env missing
  - 8.1.QL Quality Loop
  - 8.1.IV Instruction Verification against `test/integration/AGENTS.md` (if exists) + `backend/AGENTS.md` + `backend.instructions.md` + `tests.instructions.md`
  - Register in `package.json` existing `test:integration` script (already glob-picked up by `run-integration-tests-parallel.ts`)
  - Write outcome noting the live-test meeting IDs created (for any post-test cleanup debugging)
  - _Requirements: REQ-12_

- [x] 8.2 Add `test/integration/meeting/google-meet.integration.test.ts`
  - Gated by `hasGoogleMeetConfig` — env: `GOOGLE_MEET_SERVICE_ACCOUNT_JSON`, `GOOGLE_MEET_IMPERSONATE_SUBJECT`
  - Test: create one real Meet space via `GoogleMeetAdapter`, assert `meetingUri` starts with `https://meet.google.com/`
  - Note: Meet API has no per-space DELETE; document the space id created in the test outcome file (it's auto-expired after the meeting ends)
  - 8.2.QL Quality Loop
  - 8.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-12_

- [x] 8.3 Add `test/integration/meeting/microsoft-teams.integration.test.ts`
  - Gated by `hasMicrosoftTeamsConfig` — env: `MS_TEAMS_TENANT_ID`, `MS_TEAMS_CLIENT_ID`, `MS_TEAMS_CLIENT_SECRET`, `MS_TEAMS_ORGANIZER_USER_ID`
  - Test: create one real online meeting via `MicrosoftTeamsAdapter`, assert `joinWebUrl`, then call `DELETE /users/{userId}/onlineMeetings/{id}` for cleanup
  - Note: requires admin to have run `New-CsApplicationAccessPolicy` + `Grant-CsApplicationAccessPolicy` on the test tenant first (documented in test setup header)
  - 8.3.QL Quality Loop
  - 8.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-12_

## Phase 9: Knowledge Propagation & Documentation (MANDATORY Final Phase)

- [x] 9.1 Synthesize all outcome files into `docs/services/meeting-providers.md`
  - Read all files in `.ai/plans/auto-meeting-url/outcome/` to extract the patterns, gotchas, and deployment prerequisites discovered during implementation
  - Create `docs/services/meeting-providers.md` following the docs file structure:
    - **Why Auto Meeting Generation**: motivation (manual URL fatigue, broken-link bugs, per-class-instance uniqueness)
    - **The Pattern**: the `IMeetingChannel` adapter/factory pattern (with annotated Zoom/Meet/Teams adapter examples)
    - **Rules / Conventions**: how to add a new provider adapter, hybrid auth resolution order, URL-allowlist bypass rules, type discriminations
    - **What NOT to Do**: don't call adapters directly (use factory); don't store refresh tokens unencrypted; don't do booking-time generation synchronously in the booking txn
    - **Deployment Prerequisites**: Workspace DWD setup for Meet, Entra App Access Policy + `New-CsApplicationAccessPolicy` for Teams, Zoom App Marketplace S2S app creation
    - **Rollout Summary**: table of files modified, methods refactored
    - **Related Documents**: `AGENTS.md`, `backend/services/AGENTS.md`, design.md, specs.md
  - 9.1.QL Quality Loop on the new doc file
  - 9.1.IV Instruction Verification (docs are not in the instructions scope — skip IV, document in outcome)
  - Write outcome: `.ai/plans/auto-meeting-url/outcome/9.1-docs-outcome.md`
  - Update progress: mark 9.1 `[x]`
  - _Requirements: Knowledge propagation protocol_

- [x] 9.2 Update AGENTS.md files with references to the new docs and rules
  - Files to update:
    - `backend/services/AGENTS.md` — add "Meeting Provider Adapters (CRITICAL)" rule: "All meeting URL generation MUST go through `MeetingChannelFactory.getMeetingChannel(slug)`. See `docs/services/meeting-providers.md` for the pattern reference."
    - `backend/AGENTS.md` — add `docs/services/meeting-providers.md` to Important References section
    - `backend/db/repo/AGENTS.md` — add note about `meeting_provider_tokens` repository conventions (encrypted refresh-token storage)
    - `frontend/views/AGENTS.md` — add note about `MeetingConfigTypeFields` auto-generation affordance pattern + the new admin Meeting Integrations tab pattern (mirrors `EnvironmentConfigTab`)
  - 9.2.QL Quality Loop
  - 9.2.IV Instruction Verification against each AGENTS.md's own scope
  - Write outcome
  - _Requirements: Knowledge propagation protocol_

- [x] 9.3 Update root `AGENTS.md` Important References section
  - File: `AGENTS.md` (root)
  - Add to the `## Important References` section:
    - `- docs/services/meeting-providers.md - Meeting provider adapter pattern (auto Zoom/Google Meet/Microsoft Teams URL generation)`
  - 9.3.QL Quality Loop
  - 9.3.IV Instruction Verification
  - Write outcome
  - _Requirements: Knowledge propagation protocol_

- [x] 9.4 Update `.agents/instructions/backend.instructions.md` if new conventions should be enforced for future backend work
  - File: `.agents/instructions/backend.instructions.md`
  - Add a "Meeting Provider Adapters" section requiring future backend work that touches meeting config to follow the factory pattern and consult `docs/services/meeting-providers.md`
  - Update `.agents/instructions/frontend.instructions.md` if frontend conventions changed (auto-generation form affordance pattern + admin Meeting Integrations tab pattern)
  - 9.4.QL Quality Loop
  - 9.4.IV Instruction Verification
  - Write outcome
  - _Requirements: Knowledge propagation protocol_

- [x] 9.5 Final global quality gate verification
  - Run the full `bun quality-gate` lifecycle (tsgo -> biome:check -> lint -> codescene -> sonar-results)
  - Address any failures with focused subagent waves per the quality-gate skill
  - Confirm the integration smokes are NOT run in the main quality-gate loop (they're env-gated and live-only)
  - Write outcome: `.ai/plans/auto-meeting-url/outcome/9.5-quality-gate-outcome.md` with the final gate exit status
  - Update progress: mark 9.5 `[x]`
  - _Requirements: Knowledge propagation protocol_

## Phase 10: Wrap-up

- [x] 10.1 Final user-facing summary
  - Review all `outcome/*.md` files
  - Compose a concise summary in the chat (NOT a markdown file — per AGENTS.md, agents must not create summary markdown files)
  - Confirm with the user that the feature is acceptable; surface the deployment prerequisites (admin needs to configure Zoom S2S app / Meet DWD / Teams App Access Policy)
  - Update progress: mark 10.1 `[x]`

---

## Cross-File Dependency Tracker

This section is populated by subagents as they encounter dependencies they cannot fix in their assigned file. Format per AGENTS.md:

```
CROSS-FILE DEPENDENCY:
Target file: <this file>
Blocked by: <other file that needs changes>
Rule violated: <which rule from instruction file or AGENTS.md>
Required fix: <description of what the other file needs>
```

(Empty initially; orchestrator coordinates follow-up subagent waves for any reported dependencies.)

## Open Questions for User (Pre-Implementation)

1. **Seed strategy for auto providers** (subtask 1.9): keep `zoom`/`google_meet`/`microsoft_teams` as auto-only (drop manual entry for these), or add both variants (e.g. `zoom_auto` + keep `zoom` manual)? Default = convert existing slugs to auto; manual entry remains available for any custom provider admin creates.

2. **Drizzle push vs migrate** (Phase 1 subtasks): all schema changes here are additive. Confirm we use `bun run db push` (per repo policy — push enabled for additive changes) vs generating a migration file for production deploy.

3. **OAuth scope per user** (subtask 5.1): confirm the provider-specific scopes:
   - Zoom user OAuth: `meeting:write`
   - Google Meet user OAuth: `https://www.googleapis.com/auth/meetings.space.created`
   - Microsoft Teams user OAuth: `OnlineMeetings.ReadWrite` (delegated)

4. **Mobile bottom-nav** (UX spec): confirm no new mobile bottom-nav item is needed (all changes are in-tab affordances).

5. **`bun run db push` approval**: subtasks 1.3, 1.4, 1.5 each touch schema. Will you approve the `push` after each task ships, or want it batched at end of Phase 1?

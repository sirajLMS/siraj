# In-App Meeting View — Trackable Tasks

## Document Information

- **Feature Name**: In-App Meeting View — Zoom Meeting SDK embed + recording/attendance/engagement telemetry
- **Version**: 1.1
- **Date**: 2026-08-01
- **Research verification**: 2026-08-01 — plan corrected per deep-research findings (see design.md §Research Verification Summary)
- **Status**: Draft (pending plan acceptance)
- **Target Directory**: `.ai/plans/in-app-meeting-view`
- **Outcome Directory**: `.ai/plans/in-app-meeting-view/outcome`
- **Related Documents**:
  - [Requirements (Specs)](./specs.md)
  - [Design](./design.md)
- **Predecessor Plan**: [auto-meeting-url trackable-tasks](../auto-meeting-url/trackable-tasks.md) — every task MUST be `[x]` before any task here starts.

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:** Before executing ANY task, read ALL files in `.ai/plans/in-app-meeting-view/outcome/` to absorb prior research, search results, docs, and pitfalls — analysis must not be repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):** Whenever a file is modified, run per-file verification (`bun tsgo` + `bun biome:check` + lint queue for the target file) BEFORE moving to another file or subtask.
3. **Global Health Check (Completion Gate):** Before marking any subtask complete, run `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
4. **Post-Execution Outcome File Creation:** After implementation + quality checks, write `.ai/plans/in-app-meeting-view/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.
5. **Task Progress Tracking:** Update `[ ]` -> `[x]` in this `trackable-tasks.md` upon completion.
6. **Predecessor Plan Gating:** Before executing the first task, read `.ai/plans/auto-meeting-url/trackable-tasks.md` and verify every predecessor task is marked `[x]`. If any predecessor task is `[ ]` or `[~]`, refuse to start and report "blocked by predecessor plan" in the outcome directory.

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

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj-meetings/AGENTS.md` | — |
| Backend Schema | `/home/ahmed/Projects/siraj-meetings/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/backend.instructions.md` |
| Backend Repos | `/home/ahmed/Projects/siraj-meetings/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `/home/ahmed/Projects/siraj-meetings/.agents/instructions/backend.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj-meetings/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |
| Backend Services | `/home/ahmed/Projects/siraj-meetings/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Backend GraphQL | `/home/ahmed/Projects/siraj-meetings/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/graphql/pothos/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Backend Types | `/home/ahmed/Projects/siraj-meetings/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/types/meeting/AGENTS.md` (if exists), `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Backend Enums | `/home/ahmed/Projects/siraj-meetings/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md` |
| Frontend Common | `/home/ahmed/Projects/siraj-meetings/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md` | `frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj-meetings/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj-meetings/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj-meetings/frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| App Router | `/home/ahmed/Projects/siraj-meetings/app/AGENTS.md` | `frontend.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj-meetings/shared/AGENTS.md` | — |
| Test UI | `/home/ahmed/Projects/siraj-meetings/test/ui/AGENTS.md` | `tests.instructions.md` |
| Integration Tests | `/home/ahmed/Projects/siraj-meetings/test/integration/AGENTS.md` (if exists), `/home/ahmed/Projects/siraj-meetings/backend/AGENTS.md` | `backend.instructions.md`, `tests.instructions.md` |

### Drizzle Schema Convention (Reference)

- **Schema changes** (new tables, columns, indexes): `bun run db push` (per repo policy "reset & cleanGenerate disabled" — push is enabled for non-destructive adds; review with user if uncertain)
- **Custom SQL migrations** (complex transforms, data backfills): `bun db migrate` — used MINIMALLY per repo policy
- **Confirm non-destructive:** All schema changes in this plan are additive (new tables, new indexes) — safe for `push`

## Implementation Overview

### Implementation Strategy

- **Phase-1 foundation first**: types, schemas, env keys, `IMeetingSurface` interface — everything downstream depends on these being stable.
- **Phase-2 Zoom signature services in parallel**: `ZoomSdkSignatureService` + `ZoomObfTokenService` can be built independently after Phase 1 ships types.
- **Phase-3 GraphQL surface**: single coordinated change to add the `meetingSurfaceContext` resolver + telemetry queries; depends on Phase 2.
- **Phase-4 frontend embedded surface**: desktop Component View + mobile Client View are independent tier builds; `MeetingJoinCard` common switcher lands first.
- **Phase-5/6/7 telemetry ingest**: recording, attendance, engagement are parallel-slicable after Phase 3 ships GraphQL surfaces. Each phase is per-provider (Zoom / Meet / Teams) and per-stream (recordings / attendance / engagement).
- **Phase-8 integration smokes**: depends on Phase 2 + Phase 5/6/7 done.
- **Phase-9 knowledge propagation**: mandatory final phase after everything passes quality gate.

### Development Approach

- **Testing Strategy**: TDD on services with mocked `fetch` + `jose`; webhook verification tested with sample signed payloads (real HMAC + ZOOM_WEBHOOK_SECRET_TOKEN overrides in test fixtures). Front-end uses Storybook for `ZoomEmbeddedSurface` states (cannot run live WASM in unit tests — visual stories only). Integration smokes are last, env-gated.
- **Integration Strategy**: Phase-boundary gates — each phase must land + green before the next phase starts.
- **Deployment Strategy**: rolling deploy with backend-first then frontend; telemetry data accumulates passively after webhook endpoints are registered (admin manual step).

---

## Phase 0: Pre-Execution Validation (MANDATORY before Phase 1)

- [ ] 0.1 Predecessor plan completion gate
  - Read all existing files in `.ai/plans/in-app-meeting-view/outcome/`
  - Read `.ai/plans/auto-meeting-url/trackable-tasks.md`
  - Verify every task in the predecessor `trackable-tasks.md` is `[x]`
  - If any predecessor task is `[ ]` or `[~]` THEN write outcome file `.ai/plans/in-app-meeting-view/outcome/0.1-blocked-by-predecessor-outcome.md` listing the blocked tasks and STOP
  - Otherwise write outcome `.ai/plans/in-app-meeting-view/outcome/0.1-predecessor-verified-outcome.md` confirming the predecessor plan is complete
  - Update progress: mark task 0.1 `[x]`
  - _Requirements: REQ-0 AC6_

## Phase 1: Foundation — Types, Schema, Surface Interface, Env Keys

- [ ] 1.1 Define `MeetingSurface` types (`IMeetingSurface` interface, `MeetingSurfaceMode` enum, surface-context types)
  - Read all existing files in `.ai/plans/in-app-meeting-view/outcome/`
  - New file: `backend/types/meeting/meeting-surface.types.ts`
  - Export `MeetingSurfaceMode = "embed" | "redirect"`, `MeetingRole = 0 | 1`
  - Export `EmbedSurfaceContext`, `RedirectSurfaceContext`, `MeetingSurfaceContext` discriminated union (per design component 1 interfaces)
  - Export `MeetingSurfaceContextInput`, `MeetingSurfaceContextResult` row types
  - Type imports per AGENTS — no local GraphQL/Pothos types
  - 1.1.QL Quality Loop on `backend/types/meeting/meeting-surface.types.ts`
  - 1.1.IV Instruction Verification against:
    - `/home/ahmed/Projects/siraj-meetings/backend/types/AGENTS.md`
    - `/home/ahmed/Projects/siraj-meetings/backend/types/meeting/AGENTS.md` (if exists)
    - `/home/ahmed/Projects/siraj-meetings/.agents/instructions/backend.instructions.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - Write outcome: `.ai/plans/in-app-meeting-view/outcome/1.1-surface-types-outcome.md`
  - Update progress: mark task 1.1 `[x]`
  - _Requirements: REQ-1, REQ-4_

- [ ] 1.2 Define `IMeetingSurface` interface + factory scaffolding
  - New file: `backend/services/meeting/surfaces/IMeetingSurface.ts`
  - Export `IMeetingSurface` interface (mirrors design component 1)
  - Export typed errors: `ManualProviderHasNoSurfaceError`, `MissingMeetingSdkCredentialsError`, `MeetingUrlPendingError`, `ZoomSdkSignatureInvalidError`, `ZoomObfTokenError`, `WebRtcUnsupportedError`
  - All errors extend a shared `MeetingSurfaceError` base class (mirrors predecessor plan `MeetingChannelError`)
  - 1.2.QL Quality Loop on the new file
  - 1.2.IV Instruction Verification against `backend/services/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md`
  - Write outcome
  - _Requirements: REQ-1, REQ-4_

- [ ] 1.3 Implement `MeetingSurfaceFactory`
  - New file: `backend/services/meeting/surfaces/MeetingSurfaceFactory.ts`
  - Mirror `MeetingChannelFactory` structure (from predecessor plan):
    - `initializationPromise: Map<MeetingProvider, Promise<IMeetingSurface>>` (race-safe)
    - lazy `await import("@/backend/services/meeting/surfaces/<provider>/<Surface>")` per slug
    - credentials resolved via `MeetingChannelFactory.getAccessToken(slug, actorUserId)`
    - `getMeetingSurface(slug)`, `resetMeetingSurface(slug)` (calls `adapter.clearCache?.()` + `invalidateEnvConfigCache`), convenience `meetingSurface` object delegating `resolveSurfaceContext`/`clearCache`
  - Throw `ManualProviderHasNoSurfaceError` when `slug` resolves to a manual provider (the surface factory doesn't construct an adapter for manual — manual redirect uses `joinWebUrl` read from the class instance directly)
  - 1.3.QL Quality Loop on the new file
  - 1.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-1, REQ-4_

- [ ] 1.4 Drizzle schema: new `class_meeting_recordings` table
  - New file: `backend/db/schema/meeting/class-meeting-recordings.ts`
  - Columns per design component 9 / data model 1: `id (uuid pk)`, `classInstanceId (fk -> class_instances.id, onDelete SET NULL)`, `providerSlug (varchar 50)`, `upstreamRecordingId (varchar 200)`, `topic (varchar 300)`, `startedAt (timestamptz)`, `durationSecs (int)`, `playUrl`, `downloadUrl`, `shareUrl` (varchar 2000 nullable), `password (varchar 100 nullable)`, `recordingFiles (jsonb)`, `state (varchar 20 default 'available')`, `source (varchar 10)`, `createdAt`, `updatedAt`
  - Unique partial index on `(providerSlug, upstreamRecordingId) WHERE state = 'available'`
  - Index on `(classInstanceId, startedAt)` for per-class queries
  - Export from `backend/db/schema/meeting/index.ts`
  - 1.4.QL Quality Loop on the new file AND on `backend/db/schema/meeting/index.ts`
  - 1.4.IV Instruction Verification against `backend/db/schema/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md`
  - Drizzle push only after user approval (per repo policy)
  - Write outcome
  - _Requirements: REQ-8_

- [ ] 1.5 Drizzle schema: new `class_meeting_attendance` table
  - New file: `backend/db/schema/meeting/class-meeting-attendance.ts`
  - Columns per design data model 2: `id (uuid pk)`, `classInstanceId (fk -> class_instances.id, onDelete CASCADE, NOT NULL)`, `providerSlug (varchar 50)`, `upstreamParticipantId (varchar 200)`, `userId (uuid fk -> users.id, nullable)`, `displayName (varchar 200)`, `userEmail (varchar 200 nullable)`, `joinAt (timestamptz)`, `leaveAt (timestamptz nullable)`, `durationSecs (int)`, `attentiveness (int nullable)`, `source (varchar 10)`, `createdAt`, `updatedAt`
  - Unique partial index on `(classInstanceId, upstreamParticipantId, joinAt)`
  - Index on `(userId, joinAt)` for per-student rollup queries
  - Export from `backend/db/schema/meeting/index.ts`
  - 1.5.QL Quality Loop
  - 1.5.IV Instruction Verification
  - Drizzle push only after user approval
  - Write outcome
  - _Requirements: REQ-9_

- [ ] 1.6 Drizzle schema: new `meetings_engagement_events` table
  - New file: `backend/db/schema/meeting/meetings-engagement-events.ts`
  - Columns per design data model 3: `id (uuid pk)`, `classInstanceId (fk -> class_instances.id, onDelete SET NULL — orphan events survive)`, `providerSlug (varchar 50)`, `eventType (varchar 100)`, `eventTime (timestamptz)`, `upstreamPayload (jsonb)`, `receivedAt (timestamptz default now())`, `verified (boolean)`
  - Partial index on `(classInstanceId, eventTime)`
  - Index on `(providerSlug, eventType, receivedAt)` for admin filter queries
  - Export from `backend/db/schema/meeting/index.ts`
  - 1.6.QL Quality Loop
  - 1.6.IV Instruction Verification
  - Drizzle push only after user approval
  - Write outcome
  - _Requirements: REQ-10_

- [ ] 1.7 Register new env-config keys (`category: "meeting"`)
  - File: `backend/lib/env-config-keys.ts`
  - Append to `ENV_CONFIG_KEYS` registry:
    - `ZOOM_MSDK_CLIENT_ID` (`isSecret: true`, `displayStrategy: "db_with_mask_only"`)
    - `ZOOM_MSDK_CLIENT_SECRET` (`isSecret: true`, `displayStrategy: "db_with_mask_only"`)
    - `ZOOM_MSDK_OBF_ENABLED` (`isSecret: false`, default `false`)
    - `ZOOM_WEBHOOK_SECRET_TOKEN` (`isSecret: true`, `displayStrategy: "db_with_mask_only"`)
    - `MEET_RECORDING_POLL_INTERVAL` (`isSecret: false`, default `900`)
    - `TEAMS_RECORDING_POLL_INTERVAL` (`isSecret: false`, default `900`)
    - `TEAMS_WEBHOOK_ENCRYPTION_CERT` (`isSecret: true`, `displayStrategy: "db_with_mask_only"`) — PEM certificate for Graph rich-notification decryption
    - `TEAMS_WEBHOOK_ENCRYPTION_CERT_ID` (`isSecret: false`) — certificate ID registered with Graph subscription
  - File: `backend/lib/env.ts` — add corresponding optional fields to `EnvironmentConfig` interface + initialise from `process.env`
  - File: `environment.d.ts` — add the new keys
  - File: `.env.example` — add the new keys with placeholder values
  - Verify Settings Environment Config tab auto-discovers them (auto-discovers per predecessor plan; visual verify)
  - 1.7.QL Quality Loop on all four files
  - 1.7.IV Instruction Verification against `backend/AGENTS.md` + `backend/lib/AGENTS.md` (if exists) + `backend.instructions.md`
  - Write outcome
  - _Requirements: REQ-1_

- [ ] 1.8 Create repositories for the 3 new tables
  - New files:
    - `backend/db/repo/meeting/class-meeting-recording.repository.ts` — methods: `upsert(input)`, `getByClassInstance(classInstanceId, providerSlug?)`, `listForAdmin(filters)`, `markExpired(id)`
    - `backend/db/repo/meeting/class-meeting-attendance.repository.ts` — methods: `upsert(input)`, `getByClassInstance(classInstanceId, providerSlug?)`, `enrichUserId(id, userId)`, `listForAdmin(filters)`
    - `backend/db/repo/meeting/meetings-engagement-event.repository.ts` — append-only: `append(input)`, `getByClassInstance(classInstanceId)`, `listForAdmin(filters)`. NO `update`/`delete` methods.
  - Standard `queryDb(tx)` read pattern, transactions for writes
  - 100% coverage tests in `backend/db/test/repo/meeting/<name>.repository.test.ts` (use `runInRollback`, never `rejects.toThrow` inside `runInRollback` per AGENTS)
  - 1.8.QL Quality Loop on all new files + test files
  - 1.8.IV Instruction Verification against `backend/db/repo/AGENTS.md` + `backend/db/test/AGENTS.md` + `backend.instructions.md` + `tests.instructions.md`
  - Write outcome
  - _Requirements: REQ-8, REQ-9, REQ-10_

## Phase 2: Zoom SDK Signature + OBF Token Services

- [ ] 2.1 Implement `ZoomSdkSignatureService`
  - New file: `backend/services/meeting/surfaces/zoom/ZoomSdkSignatureService.ts`
  - Methods per design component 2:
    - `sign({ meetingNumber, role, actorUserId })` → `{ signature, sdkKey, exp }`
    - `resetCache()`, `resetForMeeting(meetingNumber)`
  - JWT mint via `jose.SignJWT` with `HS256`:
    - payload `{ appKey: ZOOM_MSDK_CLIENT_ID, sdkKey: ZOOM_MSDK_CLIENT_ID, mn: meetingNumber, role, iat: now-30s, exp: iat+1800, tokenExp: exp }` (include both `appKey` and `sdkKey` per Zoom cross-platform guidance)
    - `exp - iat` bounded `[1800, 172800]`
  - Cache per `(actorUserId, meetingNumber, role)`, TTL `exp - 60s`, race-safe `Promise<signature>` memo
  - Resolve `ZOOM_MSDK_CLIENT_ID` + `ZOOM_MSDK_CLIENT_SECRET` via `resolveEnvConfigMany`
  - Throw `MissingMeetingSdkCredentialsError` (translated `errors.meetingSdk.missingCredentials`) when creds missing
  - Dual constructor: no-arg path uses `getEnvironmentConfig()`; DI opts path for factory + tests
  - Write unit tests: `backend/services/meeting/surfaces/zoom/test/ZoomSdkSignatureService.test.ts` — mock `jose.SignJWT`; cover mint/caching/TTL/expiry/missing-creds/concurrent-mint branches
  - 2.1.QL Quality Loop on all new files + test file
  - 2.1.IV Instruction Verification against `backend/services/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md` + `tests.instructions.md`
  - Global quality check
  - Write outcome: `.ai/plans/in-app-meeting-view/outcome/2.1-zoom-sdk-signature-outcome.md`
  - _Requirements: REQ-2_

- [ ] 2.2 Implement `ZoomObfTokenService`
  - New file: `backend/services/meeting/surfaces/zoom/ZoomObfTokenService.ts`
  - Methods per design component 3:
    - `resolve({ meetingNumber, actorUserId, hostUserId, externalMeeting })` → `{ obfToken, reason? }`
    - `resetForMeeting(meetingNumber, actorUserId)`
  - Short-circuit return `null` when `ZOOM_MSDK_OBF_ENABLED` is `false`
  - Resolve host S2S access token via `MeetingChannelFactory.getAccessToken("zoom", hostUserId)`; OR per-actor token via `MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, "zoom")` when per-user fallback active
  - Call `GET https://api.zoom.us/v2/users/{userId}/token?type=onbehalf&meeting_id={meeting_id}` (requires `user:read:token` scope); cache result in-memory for `min(tokenTTL - 120, 1800)s`
  - Throw `ZoomObfTokenError` (translated `errors.zoomSdk.obfFailed`) on 4xx; graceful `null` on 5xx (let SDK surface the upstream error to the user)
  - Dual constructor pattern (mirror 2.1)
  - Write unit tests: `backend/services/meeting/surfaces/zoom/test/ZoomObfTokenService.test.ts` — mock `fetch` + `MeetingChannelFactory`; cover `OBF_ENABLED`/disabled, internal/external, org vs per-user token, 4xx / 5xx branches
  - 2.2.QL Quality Loop
  - 2.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-3_

- [ ] 2.3 Implement `ZoomMeetingSurface` adapter
  - New files:
    - `backend/services/meeting/surfaces/zoom/zoom-meeting-surface.types.ts`
    - `backend/services/meeting/surfaces/zoom/ZoomMeetingSurface.ts`
  - Implements `IMeetingSurface.resolveSurfaceContext({ classInstanceId, actorUserId })`:
    - Resolve class-instance + linked provider + class context (title, start, owner)
    - Determine `role` (host if actor is linked teacher / schedule owner, else attendee)
    - Determine `externalMeeting` (true if actor email domain external to host org's allow-list — env key `ZOOM_HOST_ORG_DOMAINS` added in task 1.7 read but configurable per deployment)
    - Call `ZoomSdkSignatureService.sign(...)` for `sdkSignature` + `sdkKey`
    - Call `ZoomObfTokenService.resolve(...)` for `obfToken` when `externalMeeting`
    - Resolve `password` from `class_instances.providerMetadata.password`
    - Assemble and return `EmbedSurfaceContext`
  - Throw `MeetingUrlPendingError` when `class_instances.meetingJoinUrl` is null
  - 2.3.QL Quality Loop
  - 2.3.IV Instruction Verification
  - Write unit tests with mocked `ZoomSdkSignatureService` + `ZoomObfTokenService` DI
  - Write outcome
  - _Requirements: REQ-4_

- [ ] 2.4 Implement `GoogleMeetSurface` / `MicrosoftTeamsSurface` / `ManualProviderSurface` redirect-only adapters
  - New files:
    - `backend/services/meeting/surfaces/google-meet/GoogleMeetSurface.ts`
    - `backend/services/meeting/surfaces/microsoft-teams/MicrosoftTeamsSurface.ts`
    - `backend/services/meeting/surfaces/manual/ManualProviderSurface.ts`
  - Each implements `IMeetingSurface.resolveSurfaceContext(...)`:
    - Resolve class-instance + `joinWebUrl` (already persisted by predecessor plan)
    - Return `RedirectSurfaceContext` with `providerSlug`, `joinWebUrl`, `userName`
    - Throw `MeetingUrlPendingError` when `class_instances.meetingJoinUrl` is null
  - No upstream HTTP calls — pure local table reads
  - 2.4.QL Quality Loop
  - 2.4.IV Instruction Verification
  - Write unit tests covering the 3 redirect adapters (mocked repo reads)
  - Write outcome
  - _Requirements: REQ-4_

## Phase 3: GraphQL Surface + Telemetry Queries

- [ ] 3.1 Implement Pothos `meetingSurfaceContext` query + `MEETING_VIEW` permission
  - File: `backend/enum/permissions/permission.enum.ts` — add `MEETING_VIEW = "meeting.view"` to the meeting permission cluster
  - File: `frontend/common/types/page-permissions.types.ts` — add `meetingView: [AppPermission.MEETING_VIEW] as PagePermissions`
  - File: `frontend/common/views/dashboard/config/navigationConfig.ts` — add `MEETING_VIEW` to `grp_admin`'s `permission` array so the group survives filter when held alone
  - New file: `backend/graphql/pothos/meeting/meeting-surface.pothos.ts` — register discriminated union `MeetingSurfaceContext` + `EmbedSurfaceContext` + `RedirectSurfaceContext` object types
  - New file: `backend/graphql/query/meeting/meeting-surface.query.ts` — `meetingSurfaceContext(classInstanceId: UUID!)` resolver:
    - Auth: `assertCanViewMeeting(ctx, classInstanceId)` helper checking `MEETING_VIEW` OR `MEETING_CONFIGS_MANAGE_OWN` for own class instances
    - Dispatches to `MeetingSurfaceFactory.getMeetingChannel(slug).resolveSurfaceContext(...)`
    - Sets `cacheControl: { scope: "Private", maxAge: 0 }`
    - Maps typed errors (`MissingMeetingSdkCredentialsError`, `MeetingUrlPendingError`, etc.) to GraphQL errors via existing error-presentation pattern
  - Run `bun run generate:gqlSchema && bun codegen`
  - 3.1.QL Quality Loop on all touched files + generated schema + types
  - 3.1.IV Instruction Verification against `backend/graphql/AGENTS.md` + `backend/graphql/pothos/AGENTS.md` + `backend/AGENTS.md` + `backend.instructions.md`
  - Write outcome
  - _Requirements: REQ-4, REQ-7_

- [ ] 3.2 Implement Pothos telemetry queries (Recordings / Attendance / Engagement)
  - Files to extend (against predecessor plan's meeting Pothos):
    - `backend/graphql/pothos/meeting/meeting.pothos.ts` — register new object types `ClassMeetingRecording`, `ClassMeetingAttendance`, `MeetingsEngagementEvent` (all canonical types from `backend/types/meeting/`)
    - New file: `backend/graphql/query/meeting/meeting-telemetry.query.ts` — expose 3 queries:
      - `classMeetingRecordings(classInstanceId: UUID, providerSlug: String, fromDate: Date, toDate: Date): [ClassMeetingRecording!]!` — auth `MEETING_VIEW` scoped
      - `classMeetingAttendance(classInstanceId: UUID!, providerSlug: String): [ClassMeetingAttendance!]!` — auth `MEETING_VIEW` scoped
      - `meetingEngagementEvents(providerSlug: String, eventType: String, fromDate: Date, toDate: Date, matched: Boolean): [MeetingsEngagementEvent!]!` — auth `SETTINGS_EDIT_MEETING_INTEGRATIONS` OR `SETTINGS_VIEW`
  - Run codegen
  - 3.2.QL Quality Loop
  - 3.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-8, REQ-9, REQ-10_

- [ ] 3.3 Implement Pothos `exportMeetingTelemetryCsv` mutation
  - New file: `backend/graphql/mutation/meeting/meeting-telemetry.mutation.ts`
  - Mutation: `exportMeetingTelemetryCsv(input: ExportMeetingTelemetryInput!): ExportMeetingTelemetryCsvResult!`
  - Input: `{ subPanel: "RECORDINGS" | "ATTENDANCE" | "ENGAGEMENT", providerSlug?, fromDate?, toDate?, matched? }`
  - Output: `{ downloadUrl: String! }` (presigned blob URL or in-memory blob ref)
  - Auth: `SETTINGS_EDIT_MEETING_INTEGRATIONS` OR `SETTINGS_VIEW`; refusers under `ctx.isImpersonating === true` per predecessor plan pattern (read access OK under impersonation, write refuse)
  - Run codegen
  - 3.3.QL Quality Loop
  - 3.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-11 AC6, AC7_

## Phase 4: Frontend Embedded Surface + MeetingJoinCard

- [ ] 4.1 Frontend GraphQL documents for surface context + telemetry
  - File: `frontend/common/graphql/sharedDocuments/meeting/meeting-surface.documents.ts`
    - `MEETING_SURFACE_CONTEXT_QUERY_DOCUMENT` (with Embed + Redirect fragments)
    - `CLASS_MEETING_RECORDINGS_QUERY_DOCUMENT`
    - `CLASS_MEETING_ATTENDANCE_QUERY_DOCUMENT`
    - `MEETING_ENGAGEMENT_EVENTS_QUERY_DOCUMENT`
    - `EXPORT_MEETING_TELEMETRY_CSV_MUTATION_DOCUMENT`
  - All fragments include `id` field per AGENTS (Apollo cache normalisation)
  - Run `bun codegen` to regenerate hook types
  - 4.1.QL Quality Loop
  - 4.1.IV Instruction Verification against `frontend/common/graphql/AGENTS.md` + `frontend/common/graphql/sharedDocuments/AGENTS.md` + `frontend/AGENTS.md` + `frontend.instructions.md`
  - Write outcome
  - _Requirements: REQ-4, REQ-8, REQ-9, REQ-10_

- [ ] 4.2 Build `useMeetingSurfaceContextViewModel` hook + Zustand store
  - New file: `frontend/common/views/dashboard/classes/shared/useMeetingSurfaceContextViewModel.ts`
  - State: `surfaceContext`, `loading`, `error`, `viewMode: "component" | "client"` (desktop only)
  - Methods:
    - `fetch(classInstanceId)` — calls `MEETING_SURFACE_CONTEXT_QUERY` with `fetchPolicy: 'no-cache'` (Apollo v4 ignores HTTP Cache-Control headers)
    - `setViewMode(mode)` — desktop runtime switch between Component View and Client View
    - `clearError()`
  - New Zustand store `frontend/common/stores/meetingSurfaceStore.ts` for ephemeral meeting-lifecycle state (`meetingState`, `connectionState`)
  - Success/error toasts from new `meetingSurface` translation namespace
  - 4.2.QL Quality Loop
  - 4.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-4, REQ-5_

- [ ] 4.3 Create `app/(dashboard)/dashboard/classes/[id]/meeting/page.tsx` route
  - New file: `app/(dashboard)/dashboard/classes/[id]/meeting/page.tsx` — server component
  - Auth: `RequirePermission` enforcing `MEETING_VIEW`
  - Locale server-side via `getLocale()` from `@/shared/locale/server-cookies`
  - Resolves class-instance metadata server-side (for the page `<title>` + breadcrumb)
  - Renders `<MeetingSurfacePage>` client component that picks the right tier variant via existing `ResponsiveViewSwitch`
  - 4.3.QL Quality Loop
  - 4.3.IV Instruction Verification against `app/AGENTS.md` + `frontend.instructions.md`
  - Write outcome
  - _Requirements: REQ-5_

- [ ] 4.4 Build `MeetingSurfacePage` common switcher + tier desktop/mobile variants
  - New files (mirror the predecessor plan's `EnvironmentConfigTab` tier-isolation pattern):
    - `frontend/common/views/dashboard/classes/[id]/meeting/MeetingSurfacePage.tsx` — responsive switcher
    - `frontend/desktop/views/dashboard/classes/[id]/meeting/MeetingSurfacePage.desktop.tsx`
    - `frontend/mobile/views/dashboard/classes/[id]/meeting/MeetingSurfacePage.mobile.tsx`
  - Page orchestrates: query `meetingSurfaceContext` via `useMeetingSurfaceContextViewModel`, then renders `<ZoomEmbeddedSurface>` (when `mode === "embed"`) or `<RedirectSurface>` (when `mode === "redirect"`)
  - Exit meeting affordance (Esc key + visible IconButton) on desktop; back button + toast on mobile
  - 4.4.QL Quality Loop on all 3 new files
  - 4.4.IV Instruction Verification against `frontend/views/AGENTS.md` + `frontend/desktop/AGENTS.md` + `frontend/mobile/AGENTS.md` + `frontend/AGENTS.md` + `frontend.instructions.md` + `mobile-desktop.instructions.md`
  - Write outcome
  - _Requirements: REQ-5, REQ-6_

- [ ] 4.5 Build `ZoomEmbeddedSurface` desktop tier (Component View)
  - New files:
    - `frontend/desktop/views/dashboard/classes/[id]/meeting/ZoomEmbeddedSurface.desktop.tsx`
    - `frontend/desktop/views/dashboard/classes/[id]/meeting/zoomSdkComponentView.ts` — wraps `@zoom/meetingsdk` `ZoomMtgEmbedded.createClient()` + mounts individual component widgets (gallery, chat, controls)
  - Mount once per surface: `client.init({ zoomAppRoot, language: ctx.locale, jsZoomWithoutRtc: false })`
  - Join: `client.join({ signature, meetingNumber, password, userName, obfToken? })` — do NOT pass `sdkKey`/`apiKey` (Client ID is in JWT `appKey` claim per SDK v4+)
  - Event listeners: `meeting.ended`, `connection.failure`, `user_left`, `auth_failure` → dispatch to Apollo cache + Zustand
  - "Switch to classic Zoom view" affordance: `client.destroy()` + `client = createClient()` + re-init with `jsZoomWithoutRtc: true` (Client View fallback at runtime)
  - Loading skeleton during WASM init; "Open in Zoom client" fallback on persistent failure
  - Cleanup: `client.leaveMeeting()` + `client.destroy()` on unmount via `useEffect` return
  - MUI v9 + i18n error UI per frontend instructions
  - 4.5.QL Quality Loop
  - 4.5.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-5_

- [ ] 4.6 Build `ZoomEmbeddedSurface` mobile tier (Client View)
  - New files:
    - `frontend/mobile/views/dashboard/classes/[id]/meeting/ZoomEmbeddedSurface.mobile.tsx`
    - `frontend/mobile/views/dashboard/classes/[id]/meeting/zoomSdkClientView.ts`
  - Single Client View overlay: `client.init({ zoomAppRoot, language: ctx.locale })` (no `jsZoomWithoutRtc` flag)
  - Same `client.join({ signature, meetingNumber, password, userName, obfToken? })` shape as desktop (Client View wrapper may use `passWord` casing per `ZoomMtg.join` API)
  - No "Switch to classic" affordance (mobile is always Client View)
  - Loading skeleton + "Open in Zoom client" fallback
  - Cleanup on unmount
  - 4.6.QL Quality Loop
  - 4.6.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-5_

- [ ] 4.7 Build `RedirectSurface` component
  - New file: `frontend/common/views/dashboard/classes/[id]/meeting/RedirectSurface.tsx`
  - Renders an interstitial card "Opening meeting in a new tab" + a manual "Open now" button (handles environments where `window.open` is blocked by popup rules)
  - Toasts `notifications.meeting.openedInNewTab` when redirect triggers
  - Used by desktop + mobile tiers when `mode === "redirect"` (Google Meet / Microsoft Teams / manual)
  - 4.7.QL Quality Loop
  - 4.7.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-5, REQ-6_

- [ ] 4.8 Build `MeetingJoinCard` common switcher + tier variants
  - New files:
    - `frontend/common/components/ui/display/meetingJoinCard/MeetingJoinCard.tsx`
    - `frontend/desktop/components/ui/display/meetingJoinCard/MeetingJoinCard.desktop.tsx`
    - `frontend/mobile/components/ui/display/meetingJoinCard/MeetingJoinCard.mobile.tsx`
  - Lazy-fetches `meetingSurfaceContext` on click (not on render — avoids DOSing resolver)
  - On `mode === "embed"`: `router.push("/dashboard/classes/[id]/meeting")`
  - On `mode === "redirect"`: `window.open(joinWebUrl, "_blank", "noopener,noreferrer")` + toast
  - On `MeetingUrlPendingError`: render predecessor plan's "URL pending" chip + "Retry" action
  - Hide entirely when `MEETING_VIEW` permission missing (backward compatible with predecessor plan)
  - Storybook mock stores per repo conventions (`frontend/stores/` mock-store pattern)
  - 4.8.QL Quality Loop on all 3 new files
  - 4.8.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-6_

- [ ] 4.9 Wire `MeetingJoinCard` into existing class-instance surfaces
  - Files: existing class-instance row rendering components in `frontend/common/views/dashboard/classes/` (and tier variants where the predecessor plan's Join button currently renders)
  - Replace the existing `EffectiveMeeting.joinUrl` Join affordance with `<MeetingJoinCard classInstanceId={...} />`
  - Preserve the predecessor plan's "URL pending" badge behaviour (now driven by the card's `MeetingUrlPendingError` state)
  - 4.9.QL Quality Loop on all touched files
  - 4.9.IV Instruction Verification
  - Write outcome including all components updated
  - _Requirements: REQ-6_

- [ ] 4.10 Add Storybook stories for new components
  - New file: `frontend/desktop/views/dashboard/classes/[id]/meeting/ZoomEmbeddedSurface.desktop.stories.tsx` (and mobile variant story) — covers: idle, joining, joined, meeting.ended, `connection.failure`, `WebRTCNotSupported` fallback, `setViewMode` switch
  - New file: `frontend/common/components/ui/display/meetingJoinCard/MeetingJoinCard.stories.tsx` — covers `mode: embed`, `mode: redirect`, `MeetingUrlPendingError`, `MEETING_VIEW` missing (hidden card)
  - Use mock Apollo stores per repo conventions
  - 4.10.QL Quality Loop
  - 4.10.IV Instruction Verification against Storybook conventions
  - Write outcome
  - _Requirements: REQ-12_

## Phase 5: Recording Ingest Services + Admin Recordings Sub-panel

- [ ] 5.1 Implement `ZoomRecordingIngestService` (webhook-driven)
  - New file: `backend/services/meeting/telemetry/recordings/ZoomRecordingIngestService.ts`
  - Implements `IRecordingIngestService.ingest({ classInstanceId, upstreamRecordingId, providerSlug, payload, source })`:
    - Parse payload per Zoom `recording.completed` schema; map to `ClassMeetingRecording` row shape
    - Resolve `classInstanceId` from `class_instances.providerMetadata.meetingId` (upstream meeting UUID)
    - When unmatched: `classInstanceId = null` (orphan row for admin reconciliation)
    - Call `ClassMeetingRecordingRepository.upsert(...)` keyed by `(providerSlug="zoom", upstreamRecordingId)`
  - Hybrid auth: services resolve access token via `MeetingChannelFactory.getAccessToken("zoom", hostUserId)` when polling fallback is needed
  - Unit tests with mocked `MeetingChannelFactory` + repo
  - 5.1.QL Quality Loop
  - 5.1.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-8_

- [ ] 5.2 Implement `GoogleMeetRecordingIngestService` + `MicrosoftTeamsRecordingIngestService` (event-driven + poll fallback)
  - New files:
    - `backend/services/meeting/telemetry/recordings/GoogleMeetRecordingIngestService.ts` — primary: Google Workspace Events API `recording.v2.fileGenerated` via Pub/Sub push; fallback: `conferenceRecords/{id}/recordings` REST poll. Map `driveDestination.fileId` + `shareUri` (no `playUrl`).
    - `backend/services/meeting/telemetry/recordings/MicrosoftTeamsRecordingIngestService.ts` — primary: Graph recording change notifications (encrypted rich payloads); fallback: `GET /me/onlineMeetings/{id}/recordings`. Map `recordingContentUrl` (not `downloadUrl`).
  - Both implement `IRecordingIngestService.ingest(...)` with same shape as Zoom
  - Hybrid auth via `MeetingChannelFactory.getAccessToken(slug, hostUserId)`
  - Unit tests with mocked `fetch` + `MeetingChannelFactory`
  - 5.2.QL Quality Loop
  - 5.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-8_

- [ ] 5.3 Implement recording + attendance polling scheduler (`Bun.cron`)
  - New file: `backend/services/meeting/telemetry/polling/telemetry-polling-scheduler.ts`
  - Register via `Bun.cron("*/15 * * * *", handler)` in the server bootstrap (Bun 1.3.12+ in-process cron — shares DB pools and caches with the app)
  - Single batched scheduler (not per-class-instance cron):
    - SELECT class instances whose meeting ended in the poll window
    - Recording reconciliation: Meet + Teams (Zoom is webhook-driven primary)
    - Attendance: Meet + Teams + Zoom webhook-miss fallback (Teams attendance is poll-only — no Graph webhook)
    - For each: dispatch provider-specific ingest service with `source: "poll"`
    - Respect `MEET_RECORDING_POLL_INTERVAL` + `TEAMS_RECORDING_POLL_INTERVAL` env keys
    - On 429: respect `Retry-After`, back off batch
  - 5.3.QL Quality Loop
  - 5.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-8 AC4, AC5_

- [ ] 5.4 Build admin `RecordingsSubPanel`
  - New files (extend predecessor plan's tab sub-component structure):
    - `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/subpanels/RecordingsSubPanel.tsx`
    - `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/subpanels/RecordingsSubPanel.desktop.tsx`
    - `frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/subpanels/RecordingsSubPanel.mobile.tsx`
  - MUI DataGrid with columns: `{ class title, provider, startedAt, duration, view, download, share }`
  - Filters: provider dropdown, date-range picker, matched/unmatched filter
  - CSV export button → `exportMeetingTelemetryCsv` mutation
  - "View in Zoom/Meet/Teams" outlink per row (v1 — no native in-app player)
  - Lazy-loaded via `LazyMeetingIntegrationsRecordingsTab` in `SettingsTabPanels.tsx`
  - 5.4.QL Quality Loop
  - 5.4.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-8 AC5, AC6, REQ-11_

- [ ] 5.5 Build teacher Profile per-class "Recordings" drawer
  - New file: `frontend/common/views/dashboard/profile/shared/meeting-configs/RecordingsDrawer.tsx`
  - Triggered from the predecessor plan's "View bookings using this URL" affordance (extends that link list with a Recordings drawer)
  - Reuses `CLASS_MEETING_RECORDINGS_QUERY_DOCUMENT` scoped to `classInstanceId`
  - Outlink rows + duration formatting
  - 5.5.QL Quality Loop
  - 5.5.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-8 AC6_

## Phase 6: Attendance Ingest + Admin Attendance Sub-panel

- [ ] 6.1 Implement `ZoomAttendanceIngestService` (webhook-driven)
  - New file: `backend/services/meeting/telemetry/attendance/ZoomAttendanceIngestService.ts`
  - Implements `IAttendanceIngestService.ingest(...)`:
    - For `participant.joined`: insert one row with `leaveAt: null`
    - For `participant.left`: update the latest matching row's `leaveAt` + compute `durationSecs`
    - Keyed by `(classInstanceId, upstreamParticipantId, joinAt)` — rejoin creates a new row
  - Enrich `userId` when `userEmail` matches Siraj `users.email`
  - Unit tests with mocked webhook payloads + repo
  - 6.1.QL Quality Loop
  - 6.1.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-9 AC2_

- [ ] 6.2 Implement `ZoomAttendanceReconcileService` (polling fallback)
  - New file: `backend/services/meeting/telemetry/attendance/ZoomAttendanceReconcileService.ts`
  - Runs every 15 minutes for class instances whose `participant.joined` / `participant.left` webhooks went missing
  - Pulls `GET /report/meetings/{meetingId}/participants` (granular scope `report:read:list_meeting_participants:admin`) and upserts rows
  - Hybrid auth via `MeetingChannelFactory.getAccessToken("zoom", hostUserId)`
  - 6.2.QL Quality Loop
  - 6.2.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-9 AC3_

- [ ] 6.3 Implement `GoogleMeetAttendanceIngestService` + `MicrosoftTeamsAttendanceIngestService` (poll-only)
  - New files:
    - `backend/services/meeting/telemetry/attendance/GoogleMeetAttendanceIngestService.ts` — uses `conferenceRecords/{id}/participants` + `participantSessions` sub-resources (one row per session; re-join creates new session)
    - `backend/services/meeting/telemetry/attendance/MicrosoftTeamsAttendanceIngestService.ts` — uses Graph `GET /me/onlineMeetings/{id}/attendanceReports` (poll-only; no Graph webhook for attendance). Expand `attendanceIntervals[]` per participant. Requires tenant `AllowEngagementReport` policy.
  - Both implement `IAttendanceIngestService.ingest(...)`
  - Hybrid auth via `MeetingChannelFactory.getAccessToken(slug, hostUserId)`
  - Unit tests with mocked `fetch` + `MeetingChannelFactory`
  - 6.3.QL Quality Loop
  - 6.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-9 AC4, AC5_

- [ ] 6.4 Build admin `AttendanceSubPanel`
  - New files:
    - `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/subpanels/AttendanceSubPanel.tsx`
    - `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/subpanels/AttendanceSubPanel.desktop.tsx`
    - `frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/subpanels/AttendanceSubPanel.mobile.tsx`
  - Per-class-instance breakdown with expandable rows revealing the participant list (`{ name, email, joinTime, leaveTime, duration, attentiveness }`)
  - Aggregate header row per class: total participants + average duration
  - CSV export
  - Lazy-loaded via `LazyMeetingIntegrationsAttendanceTab`
  - 6.4.QL Quality Loop
  - 6.4.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-9 AC6, REQ-11_

- [ ] 6.5 Build teacher per-class "Attendance" drawer
  - New file: `frontend/common/views/dashboard/profile/shared/meeting-configs/AttendanceDrawer.tsx`
  - Per-class-instance drawer with the same table content as the admin Attendance sub-panel but scoped to one class instance
  - "Download CSV" affordance
  - 6.5.QL Quality Loop
  - 6.5.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-9 AC7_

## Phase 7: Live Engagement Webhook Routes + Admin Engagement Sub-panel

- [ ] 7.1 Implement `ZoomEngagementIngestService`
  - New file: `backend/services/meeting/telemetry/engagement/ZoomEngagementIngestService.ts`
  - Implements `IEngagementIngestService.ingest({ classInstanceId?, eventType, eventTime, upstreamPayload, verified })`:
    - Maps upstream event type (`meeting.started`, `participant.joined`, `participant.left`, `recording.completed`, etc.) to internal `eventType` string
    - For `participant.joined` / `participant.left`: forward to `ZoomAttendanceIngestService`
    - For `recording.completed`: forward to `ZoomRecordingIngestService`
    - For unknown event types: persist with `eventType: "unknown"` + log warn
    - Append `meetings_engagement_events` row BEFORE dispatching downstream services (so ingest failures don't lose audit data)
  - 7.1.QL Quality Loop
  - 7.1.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-10_

- [ ] 7.2 Implement `app/(dashboard)/api/zoom-webhooks/route.ts`
  - New file: `app/(dashboard)/api/zoom-webhooks/route.ts`
  - Read raw body via `await req.text()` before JSON parsing (HMAC computed over raw bytes)
  - Verify HMAC-SHA256 of `v0:<timestamp>:<rawBody>` against `x-zm-signature` header using `ZOOM_WEBHOOK_SECRET_TOKEN`; `crypto.timingSafeEqual` for constant-time compare
  - Reject `timestamp` ±5 minutes from `Date.now()` (replay protection best practice)
  - For `endpoint.url_validation` event: respond within 3s with `{ plainToken, encryptedToken }` where `encryptedToken = HMAC-SHA256(plainToken, ZOOM_WEBHOOK_SECRET_TOKEN)` hex (NOT `encryptedTimestamp`)
  - For other events: append `meetings_engagement_events` row (verified: true), append to `ZoomEngagementIngestService` queue, respond 200
  - Update `middleware.ts` to skip auth on `/api/zoom-webhooks` (signature is the trust anchor)
  - Tests with sample signed payloads (real HMAC + `ZOOM_WEBHOOK_SECRET_TOKEN` override in fixtures)
  - 7.2.QL Quality Loop
  - 7.2.IV Instruction Verification against `app/AGENTS.md` + `frontend.instructions.md` + `backend.instructions.md`
  - Write outcome
  - _Requirements: REQ-10 AC2, AC3_

- [ ] 7.3 Implement `app/(dashboard)/api/meet-webhooks/route.ts`
  - New file: `app/(dashboard)/api/meet-webhooks/route.ts`
  - Verify Google Pub/Sub OIDC JWT in `Authorization` header against Google's public JWKS (`https://www.googleapis.com/oauth2/v3/certs`) via `jose.jwtVerify`
  - Verify `aud` claim matches Siraj's Pub/Sub push endpoint URL; verify `email` + `email_verified` claims match configured service account
  - Decode Pub/Sub envelope; map Workspace Events (`google.workspace.meet.recording.v2.fileGenerated`, etc.) to ingest services
  - Update `middleware.ts` to skip auth on `/api/meet-webhooks`
  - 7.3.QL Quality Loop
  - 7.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-10 AC4_

- [ ] 7.4 Implement `app/(dashboard)/api/teams-webhooks/route.ts`
  - New file: `app/(dashboard)/api/teams-webhooks/route.ts`
  - Lifecycle handshake: when `?validationToken=<token>` query param present → respond 200 with URL-decoded token as plain-text body within 10 seconds
  - For change notifications: verify `validationTokens` JWT array; decrypt `encryptedContent` for rich notifications (recording + `meetingCallEvents` — attendance is NOT webhook-deliverable)
  - Register Graph subscription with encryption certificate for rich notification payloads
  - Append `meetings_engagement_events` row, dispatch to `TeamsEngagementIngestService`
  - Update `middleware.ts` to skip auth on `/api/teams-webhooks`
  - 7.4.QL Quality Loop
  - 7.4.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-10 AC5_

- [ ] 7.5 Implement `GoogleMeetEngagementIngestService` + `MicrosoftTeamsEngagementIngestService`
  - New files:
    - `backend/services/meeting/telemetry/engagement/GoogleMeetEngagementIngestService.ts`
    - `backend/services/meeting/telemetry/engagement/MicrosoftTeamsEngagementIngestService.ts`
  - Mirror `ZoomEngagementIngestService` shape: append raw event to `meetings_engagement_events`, forward typed branches to recording / attendance ingest services
  - 7.5.QL Quality Loop
  - 7.5.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-10_

- [ ] 7.6 Build admin `EngagementSubPanel`
  - New files:
    - `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/subpanels/EngagementSubPanel.tsx`
    - `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/subpanels/EngagementSubPanel.desktop.tsx`
    - `frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/subpanels/EngagementSubPanel.mobile.tsx`
  - Live feed sortable by `{ provider, eventType, time range, matched/unmatched }`
  - Each row: time + provider + eventType + classInstance? + collapsible `<details>` for raw upstream payload (admin scope only — `RawPayloadRead` resolver-level guard returns `null` for non-admin)
  - Lazy-loaded via `LazyMeetingIntegrationsEngagementTab`
  - 7.6.QL Quality Loop
  - 7.6.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-10 AC7, REQ-11_

## Phase 8: Integration Smoke Tests

- [ ] 8.1 Add `test/integration/meeting/in-app/zoom-sdk-signature.integration.test.ts`
  - Gated by `describeLiveWhen(hasZoomMsdkConfig, ...)` — env: `ZOOM_MSDK_CLIENT_ID`, `ZOOM_MSDK_CLIENT_SECRET`
  - Test: mint one real SDK JWT signature, assert shape (`sdkKey`, `mn`, `role`, `exp` in valid `[1800, 172800]` bounds) — no actual meeting join attempted
  - Skip cleanly when env missing
  - 8.1.QL Quality Loop
  - 8.1.IV Instruction Verification against `test/integration/AGENTS.md` (if exists) + `backend/AGENTS.md` + `backend.instructions.md` + `tests.instructions.md`
  - Register in `package.json` existing `test:integration` script (auto-globbed by `run-integration-tests-parallel.ts`)
  - Write outcome
  - _Requirements: REQ-12 AC5_

- [ ] 8.2 Add `test/integration/meeting/in-app/zoom-recording.integration.test.ts`
  - Gated by `hasZoomConfig` — env: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBHOOK_SECRET_TOKEN`
  - Test: set up a test meeting, complete it, await `recording.completed` webhook against an ephemeral local listener (port 3099 default), assert recording row persisted, then call `DELETE /meetings/{id}/recordings` for upstream cleanup
  - 8.2.QL Quality Loop
  - 8.2.IV Instruction Verification
  - Write outcome noting the live-test recording IDs created (for any post-test cleanup debugging)
  - _Requirements: REQ-12 AC6_

- [ ] 8.3 Add `test/integration/meeting/in-app/webhooks-handshake.integration.test.ts`
  - Gated by existing auth config (`ZOOM_WEBHOOK_SECRET_TOKEN` + Meet Pub/Sub topic + Teams Graph subscription config)
  - Test each webhook route's handshake / signature verification end-to-end against synthetic signed payloads (not full upstream interaction)
  - 8.3.QL Quality Loop
  - 8.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-12 AC4_

## Phase 9: Knowledge Propagation & Documentation (MANDATORY Final Phase)

- [ ] 9.1 Extend `docs/services/meeting-providers.md` with In-App Embed & Telemetry sections
  - Read all files in `.ai/plans/in-app-meeting-view/outcome/` to extract the patterns, gotchas, and deployment prerequisites discovered during implementation
  - Extend `docs/services/meeting-providers.md` (created by predecessor plan Phase 9.1) with NEW sections:
    - **## In-App Embed (Zoom Meeting SDK)** — why Zoom-only, the separate Meeting SDK app type, the SDK JWT signature service pattern, Component vs Client View tier rule, OBF token resolution
    - **## Meeting Lifecycle Webhooks** — HMAC verification per provider, the endpoint validation handshakes (Zoom `endpoint.url_validation`, Meet Pub/Sub OIDC, Teams Graph validation tokens), append-only ingestion pattern
    - **## Meeting Surface Discrimination** subsection under existing adapters — `mode: "embed" | "redirect"` rule, how to add a new embeddable provider
    - **## Recording / Attendance / Engagement Telemetry** — per-provider ingest pattern (webhook vs poll), polling scheduler, admin sub-panels summary
  - Follow the docs file structure (Why → Pattern → Rules → What NOT to Do → Rollout Summary → Related Documents)
  - 9.1.QL Quality Loop on the doc file
  - 9.1.IV Instruction Verification (docs are not in instructions scope — skip IV, document in outcome)
  - Write outcome: `.ai/plans/in-app-meeting-view/outcome/9.1-docs-outcome.md`
  - Update progress: mark 9.1 `[x]`
  - _Requirements: REQ-14 AC1, AC2, AC3_

- [ ] 9.2 Update AGENTS.md files with references to the new patterns
  - Files to update:
    - `backend/services/AGENTS.md` — add "Meeting Surface & SDK Signatures (CRITICAL)" rule: "Embedded meeting joins for `zoom_oauth` MUST go through `ZoomSdkSignatureService`; never issue SDK JWTs in the front-end. See `docs/services/meeting-providers.md` for the In-App Embed pattern reference."
    - `frontend/views/AGENTS.md` — add "`ZoomEmbeddedSurface` tier rule: Component View on desktop, Client View on mobile. See `docs/services/meeting-providers.md` for the pattern reference."
    - `app/AGENTS.md` — add "Webhook routes (`/api/{zoom,meet,teams}-webhooks`) are signature-verified and MUST remain excluded from middleware auth. See `docs/services/meeting-providers.md` for the Meeting Lifecycle Webhooks pattern."
    - `backend/db/repo/AGENTS.md` — add note about `meetings_engagement_events` append-only convention (no update/delete methods on its repository)
  - 9.2.QL Quality Loop
  - 9.2.IV Instruction Verification against each AGENTS.md's own scope
  - Write outcome
  - _Requirements: REQ-14 AC4, AC5_

- [ ] 9.3 Update root `AGENTS.md` Important References section
  - File: `AGENTS.md` (root)
  - The predecessor plan's Phase 9.3 already added `docs/services/meeting-providers.md` to Important References; this task ENHANCES that entry to mention In-App Embed & Telemetry:
    - `- docs/services/meeting-providers.md - Meeting provider adapter pattern (auto Zoom/Google Meet/Microsoft Teams URL generation + in-app Zoom embed + recording/attendance/engagement telemetry)`
  - 9.3.QL Quality Loop
  - 9.3.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-14 AC7_

- [ ] 9.4 Update `.agents/instructions/backend.instructions.md` + `.agents/instructions/frontend.instructions.md`
  - File: `.agents/instructions/backend.instructions.md` — add a "Meeting Surface Adapters" subsection requiring future backend work that touches meeting join to consult `docs/services/meeting-providers.md`'s In-App Embed section. Add a mandatory rule: SDK JWT signatures MUST never be issued in the front-end.
  - File: `.agents/instructions/frontend.instructions.md` — add a "Embedded Meeting Surfaces" subsection covering the desktop (Component View) vs mobile (Client View) tier rule for `ZoomEmbeddedSurface`, plus the admin sub-panels pattern (extensions to predecessor plan's Meeting Integrations tab).
  - 9.4.QL Quality Loop
  - 9.4.IV Instruction Verification
  - Write outcome
  - _Requirements: REQ-14 AC6_

- [ ] 9.5 Final global quality gate verification
  - Run the full `bun quality-gate` lifecycle (tsgo -> biome:check -> lint -> codescene -> sonar-results)
  - Address any failures with focused subagent waves per the quality-gate skill
  - Confirm integration smokes are NOT run in the main quality-gate loop (they're env-gated and live-only)
  - Write outcome: `.ai/plans/in-app-meeting-view/outcome/9.5-quality-gate-outcome.md` with the final gate exit status
  - Update progress: mark 9.5 `[x]`
  - _Requirements: Knowledge propagation protocol_

## Phase 10: Wrap-up

- [ ] 10.1 Final user-facing summary
  - Review all `outcome/*.md` files in `.ai/plans/in-app-meeting-view/outcome/`
  - Compose a concise summary in the chat (NOT a markdown file — per AGENTS.md, agents must not create summary markdown files)
  - Confirm with the user that the feature is acceptable; surface the deployment prerequisites (admin needs to register the Zoom Meeting SDK app + populate `ZOOM_MSDK_CLIENT_ID` / `ZOOM_MSDK_CLIENT_SECRET` / `ZOOM_WEBHOOK_SECRET_TOKEN` env keys, register webhook endpoints with each provider marketplace)
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

1. **Component vs Client View on desktop default** (subtask 4.5): prefer Component View (modular widgets, customised UI but limited feature parity) as the default on desktop with a "Switch to classic Zoom view" affordance, or Client View everywhere (consistent UX, no parity issues)? Default = Component View desktop default + toggle; mobile always Client View per Zoom SDK browser matrix.

2. **Recording playback in-app** (subtask 5.4): v1 lists + outlink to "Play in Zoom/Meet/Teams" only? Or attempt native in-app iframe for Zoom `play_url` (with CORS / signed-cookie workaround)? Default = listing + outlink (v2 native iframe for Zoom).

3. **Webhook routes location** (Phase 7): confirm `app/(dashboard)/api/{zoom,meet,teams}-webhooks/route.ts` paths are acceptable (extensions of predecessor plan's `app/(dashboard)/api/oauth/<provider>/callback/route.ts` paths); the three new webhook routes are state-verified webhook handlers — they require middleware exclusion from auth role check (the provider signature is the trust anchor).

4. **Drizzle push vs migrate** (Phase 1 subtasks 1.4, 1.5, 1.6): all schema changes here are additive (new tables + indexes). Confirm we use `bun run db push` (per repo policy — push enabled for additive changes) vs generating a migration file for production deploy.

5. **`bun run db push` approval**: subtasks 1.4, 1.5, 1.6 each touch schema. Will you approve the `push` after each task ships, or want it batched at end of Phase 1?

6. **Telemetry polling scheduler** (subtask 5.3): **Resolved by research** — use `Bun.cron()` in-process API (Bun 1.3.12+) registered in server bootstrap. No external cron or `scripts/meeting-telemetry-poll.ts` needed for the Bun deployment model. Vercel Cron is a fallback only if deployed on Vercel.

7. **Attendance userEmail encryption** (Phase 1 subtask 1.5): stored as plain varchar (per design — encryption v2 deferred) or stored as `encryptedText` (custom Drizzle type, predecessor plan pattern)? Default = plain varchar (telemetry rows are not secrets, easier querying); document v2 plan in `docs/services/meeting-providers.md`.

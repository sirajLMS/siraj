# Requirements — Automatic Zoom / Google Meet / Microsoft Teams URL Generation

## Document Information

- **Feature Name**: Automatic meeting URL generation (Zoom, Google Meet, Microsoft Teams)
- **Target Directory**: `.ai/plans/auto-meeting-url`
- **Outcome Directory**: `.ai/plans/auto-meeting-url/outcome`
- **Version**: 1.0
- **Date**: 2026-07-31
- **Related Documents**:
  - [Design](./design.md)
  - [Trackable Tasks](./trackable-tasks.md)
  - [Research Outcome](./outcome/research-outcome.md)

## Introduction

Today the meeting-config catalog only supports manual URL entry: a teacher pastes a personal meeting link, validated against the provider catalog's `urlAllowlist`. For teachers running live recurring classes this is friction (they must create the meeting in Zoom/Meet/Teams, copy the link, paste it back) and a recurring source of broken/incorrect URLs.

This feature adds **automatic** URL generation: when a teacher picks an auto-capable provider (Zoom, Google Meet, Microsoft Teams), the backend calls the provider's REST API directly and persists the generated join URL — no copy/paste. It also generates a fresh URL per scheduled class instance at booking time, so each class row carries a distinct, ready-to-join link instead of a stale shared one.

To accommodate different deployment shapes (single-tenant Workspace customers vs. teachers with personal accounts), the integration supports a **hybrid** authentication model: organisation-level service credentials when available, and per-teacher OAuth when they aren't.

### Feature Summary

Add automatic meeting URL generation for Zoom (Server-to-Server OAuth), Google Meet (Meet REST API `spaces.create` with Domain-Wide Delegation), and Microsoft Teams (Microsoft Graph `onlineMeetings` with `OnlineMeetings.ReadWrite.All`), exposed via a new `IMeetingChannel` adapter/factory layer mirroring the existing `backend/services/communication/channels/` pattern.

### Business Value

- Removes the copy/paste friction for teachers booking recurring classes.
- Eliminates the "wrong URL" class of bugs (each class instance gets its own fresh link).
- Lays the foundation for calendar invitations, attendance analytics, and live engagement webhooks later.
- Three-provider support matches the existing seeded catalog (Zoom, Google Meet, Microsoft Teams) instead of forcing users off their preferred platform.

### Scope

**In scope (v1 + v2, single plan, phased):**

- Three provider adapters (Zoom S2S, Google Meet service-account + DWD, Microsoft Teams Graph application permissions).
- Hybrid authentication: organisation service credentials (Settings UI env keys) as primary, per-teacher OAuth (refresh-token storage) as fallback.
- Three UX models: silent URL generation on config-save, explicit "Generate" preview button, and URL generation at class-booking time on `class_instances`.
- New `MeetingProviderKind` discriminator + `supportsAutoGeneration` capability flag.
- `meetingUrl` becomes optional on `MeetingConfigDetails`.
- Skip URL-allowlist validation when `providerKind !== "manual"`.
- Admin Settings UI auto-discovers new `category: "meeting"` env keys (no extra UI work).
- Per-teacher OAuth consent UI, token-refresh background job, redirect-URI hook.
- Integration smoke tests against live APIs.
- Full i18n (ar + en) for all new error labels and UI copy.
- Knowledge propagation: canonical `docs/services/meeting-providers.md` + AGENTS.md/instructions updates.

**Out of scope (deferred):**

- Calendar invitations + email attendee notifications (Google Calendar `events.insert` path).
- Zoom webinar analytics / engagement heatmaps (the `.ai/todo/class-details-zoom-metadata.md` deferred feature — separate concern).
- Microsoft Graph `createOrGet` idempotent-meeting pattern (v1 uses `POST /users/{userId}/onlineMeetings`).
- In-app janus / Meeting SDK client-side join (we stay on `joinWebUrl` redirection).

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an executing agent, I want persistent task outcome tracking and progress updates so subsequent tasks do not repeat prior research.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN the system SHALL read ALL existing files in `.ai/plans/auto-meeting-url/outcome/` before any other action.
2. WHEN an executing agent completes any task THEN the system SHALL write a new outcome file under `.ai/plans/auto-meeting-url/outcome/<task-id>-outcome.md`.
3. WHEN any subtask completes THEN the system SHALL update `[ ]` -> `[x]` in `trackable-tasks.md`.
4. WHEN any file is modified THEN the system SHALL run per-file verification (`bun tsgo` + `bun biome:check` + lint queue) on that specific file before moving on.
5. WHEN any subtask completes THEN the system SHALL run a global check (`bun tsgo`, `bun biome:check`, `bun run lint`) with zero errors and zero warnings.

### Requirement 1: Provider Catalog Discriminator (Foundation)

**User Story:** As a developer, I want a `providerKind` discriminator on the `meeting_providers` catalog so that auto-generating providers can be distinguished from manual ones.

#### Acceptance Criteria

1. WHEN the catalog is read THEN the system SHALL expose a `providerKind: "manual" | "zoom_oauth" | "google_meet_oauth" | "microsoft_teams_oauth"` column on every provider row.
2. IF `providerKind !== "manual"` THEN the field `MeetingConfigDetails.meetingUrl` SHALL be optional on insert/update.
3. WHEN a provider row is created/updated THEN the system SHALL validate `providerKind` against the allowed union via Zod.
4. WHERE `providerKind = "manual"` THEN the system SHALL keep the existing `urlAllowlist` validation semantics unchanged.
5. WHEN the seed runs THEN the system SHALL set `providerKind` for the three seeded providers (`zoom`→`zoom_oauth`, `google_meet`→`google_meet_oauth`, `microsoft_teams`→`microsoft_teams_oauth`).

**Priority**: High / **Complexity**: Medium / **Dependencies**: none

### Requirement 2: IMeetingChannel Adapter Layer (Foundation)

**User Story:** As a developer, I want a pluggable adapter interface so that new meeting providers can be added without modifying the service layer.

#### Acceptance Criteria

1. WHEN a meeting needs to be generated THEN the system SHALL obtain an adapter via `MeetingChannelFactory.getMeetingChannel(providerSlug)` and never `import` an adapter directly.
2. WHEN factory credentials are missing THEN the system SHALL throw a typed error whose `code` maps to a translated message (no raw env-variable-name leakage in user-facing strings).
3. WHEN `resetMeetingChannel(slug)` is invoked THEN the system SHALL destroy the cached adapter instance and call `invalidateEnvConfigCache` for every related credential key.
4. IF a provider's `providerKind = "manual"` THEN `getMeetingChannel` SHALL throw `UnsupportedProviderKind` (no adapter for manual providers — manual is a static-URL path, not an adapter).
5. WHEN an adapter instance is constructed THEN the system SHALL resolve credentials via `resolveEnvConfigMany([...keys])` (DB-first / env-fallback), identical to `EmailChannelFactory`.

**Priority**: High / **Complexity**: Medium / **Dependencies**: REQ-1

### Requirement 3: Zoom Adapter (Server-to-Server OAuth)

**User Story:** As a teacher, I want Zoom meeting URLs generated automatically when I save a config or book a class, so that I don't have to leave the platform to create the meeting.

#### Acceptance Criteria

1. WHEN `ZoomMeetingAdapter.generateMeeting(input)` is invoked THEN the system SHALL POST to `https://zoom.us/oauth/token` with `grant_type=account_credentials` and Basic auth (base64 `clientId:clientSecret`) to obtain a bearer token.
2. WHEN the token is obtained THEN the system SHALL POST to `https://api.zoom.us/v2/users/me/meetings` with `type: 2` (scheduled meeting) and a `topic` derived from `input.topic`, returning `{ joinUrl, meetingId, password? }`.
3. WHEN the access token has <60s remaining THEN the system SHALL re-mint (token TTL = 3600s; no refresh token; the adapter caches the token in-memory until `exp - 60s`).
4. WHEN Zoom returns a non-2xx response THEN the system SHALL throw a `ZoomApiError` carrying `statusCode`, upstream `code`, and a translated message key (`errors.zoomApi.<code>`).
5. WHERE the configured scopes do not include `meeting:write:admin` and `meeting:write` THEN the system SHALL fail fast at adapter construction with a typed `InsufficientScopesError` (for visibility, not silent fallback).
6. WHEN the meeting is generated on class-booking THEN the system SHALL pass `input.startDateTime` and `input.durationMinutes` so the Zoom meeting is time-scoped.

**Priority**: High / **Complexity**: High / **Dependencies**: REQ-2

### Requirement 4: Google Meet Adapter (Service Account + Domain-Wide Delegation)

**User Story:** As a teacher on a Google Workspace tenant, I want Meet URLs generated automatically so that I don't have to create them manually.

#### Acceptance Criteria

1. WHEN `GoogleMeetAdapter.generateMeeting(input)` is invoked THEN the system SHALL mint a service-account JWT using `jose` asserting `client_email`, scope `https://www.googleapis.com/auth/meetings.space.created`, and `sub` = the impersonated Workspace user email (Domain-Wide Delegation).
2. WHEN the JWT is minted THEN the system SHALL exchange it at `https://oauth2.googleapis.com/token` (`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`) for an access token.
3. WHEN the access token is obtained THEN the system SHALL POST to `https://meet.googleapis.com/v2/spaces` with body `{ config: { accessType: 1 } }` and return `{ joinUrl: meetingUri, meetingId: space.name }`.
4. IF no `subject` (Workspace user email) is configured THEN the system SHALL throw `MissingImpersonationSubjectError` (service accounts calling as themselves return 403 on `spaces.create`).
5. WHEN the access token has <60s remaining THEN the system SHALL re-mint (in-memory cache, same as Zoom).
6. WHEN Google returns `429` THEN the system SHALL surface a `RateLimitedError` with the upstream `Retry-After` header value so the caller can back off; the Meet API quota is `100/min per project, 10/min per user`.
7. WHERE Domain-Wide Delegation is not enabled in the Workspace Admin Console THEN the system SHALL throw `PermissionDeniedError` with a translated message explaining the admin-Console prerequisite (`errors.meet.dwdNotEnabled`).

**Priority**: High / **Complexity**: High / **Dependencies**: REQ-2

### Requirement 5: Microsoft Teams Adapter (Graph Application Permissions)

**User Story:** As a teacher on a Microsoft 365 tenant, I want Teams meeting URLs generated automatically so I don't have to leave the platform.

#### Acceptance Criteria

1. WHEN `MicrosoftTeamsAdapter.generateMeeting(input)` is invoked THEN the system SHALL obtain an app-only access token via client-credentials flow against `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token` with scope `https://graph.microsoft.com/.default` and permission `OnlineMeetings.ReadWrite.All`.
2. WHEN the token is obtained THEN the system SHALL POST to `https://graph.microsoft.com/v1.0/users/{userId}/onlineMeetings` with body `{ subject, startDateTime, endDateTime }` and return `{ joinUrl: joinWebUrl, meetingId }`.
3. IF no application access policy is granted for the app id (typical initial setup failure) THEN the system SHALL throw `NoAppAccessPolicyError` carrying the Microsoft Q&A troubleshooting link in the developer message (not the user-facing message).
4. WHEN the token has <120s remaining THEN the system SHALL re-mint via client-credentials (app-only tokens are ~1h; caching same as other adapters).
5. WHERE the configured application permissions do not include `OnlineMeetings.ReadWrite.All` THEN the system SHALL fail fast at adapter construction with `InsufficientScopesError`.

**Priority**: Medium / **Complexity**: High / **Dependencies**: REQ-2

### Requirement 6: On-Save Silent Generation UX

**User Story:** As a teacher, I want to pick "Zoom (auto)" and have the URL generated silently when I save, so I don't have to click an extra Generate button.

#### Acceptance Criteria

1. WHEN a user submits a `createUserMeetingConfig` with an auto-capable provider and a blank `meetingUrl` THEN the `MeetingConfigService` SHALL call the adapter, store the returned `joinUrl` into `details.meetingUrl`, and persist `providerKind`, `password` (if returned) into `encryptedSecret`, and other returned metadata into a new `providerMetadata` JSONB column.
2. WHEN the persisted config is returned to the caller THEN the system SHALL mask `encryptedSecret` for non-admin scopes (existing `meeting-config-mask.ts` semantics extended).
3. IF generation fails THEN the system SHALL roll back the create (no partial config row persisted with a null `meetingUrl`) and return a translated error to the caller.
4. WHEN the user later views the config in the edit dialog THEN the `meetingUrl` field SHALL be read-only with a "Re-generate" affordance next to it (calls update with `meetingUrl: null`).

**Priority**: High / **Complexity**: Medium / **Dependencies**: REQ-3, REQ-4, REQ-5

### Requirement 7: Explicit "Generate" Preview Button UX

**User Story:** As a teacher, I want to see a preview of the URL before committing, so I can confirm the provider account is the right one.

#### Acceptance Criteria

1. WHEN a new GraphQL mutation `generateMeetingUrl(providerId, previewContext)` is invoked THEN the system SHALL call the adapter with a non-persisting preview call and return `{ joinUrl, expiresAt? }` to the caller.
2. WHEN the teacher clicks "Generate" in the form THEN the `useMeetingConfigsManagerViewModel` SHALL call this mutation and surface the result in the `meetingUrl` field (still editable until Save).
3. IF `previewContext` includes a `classInstanceId` THEN the system SHALL honour that context (subject, time) so the preview matches what will eventually be booked.
4. WHEN the previewed URL is rejected by the teacher (cleared) THEN the system SHALL NOT persist it (no orphan meeting on the provider side — Zoom/Delete and Meet/Delete endpoints SHOULD be called to clean up; documented as a known-bad-actor tradeoff until v2).

**Priority**: Medium / **Complexity**: Medium / **Dependencies**: REQ-6

### Requirement 8: Generation at Class-Booking Time

**User Story:** As a teacher booking a recurring class, I want each class instance to get its own fresh meeting link so attendees don't land in the previous session's room.

#### Acceptance Criteria

1. WHEN a class instance is booked with an auto-capable provider linked (via `user_meeting_configs` or `class_meeting_configs`) THEN the `MeetingConfigSnapshotService` SHALL call the adapter with `{ topic: classTitle, startDateTime, durationMinutes }` and write the returned `joinUrl` into `class_instances.meetingJoinUrl`.
2. WHEN booking fails mid-flight (adapter throws after the `class_instance` row exists) THEN the system SHALL mark the `class_instance.meetingJoinUrl` as `null` and log a `meetingGenerationFailed` event but NOT roll back the class booking itself.
3. WHEN the class is rescheduled THEN the system SHALL generate a new URL (no attempt to PATCH the upstream Zoom/Meet meeting — simpler, matches the fire-and-forget model).
4. WHEN the class is cancelled THEN the system SHALL call the provider's DELETE endpoint asynchronously (best-effort, log-only on failure) to free the upstream resource.
5. WHERE the linked provider is `providerKind = "manual"` THEN booking-time generation SHALL be skipped (use the existing `meetingJoinUrl` snapshot semantics).

**Priority**: High / **Complexity**: High / **Dependencies**: REQ-3, REQ-4, REQ-5, REQ-6

### Requirement 9: Hybrid Authentication — Organisation Credentials First, Per-User OAuth Fallback

**User Story:** As a deployment owner, I want to use organisation-level service credentials when available, but fall back to per-teacher OAuth when I don't have Workspace admin rights.

#### Acceptance Criteria

1. WHEN `resolveEnvConfigMany([...orgZoomKeys])` returns all org Zoom credentials THEN the `ZoomMeetingAdapter` SHALL use S2S OAuth (no per-user token needed).
2. IF org Zoom credentials are missing AND a per-user `meeting_provider_tokens` row exists for the actor THEN the adapter SHALL fall back to the user OAuth path (refresh-token exchange → bearer token).
3. WHEN a per-user refresh token is exchanged THEN the system SHALL persist the new access token + refresh token back to `meeting_provider_tokens` (encrypted).
4. WHEN a refresh-token exchange fails (`invalid_grant`) THEN the system SHALL throw `ProviderReauthRequiredError` and surface a "Reconnect your Zoom account" UI state to the actor.
5. WHEN a user has never completed OAuth THEN the adapter SHALL throw `NoOrgCredentialsNoUserTokenError` with a translated message directing them to either ask the admin to configure org credentials or connect their own account.

**Priority**: Medium / **Complexity**: High / **Dependencies**: REQ-3, REQ-4, REQ-5

### Requirement 10: Per-Teacher OAuth Consent UI & Token Storage

**User Story:** As a teacher, I want to connect my own Zoom/Google/Microsoft account so I can use auto-generation without admin involvement.

#### Acceptance Criteria

1. WHEN a teacher visits the Meeting Configs tab and selects an auto provider with no org credentials configured THEN the UI SHALL show a "Connect your <Provider> account" button linking to the OAuth start mutation.
2. WHEN the teacher clicks "Connect" THEN the system SHALL return an OAuth redirect URL with state, redirect to provider consent, and on callback exchange the auth code for tokens, persist `{ provider, userId, refreshToken, accessToken, expiresAt, scopes }` (encrypted) to `meeting_provider_tokens`.
3. WHEN the token table is قرآن-ised THEN the system SHALL enforce one row per `(userId, providerSlug)` and forbid duplicates via a unique partial index.
4. WHEN the teacher disconnects THEN the system SHALL DELETE the row and call the provider's token-revocation endpoint (best-effort).
5. WHERE the provider is Google Meet AND the per-user OAuth flow is used THEN the system SHALL skip Domain-Wide Delegation (user token grants `meetings.space.created` directly).

**Priority**: Medium / **Complexity**: High / **Dependencies**: REQ-9

### Requirement 11: Internationalisation

**User Story:** As an Arabic-speaking teacher, I want all new copy in Arabic.

#### Acceptance Criteria

1. WHEN a new error label is added THEN the system SHALL add it to `shared/locale/ar/errors` AND `shared/locale/en/errors` with the same key.
2. WHEN a notification label is added THEN the system SHALL add it to `shared/locale/{ar,en}/notifications`.
3. WHERE the error is upstream-provider-specific (e.g. `zoomApi.1204`) THEN the system SHALL fall back to a generic translated message rather than the upstream English string.
4. WHEN the teacher consent UI is rendered THEN the locale switcher SHALL apply (existing profile i18n wiring).

**Priority**: High / **Complexity**: Low / **Dependencies**: All adapter + UI requirements

### Requirement 12: Integration Smoke Tests

**User Story:** As a maintainer, I want live-integration smoke tests so regressions in adapter HTTP calls are caught.

#### Acceptance Criteria

1. WHEN `bun run test:integration test/integration/meeting/zoom.integration.test.ts` runs AND `ZOOM_*` env vars are set THEN the test SHALL create and delete one real Zoom meeting.
2. WHEN `bun run test:integration test/integration/meeting/google-meet.integration.test.ts` runs AND `GOOGLE_MEET_*` env vars are set THEN the test SHALL create one real Meet space (no delete endpoint exists — tolerated in test).
3. WHEN `bun run test:integration test/integration/meeting/microsoft-teams.integration.test.ts` runs AND `MS_TEAMS_*` env vars are set THEN the test SHALL create and delete one real Teams online meeting.
4. WHERE the relevant env vars are missing THEN the tests SHALL skip via `describeLiveWhen(hasXxxConfig, ...)` (no CI failure when secrets absent).
5. WHEN the integration smoke tests run THEN the system SHALL NOT call them from the regular `bun run test:services` suite.

**Priority**: Medium / **Complexity**: Low / **Dependencies**: REQ-3, REQ-4, REQ-5

### Requirement 13: Admin "Meeting Integrations" Settings Tab (credentials + live tests + per-teacher token audit)

**User Story:** As a super-admin, I want a dedicated Settings tab where I can configure each meeting provider's org-level credentials, test those credentials live (both at the auth level and via an end-to-end create-and-delete round-trip), see the resolved endpoints the adapter will hit, and audit which teachers have connected their own per-user OAuth tokens — so I can manage the meeting integration holistically without SSH-ing into the server.

#### Acceptance Criteria

1. WHEN the Settings page renders THEN a new tab "Meeting Integrations" SHALL appear as the 7th tab of `/dashboard/settings`, registered via `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts` and `SettingsTabPanels.tsx`, gated by `SETTINGS_EDIT_MEETING_INTEGRATIONS` (new permission enum entry, OR-fallback `SETTINGS_VIEW`), with NO new sidebar entry (it inherits the existing `grp_admin` → `/settings` nav item).
2. WHEN the admin opens the Meeting Integrations tab THEN the UI SHALL render a per-provider accordion (Zoom, Google Meet, Microsoft Teams) — each accordion expanded shows: (a) resolved endpoint URLs (auth token URL + meeting-API URL) the adapter will hit; (b) the org-credential fields (pre-populated from the new `category: "meeting"` env keys); (c) credential resolved-source badges (`env` vs `db override`); and (d) two Call-to-Action buttons per provider: "Check credentials" and "Test create meeting".
3. WHEN the admin clicks "Check credentials" THEN the system SHALL call a new GraphQL mutation `testMeetingProviderConnection(providerSlug: String!, mode: VALIDATE_CONFIG!)` returning `{ ok: boolean, latencyMs: number, upstreamResponseSummary: string, requiredScopes: string[], grantedScopes: string[] }` and surface the result inline under the provider panel without any side effects (no meeting created — the adapter calls a no-side-effect upstream probe: Zoom `GET /users/me`, Meet: mint token only, Teams: `GET /me`).
4. WHEN the admin clicks "Test create meeting" THEN the system SHALL call the same mutation with `mode: GENERATE_AND_DELETE` and the adapter SHALL actually `generateMeeting({topic: "[Test] Siraj integration probe - safe to delete", durationMinutes: 15})`, capture the returned `joinUrl`, then call `deleteMeeting(meetingId)` for cleanup; the UI shows `{ ok, latencyMs, testJoinUrl, deleted: boolean, upstreamResponseSummary }` and the testJoinUrl renders as a masked-with-copy chip so the admin can confirm the URL pattern visually.
5. WHEN Google Meet is the provider AND `mode: GENERATE_AND_DELETE` is used THEN the system SHALL tolerate that the Meet REST API has no `spaces.delete` endpoint — the result payload SHALL mark `deleted: false` and surface a translated note "Meet spaces auto-expire; no delete needed" so the admin understands the lifecycle difference across providers.
6. WHEN a "Test connection" call fails THEN the UI SHALL surface: typed error code, translated user-facing message, raw upstream `error` body in a collapsible `<details>` block (visible only when admin scope, never propagated to teachers), and the latency observed before failure.
7. WHEN the admin opens an Accordion section for a provider AND ≥1 user has connected a per-user OAuth token for that provider THEN the section SHALL render a per-teacher "Connected accounts" table listing: teacher name + email, connected-at timestamp, token-expiresAt, last-refreshed-at, status badge (`connected`/`expiring soon`/`reauth needed`/`revoked`), and per-row admin actions: "Revoke" (forcibly DELETE the token row + best-effort revocation call) and "View token metadata" (encrypted-payload-handled: shows scopes + expiry only, never the refresh token).
8. WHEN the admin clicks "Revoke" on a teacher's row THEN the system SHALL call a new GraphQL mutation `adminRevokeMeetingProviderToken(input: { userId, providerSlug })` gated by `SETTINGS_EDIT_MEETING_INTEGRATIONS`, which calls the provider's revocation endpoint (best-effort) AND `MeetingProviderTokenRepository.delete(userId, providerSlug)` AND writes an audit-log entry under `meeting_provider_token.revoked` category; the row is removed from the live table on success.
9. WHEN the Meeting Integrations tab loads THEN the system SHALL surface aggregate headers at the top of the page: (a) total auto providers configured (3 max for v1); (b) "Org credentials healthy" count vs "missing"; (c) per-teacher connected-accounts count and reauth-needed count; (d) last-successful-test-timestamp per provider — so admins can confirm at a glance whether the integration is healthy.
10. WHEN the admin updates an org-credential field THEN the system SHALL save via the existing `upsertEnvConfigEntry(input)` / `deleteEnvConfigEntry(key)` mutations (already wired in the Environment Config tab); the new tab's credential form is a richer per-provider view of those same `category: "meeting"` env-config rows — no second storage path, the two views stay in sync via the env-config-cache-invalidated observable.
11. WHERE the admin's session is being impersonated (`ctx.isImpersonating === true`) THEN the test/revoke mutations SHALL refuse with `ImpersonationBlockedError` (the `notImpersonating: true` authScopes qualifier — matches the existing `upsertEnvConfigEntry` pattern in `environment-config.pothos.ts:165`).
12. WHEN the admin clicks "Edit endpoints" THEN the system SHALL expose the resolved endpoint URLs as non-editable info text sourced from the running adapter's static config (not from DB), so admins can confirm which upstream API the deployment is targeting (useful for stage vs prod or for multi-region Zoom tenants where `api_url` from the token response differs from `api.zoom.us`).

**Priority**: High / **Complexity**: High / **Dependencies**: REQ-3, REQ-4, REQ-5, REQ-9, REQ-10, REQ-13-pre-existing

### Requirement 14: Teacher Profile "Meeting Configs" Section Refresh

**User Story:** As a teacher, I want my Meeting Configs Profile section to clearly distinguish auto providers from manual ones, surface per-teacher OAuth connect/disconnect state visually (including "reauth needed"), and explain how auto-generation will appear in class bookings — so I can self-serve without contacting support.

#### Acceptance Criteria

1. WHEN a teacher opens their Profile → Meeting Configs tab THEN the UI SHALL display an "Auto-generation support" callout at the top explaining the three working modes (silent-generate-on-save, preview button, booking-time generation) with link icons to the relevant admin docs.
2. WHEN an auto-capable provider is selected in the create-config dialog THEN the form fields shown SHALL: (a) hide the manual `meetingUrl` input by default; (b) show inline "Connect your <Provider> account" CTA when no org creds AND no per-user OAuth token exists for this teacher; (c) show connected-account chip ("Connected as <upstream email>, expires <date>") when a per-user token exists; (d) show a "Reconnect required" warning chip when the per-user token is in the reauth-needed state.
3. WHEN a teacher's connected OAuth token is within 7 days of expiry THEN the Profile Meeting Configs view SHALL render a warning banner above the config list directing the teacher to "Reconnect your <Provider> account" with a button that re-initiates the OAuth flow.
4. WHEN a teacher has at least one auto-generated config THEN the config list rows SHALL display a chip badge "Auto-generated" beside the URL, with a tooltip showing the upstream meeting ID + provider; clicking the badge reveals a "Re-generate" action in the row's overflow menu.
5. WHEN an auto-generated config's linked class instances exist THEN the row SHALL also surface a "View bookings using this URL" link that scrolls to a class-instance list filtered to the linked config, showing each class-instance row's `meetingJoinUrl` and a per-class "URL pending" badge when null.
6. WHERE the teacher's configured provider is manual ("manual" providerKind) THEN the existing manual-URL form flow SHALL render unchanged with no auto-generation affordances (no regression).

**Priority**: High / **Complexity**: Medium / **Dependencies**: REQ-9, REQ-10, REQ-6, REQ-13

## UX/Navigation Requirements

### Actual Codebase Routing Convention (Confirmed via Discovery)

The codebase uses a route group `app/(dashboard)/<route>/page.tsx` — there is **no** `[locale]/dashboard/admin/...` segment under `(dashboard)`; locale is read server-side via `getLocale()` from `@/shared/locale/server-cookies`. The actual admin Settings page lives at `app/(dashboard)/settings/page.tsx` and is a 6-tab `SettingsTabPanels` (general / environment / session / audit / siteContent / timezones). New generic env keys with `category: "meeting"` already auto-render in the Environment Config tab as plain rows — but plain rows alone are insufficient for our requirement for Test-Connection buttons, per-teacher token audit, and endpoint displays.

### New Route & Tab Placement

| Route / Tab / Path | Purpose | Permission | Roles with Access |
|--------------------|----------|------------|-------------------|
| `/dashboard/settings` existing page — new tab `meetingIntegrations` | Admin meeting-integration credentials + live test connection + per-teacher OAuth audit | `SETTINGS_EDIT_MEETING_INTEGRATIONS` (new) OR `SETTINGS_VIEW` (read-only fallback) | SUPER_ADMIN (primary); ACADEMY_ADMIN when granted explicitly |
| `/dashboard/profile/teacher/meeting` existing | Teacher meeting configs + auto-generation affordances + per-teacher OAuth connect/disconnect (REQ-14) | `MEETING_CONFIGS_MANAGE_OWN` | TEACHER + admins acting on themselves |
| `/dashboard/payment-catalogs?tab=meetingProviders` existing | Admin provider catalog editor — gains `providerKind` dropdown | `MEETING_PROVIDERS_MANAGE_CATALOG` | SUPER_ADMIN, ACADEMY_ADMIN |
| `app/(dashboard)/api/oauth/zoom/callback` (new) | Per-teacher OAuth callback — state-validated, middleware excluded from auth | none (state nonce) | any authenticated user |
| `app/(dashboard)/api/oauth/google-meet/callback` (new) | same | same | same |
| `app/(dashboard)/api/oauth/microsoft-teams/callback` (new) | same | same | same |

### Sidebar Navigation Integration

- **Group**: `grp_admin` (existing parent group, label `navGroupAdmin: "Administration"`).
- **Parent item**: inherits the existing `settings` sidebar item (`href: /settings`, `groupId: grp_admin`) — NO new sidebar entry.
- **Children**: none visible in the sidebar (the tab navigation lives inside the Settings page's `<SettingsTabPanels>` consumer, which lazy-loads tabs via `settingsTabs.config.ts`).
- **Mobile Bottom Nav**: no new mobile bottom-nav item (admin surfaces are desktop-primary on Siraj — mobile teachers use the Profile tab only).
- **Group permission survivor**: add `SETTINGS_EDIT_MEETING_INTEGRATIONS` to the `grp_admin` group's `permission` array in `frontend/common/views/dashboard/config/navigationConfig.ts` so the group survives `getNavItemsForPermissions` filtering when a user holds this permission only.

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| SUPER_ADMIN | Settings page 7th tab "Meeting Integrations" — per-provider credential accordions + Test Connection buttons + endpoint display + per-teacher token audit table + admin-revoke; aggregate health headers at top of page |
| ACADEMY_ADMIN (when explicitly granted) | Same as SUPERADMIN — no academy-scoping in v1 (org credentials are deployment-wide) |
| TEACHER | Profile → Meeting Configs section refresh per REQ-14: auto-provider callout, per-OAuth connect/disconnect chips, "Auto-generated" badge, "URL pending" badge on bookings, reauth-needed banner |
| PARENT / STUDENT | No change — sees only the existing `effectiveMeeting.joinUrl` Join button on class-instance views |
| SUPERVISOR | Sees "URL pending" badge on class-instance rows (existing surface) when `meetingJoinUrl` is null after booking — no new admin tabs |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Admin Meeting Integrations tab | Full accordion per provider with embedded tables (primary surface — admin features are desktop-first on Siraj per existing convention) | Tab is responsive-switcher-friendly but the layout will stack accordions vertically with horizontally-scrollable tables; full functionality preserved |
| Test Connection results | Inline collapsible `<details>` showing latency + raw upstream payload | Same, with copy-to-clipboard share-sheet instead of desktop copy chip |
| Per-teacher token audit table | Sortable, filterable table with per-row kebab menu | Stacked card list with collapsible per-row actions |
| Teacher Profile auto-generation callout | Two-column card with mode explanations | Single-column stack with link icons as inline chips |
| Connect OAuth CTA | Inline button in form dialog header | Full-width CTA at top of form dialog |

### Permission Mapping

| Component/Tab/Action | Required Permission | Source Gating |
|---------------------|---------------------|---------------|
| Meeting Integrations tab (Settings) | `SETTINGS_EDIT_MEETING_INTEGRATIONS` (new), OR `SETTINGS_VIEW` (read-only) | `SettingsTabPanels.tsx` per-tab gate + `settingsTabs.config.ts` entry |
| Update org credentials (Zoom/Meet/Teams) | `SETTINGS_EDIT_ENV` (existing — reuses existing `upsertEnvConfigEntry` mutation, same authScopes) | `environment-config.pothos.ts:165` existing `authScopes: { permission: SETTINGS_EDIT_ENV, notImpersonating: true }` |
| `testMeetingProviderConnection` mutation | `SETTINGS_EDIT_MEETING_INTEGRATIONS`, notImpersonating | new Pothos mutation `authScopes` |
| `adminRevokeMeetingProviderToken` mutation | `SETTINGS_EDIT_MEETING_INTEGRATIONS`, notImpersonating | new Pothos mutation `authScopes` |
| View per-teacher token audit read-only | `SETTINGS_EDIT_MEETING_INTEGRATIONS` OR `SETTINGS_VIEW` | new GraphQL query `meetingIntegrationConnectedAccounts(providerSlug)`, `authScopes: { loggedIn: true }` + resolver-level `assertCanViewMeetingIntegrations` (mirrors `assertCanViewEnvironmentConfig` at `environment-config.pothos.ts:108`) |
| `generateMeetingUrl` (preview — REQ-7) | `MEETING_CONFIGS_MANAGE_OWN` | existing user-scoped resolver auth |
| `connectMeetingProviderOAuth` / `disconnectMeetingProviderOAuth` (REQ-10) | `MEETING_CONFIGS_MANAGE_OWN` | existing user-scoped resolver auth |
| OAuth callback routes | none (HMAC state nonce validates identity) | middleware-excluded + route handler validates state |

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| TEACHER | Connect button, auto-generate toggle, generated URL read-only display, "Re-connect" state |
| PARENT / STUDENT | No change — sees `effectiveMeeting.joinUrl` only |
| SUPERVISOR | No change — sees class-instance join URL only |
| SUPER_ADMIN, ACADEMY_ADMIN | Admin provider catalog editor gains `providerKind` field; Settings env-config tab auto-lists new meeting keys |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Generate button placement | Inline next to URL field | Full-width CTA below provider selector |
| Connect OAuth flow | Same redirect, opens back to dialog | Same redirect, opens back to dialog (mobile-aware return path) |
| Generated URL display | Read-only text field + copy button | Tap-to-copy with native share sheet |

### Permission Mapping

| Component/Route | Required Permission | Source |
|-----------------|---------------------|--------|
| MeetingConfigsTab (existing) | `MEETING_CONFIGS_MANAGE_OWN` | `<RequirePermission>` existing |
| MeetingProviders admin tab (existing) | `MEETING_PROVIDERS_MANAGE_CATALOG` | existing |
| `generateMeetingUrl` mutation | `MEETING_CONFIGS_MANAGE_OWN` | resolver-level auth |
| `connectMeetingProviderOAuth` mutation | `MEETING_CONFIGS_MANAGE_OWN` | resolver-level auth |
| `disconnectMeetingProviderOAuth` mutation | `MEETING_CONFIGS_MANAGE_OWN` | resolver-level auth |

## Non-Functional Requirements

### Performance

- WHEN an org-credential adapter is warm THEN `generateMeeting` SHALL return in <1500ms P95 (single round trip + cached token).
- WHEN an adapter is cold (first call after deploy) THEN the first `generateMeeting` SHALL return in <3000ms P95 (token mint + meeting POST).
- WHEN per-user OAuth fallback is used THEN refresh-token exchange SHALL add <500ms P95.
- WHEN a class is booked THEN booking-time generation SHALL NOT block the booking transaction; it SHALL run after the `class_instances` row commits (out-of-band via existing dispatch pattern, retry bounded to 3).

### Security

- WHEN credentials are passed to an adapter THEN they SHALL be masked in all logs (reuse `redactSecrets` pattern from communication adapters).
- WHEN stored in DB THEN refresh tokens SHALL use the `encryptedText` custom type (already used for `encryptedSecret`).
- WHEN OAuth state is minted THEN it SHALL be a single-use HMAC-signed nonce with 10-minute TTL, validated on callback to prevent CSRF.
- WHEN an unknown state arrives at the callback THEN the system SHALL reject with 400 and not consume any token.
- WHEN a teacher disconnects a provider THEN the system SHALL call the revocation endpoint before DELETE (no leftover valid tokens).
- WHEN the bot calls the Graph API THEN the application access policy SHALL be documented in the deployment runbook (`docs/services/meeting-providers.md`).

### Reliability

- WHEN a provider API returns `5xx` THEN the adapter SHALL retry once with exponential backoff (200ms + jitter).
- WHEN a provider API returns `429` THEN the adapter SHALL surface `Retry-After` and NOT retry (caller decides).
- WHEN booking-time generation fails THEN the class booking SHALL succeed with `meetingJoinUrl = null` and a follow-up retry queue + UI badge "URL pending" so the teacher can manually regenerate.

### Usability / Accessibility

- WHEN the generated URL is shown THEN it SHALL have a "Copy" button with `aria-label` in the active locale.
- WHEN the "Connect your account" flow is launched THEN the system SHALL open the consent screen in the same tab and preserve the source-tab state in the OAuth state nonce.

## Constraints and Assumptions

### Technical

- Runtime: Bun (not Node) — adapter HTTP must use `fetch`/`undici`, no Node-only APIs.
- JWT minting: use existing `jose ^6.2.5` dependency (no SDK add).
- No new heavy SDKs (`zoomus`, `@google-apps/meet`, `@microsoft/microsoft-graph-client`) — raw `fetch` only, consistent with Resend/Twilio/FCM adapters.
- Next.js App Router — OAuth callback routes live under `app/(dashboard)/api/oauth/<provider>/callback/route.ts` (the actual dashboard route group is `app/(dashboard)/...`, NOT `app/[locale]/dashboard/...` — locale is read server-side via `getLocale()` from `@/shared/locale/server-cookies`); middleware must NOT require auth on `/api/oauth/**` (state-validated instead).
- Database: PostgreSQL via Drizzle — new `meeting_provider_tokens` table needs a migration.
- The new admin "Meeting Integrations" tab lives inside the existing `/dashboard/settings` tab panels (mirrors `SettingsTabPanels.tsx` + `settingsTabs.config.ts`), inherited sidebar placement from `grp_admin` → `settings` — NO new sidebar entry.

### Business

- Org credentials require admin involvement (Workspace DWD for Meet, App Access Policy + Entra app for Teams). The deployment runbook MUST document prerequisites.
- Per-user OAuth is the fallback path and is not optional — Workspace-DWD is an admin gate some customers won't cross.
- The admin Meeting Integrations tab is desktop-primary on Siraj (matches existing convention for admin Settings) — the responsive mobile variant is best-effort and may delegate v2 polish to a follow-up.

### Assumptions

- Teachers using auto-generation have a valid account on the target provider.
- The deploying organisation owns a Zoom App Marketplace S2S app, a GCP project with the Meet API enabled, OR a Microsoft Entra app registration — depending on which adapters they enable.
- Booking-time generation is acceptable as a non-blocking best-effort path (matches the existing frozen-snapshot model).

## Success Criteria

### Definition of Done

- [ ] All 14 requirements' acceptance criteria met.
- [ ] All NFRs satisfied.
- [ ] Integration smoke tests pass when creds present, skip when absent.
- [ ] Quality gate (`bun quality-gate`) exits clean.
- [ ] `docs/services/meeting-providers.md` published; AGENTS.md/instructions updated (Phase 7).
- [ ] Both ar + en locale files updated and compile-time validated.
- [ ] Admin Meeting Integrations tab reachable via `/dashboard/settings?tab=meetingIntegrations` and all Test-Connection + per-teacher audit flows working per REQ-13.
- [ ] Teacher Profile Meeting Configs section refresh per REQ-14 visible.

### Acceptance Metrics

- P95 generation latency <1500ms warm (org path), <3000ms cold.
- Booking-time generation failure rate <1% (capped retry, manual regenerate available).
- Zero user-visible leaked env-var names in error strings (translated messages only).
- Test coverage: 100% on adapter unit tests (mocked HTTP), integration smokes live-only.

## Glossary

| Term | Definition |
|------|------------|
| `providerKind` | Catalog discriminator: `manual`/`zoom_oauth`/`google_meet_oauth`/`microsoft_teams_oauth` |
| S2S OAuth | Zoom Server-to-Server OAuth — 2-legged, no user consent, account_credentials grant |
| Domain-Wide Delegation (DWD) | Google Workspace feature letting a service account impersonate a Workspace user |
| App Access Policy | Microsoft 365 PowerShell construct that grants an Entra app permission to create online meetings on behalf of a user |
| `IMeetingChannel` | The new adapter interface mirroring `IEmailChannel`/`ISmsChannel`/`IPushChannel` |
| `MeetingConfigSnapshot` | Frozen copy of a config captured at booking time for join stability |
| `meeting_provider_tokens` | New per-user encrypted-token table for OAuth fallback |

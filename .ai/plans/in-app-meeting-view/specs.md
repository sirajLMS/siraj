# Requirements — In-App Meeting View (Zoom Meeting SDK embed + recording/attendance/engagement telemetry)

## Document Information

- **Feature Name**: In-App Meeting View — Zoom Meeting SDK embed + recording/attendance/engagement telemetry
- **Target Directory**: `.ai/plans/in-app-meeting-view`
- **Outcome Directory**: `.ai/plans/in-app-meeting-view/outcome`
- **Version**: 1.1
- **Date**: 2026-08-01
- **Research verification**: 2026-08-01 — Zoom / Google Meet / Microsoft Teams / Next.js-Bun patterns confirmed via parallel deep-research subagents (see design.md §Research Verification Summary)
- **Related Documents**:
  - [Design](./design.md)
  - [Trackable Tasks](./trackable-tasks.md)
- **Predecessor Plan**: [auto-meeting-url](../auto-meeting-url/specs.md) — **MUST be 100% complete (`[x]` across `trackable-tasks.md`) before any task in this plan starts**.

## Introduction

Once the auto-meeting-url plan lands, teachers booking classes through Siraj will receive a fresh, ready-to-join `joinWebUrl` per `class_instances` row, plus persisted `providerMetadata.meetingId`. Today the only way to join is to click that URL — the user is bounced out of Siraj into the Zoom / Google Meet / Microsoft Teams web client or native app. For teachers that friction is acceptable; for students and supervisors attending a recurring class it is jarring, breaks the single-app classroom paradigm, and forces them to authenticate in a second system before re-entering Siraj to look at recordings or attendance later.

This feature adds an **in-app meeting surface** for the only provider that supports it — **Zoom**, via the Zoom Meeting SDK for Web (`@zoom/meetingsdk`, a WebAssembly module). Google Meet and Microsoft Teams **cannot be embedded** in third-party web UIs (Google explicitly refuses `meet.google.com` iframe connections and only offers the inverse Meet Add-ons SDK; Microsoft similarly only offers Teams Live Share for apps already inside the Teams client). For those two providers we keep the existing "open `joinWebUrl` in a new tab" behaviour.

Around the embed surface we also add a full **meeting lifecycle telemetry layer** across all three providers:

- **Recordings** — pull recording lists from each provider's REST API and surface an in-app recordings library per class instance.
- **Attendance** — pull per-participant join/leave/duration rows from each provider's reporting API (Zoom `report/meetings/{id}/participants`, Meet `conferenceRecords` API, Teams Graph attendance reports).
- **Live engagement webhooks** — append-only capture of Zoom Marketplace events (`meeting.started`, `participant.joined`, etc.), Meet Pub/Sub, and Teams Graph change notifications.

The result: Siraj becomes the single pane of glass for class meetings — Join (embedded or redirect), Recording playback, Attendance audit, and live Engagement feed — without requiring the user to ever leave the app for Zoom.

### Feature Summary

Add an in-app meeting view embedded via the Zoom Meeting SDK (Client/Component View), plus full lifecycle telemetry (recordings, attendance, engagement webhooks) across Zoom, Google Meet, and Microsoft Teams. Zoom classes join inside Siraj; Meet and Teams classes redirect to `joinWebUrl`. All three providers contribute recording, attendance, and engagement data to a unified admin Meeting Integrations surface.

### Business Value

- Eliminates the "leave Siraj / authenticate in the provider / come back to Siraj" cycle for every Zoom class.
- Compresses class-start time: the meeting pre-loads inside the dashboard route while the teacher opens materials.
- Single pane of glass for post-class review: recording playback, attendance audit, and engagement timeline all live inside Siraj, indexed by `class_instances.id`.
- Foundations for later features: gated attendance rollups (academic reporting), engagement-based intervention alerts (per student).
- Aligns with competitor LMS bundles (Zoom-on-Moodle, vembedded-Meet-on-Class) while staying honest about provider asymmetry — we surface the limitation rather than hiding it.

### Scope

**In scope (v1, single plan, phased):**

- `IMeetingSurface` abstract layer + adapters per provider; only the Zoom adapter declares `mode: "embed"` (Client View on mobile, Component View on desktop); Meet / Teams / manual adapters declare `mode: "redirect"`.
- New `MeetingSurfaceContext` GraphQL query `meetingSurfaceContext(classInstanceId)` returning everything the front-end needs to render the right surface (SDK signature, meeting number, password, OBF token when external, role per actor).
- New `ZoomSdkSignatureService` that mints the SDK JWT signature server-side using a separate Zoom Meeting SDK app's Client ID + Secret (never the S2S OAuth credentials).
- New `ZoomObfTokenService` that resolves an OBF token (or ZAK fallback) for external meetings — required by Zoom from **March 2, 2026** (readiness deadline Feb 23, 2026).
- New `class_meeting_recordings` table populated from per-provider ingest services (Zoom `recording.completed` webhook; Meet via Google Workspace Events API + Pub/Sub push with polling fallback; Teams via Graph change notifications + polling fallback), surfaced on the admin Meeting Integrations tab + per-class-instance Recordings drawer.
- New `class_meeting_attendance` table populated for Zoom via `participant.joined` / `participant.left` webhooks and for Meet/Teams via REST pull of attendance reports.
- New `meetings_engagement_events` append-only table populated by three new webhook routes (`app/(dashboard)/api/{zoom,meet,teams}-webhooks/route.ts`).
- Admin Meeting Integrations tab extension with three sub-panels: Recordings, Attendance, Live Engagement.
- Teacher Profile meeting section refresh: per-class-instance "Recordings" and "Attendance" drawers.
- New permission `MEETING_VIEW` gating surface-context access.
- Hybrid credential resolution reuses `MeetingChannelFactory` + `meeting_provider_tokens` from the predecessor plan; recordings/attendance services resolve per-actor tokens the same way.
- Integration smokes for the Zoom signature service + recording/attendance pulls; env-gated and live-token only.
- Full i18n (ar + en) for all new copy.
- Knowledge propagation: extend `docs/services/meeting-providers.md` (produced by auto-meeting-url Phase 9) with In-App Embed & Telemetry sections; update AGENTS.md files and instructions.

**Out of scope (deferred):**

- In-app recording editor / clip-maker / transcription viewer (capture only — listing and outlink playback are sufficient for v1).
- Live engagement metric dashboard visualisations beyond a sortable table feed (charts/heatmaps come later).
- A 4th in-app embeddable provider (Jitsi self-host) — explicitly user-rejected.
- Recording upload to a Siraj-owned storage backend (we continue stream via provider `play_url`).
- Real-time transcript overlay during the live meeting.
- Mobile-native SDK wrappers (`@zoom/meetingsdk` runs in mobile browsers via Client View; a native wrapper is a later iteration).

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an executing agent, I want persistent task outcome tracking and progress updates so subsequent tasks do not repeat prior research.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN the system SHALL read ALL existing files in `.ai/plans/in-app-meeting-view/outcome/` before any other action.
2. WHEN an executing agent completes any task THEN the system SHALL write a new outcome file under `.ai/plans/in-app-meeting-view/outcome/<task-id>-outcome.md`.
3. WHEN any subtask completes THEN the system SHALL update `[ ]` -> `[x]` in `trackable-tasks.md`.
4. WHEN any file is modified THEN the system SHALL run per-file verification (`bun tsgo` + `bun biome:check` + lint queue) on that file before moving on.
5. WHEN any subtask completes THEN the system SHALL run a global check (`bun tsgo`, `bun biome:check`, `bun run lint`) with zero errors and zero warnings.
6. WHERE the predecessor plan (`.ai/plans/auto-meeting-url/trackable-tasks.md`) has any task still `[ ]` or `[~]` THEN this plan's tasks SHALL refuse to start and the agent SHALL report "blocked by predecessor plan" in the outcome directory.

### Requirement 1: Zoom Meeting SDK App Type + Env Keys (Foundation)

**User Story:** As a deployment owner, I want a separate Zoom Meeting SDK app registration and env keys so the in-app embedded view can issue SDK JWT signatures without reusing the S2S OAuth credentials.

#### Acceptance Criteria

1. WHEN the deployment is configured THEN the system SHALL register env keys `ZOOM_MSDK_CLIENT_ID`, `ZOOM_MSDK_CLIENT_SECRET`, and `ZOOM_MSDK_OBF_ENABLED` (default `false`) in `backend/lib/env-config-keys.ts` under `category: "meeting"`, all `isSecret: true` except `ZOOM_MSDK_OBF_ENABLED` (boolean flag `isSecret: false`).
2. WHEN the Settings Environment Config tab renders THEN the system SHALL auto-discover these keys (existing behaviour — no extra UI work) and the admin can populate them.
3. WHEN the recording webhook route is registered with Zoom Marketplace THEN the system SHALL also register `ZOOM_WEBHOOK_SECRET_TOKEN` (`isSecret: true`) used for HMAC verification of inbound events.
4. WHERE `ZOOM_MSDK_CLIENT_ID` is missing THEN the `ZoomSdkSignatureService` SHALL throw a typed `MissingMeetingSdkCredentialsError` mapped to `errors.meetingSdk.missingCredentials` (no env-variable-name leakage in user-facing strings).
5. WHERE an admin attempts to set `ZOOM_MSDK_CLIENT_ID` equal to the existing S2S OAuth `ZOOM_CLIENT_ID` THEN the env-config upsert mutation SHALL accept it (no cross-validation in v1) but the canonical doc SHALL warn against this — the two app types cannot mint each other's tokens.

#### Additional Details

- **Priority**: High / **Complexity**: Low / **Dependencies**: none (predecessor plan's env-config-keys infra already in place)
- **Assumptions**: Admin will register a Zoom Meeting SDK app type in Zoom App Marketplace separately (documented in the deployment runbook produced by REQ-14).

### Requirement 2: ZoomSdkSignatureService (Server-Side JWT Mint)

**User Story:** As a teacher joining a Zoom class, I want the SDK join signature minted server-side so my SDK Client Secret is never shipped to my browser.

#### Acceptance Criteria

1. WHEN `meetingSurfaceContext(classInstanceId)` is invoked for a Zoom `class_instance` THEN the `ZoomSdkSignatureService.sign({ meetingNumber, role, actorUserId })` SHALL mint a JWT with payload `{ appKey: ZOOM_MSDK_CLIENT_ID, sdkKey: ZOOM_MSDK_CLIENT_ID, mn: meetingNumber, role: 0|1, iat: now-30s, exp: iat+1800, tokenExp: exp }` signed with `ZOOM_MSDK_CLIENT_SECRET` via `jose` using `HS256`. (`appKey` is the canonical Zoom docs field; include both `appKey` and `sdkKey` with the same value for cross-platform compatibility per [Zoom signature troubleshooting](https://developers.zoom.us/blog/troubleshooting-meeting-sdk-signature-validation/).)
2. WHEN the JWT is minted THEN `exp - iat` SHALL be in `[1800, 172800]` seconds (Zoom's documented bounds — 30 min minimum, 48 h maximum).
3. WHEN the signature request for the same `(actorUserId, meetingNumber, role)` repeats within a 30-minute window THEN the service SHALL return a cached signature instead of re-minting (per-meetingNumber+role+userId memoisation, TTL = `exp - 60s`).
4. WHEN a cache miss occurs THEN the service SHALL mint under a race-safe promise (only one mint in flight per cache key; concurrent callers await the same promise).
5. WHEN `resetZoomSdkSignatureCache(meetingNumber?)` is invoked THEN the service SHALL clear the in-memory cache (used by `resetMeetingChannel` invalidation flows).
6. WHERE the actor is determined to be the meeting host/owner (linked class teacher or schedule owner) THEN `role` SHALL be `1`; otherwise `role` SHALL be `0` (attendee).
7. WHERE `ZOOM_MSDK_CLIENT_SECRET` is missing THEN the service SHALL throw `MissingMeetingSdkCredentialsError` and never fall back to the S2S OAuth client secret.
8. WHEN the signed JWT is returned to the GraphQL resolver THEN the resolver SHALL expose it as `meetingSurfaceContext.sdkSignature` (string) AND the front-end `useMeetingSurfaceContextViewModel` hook SHALL query with `fetchPolicy: 'no-cache'` (Apollo Client v4 does **not** auto-respect HTTP `Cache-Control` headers — confirmed [Apollo #7796](https://github.com/apollographql/apollo-client/issues/7796)). The resolver SHOULD still set `cacheControl: { scope: "Private", maxAge: 0 }` for HTTP-layer intermediaries.

#### Additional Details

- **Priority**: High / **Complexity**: Medium / **Dependencies**: REQ-1

### Requirement 3: ZoomObfTokenService (External Meeting Token)

**User Story:** As an external participant (outside the host's Zoom tenant) joining an in-app-embedded Zoom meeting, I want an OBF token resolved server-side so I can join cross-tenant meetings after Zoom's March 2026 enforcement date.

#### Acceptance Criteria

1. WHEN `ZOOM_MSDK_OBF_ENABLED` is `true` AND the actor is external to the host tenant THEN the `ZoomObfTokenService.resolve({ meetingNumber, actorUserId })` SHALL call `GET https://api.zoom.us/v2/users/{userId}/token?type=onbehalf&meeting_id={meeting_id}` (requires `user:read:token` scope on the host's S2S OAuth app) with the host's access token to obtain an OBF token bound to the actor identity. `obfToken` and `zak` are mutually exclusive in `client.join()`.
2. WHERE the per-actor has a `meeting_provider_tokens` row for `"zoom"` (per-user OAuth fallback established in the predecessor plan) THEN the service SHALL use that user's access token instead of the org S2S token.
3. WHEN OBF enrichment fails (Zoom returns 4xx) THEN the service SHALL throw typed `ZoomObfTokenError` whose code maps to `errors.zoomSdk.obfFailed` AND fall back gracefully — the front-end receives `obfToken: null` and the join attempt itself surfaces the upstream error code from the SDK; admin scope sees the developer message.
4. WHEN `ZOOM_MSDK_OBF_ENABLED` is `false` (default) THEN the service SHALL short-circuit and return `null` (legacy same-tenant behaviour preserved).
5. WHEN the OBF token is fetched THEN the service SHALL cache it in-memory for the shorter of (token TTL − 120 s) or 30 minutes, keyed by `(meetingNumber, actorUserId)`.
6. WHERE the meeting is internal (same-tenant join) THEN the service SHALL return `null` and the front-end SHOULD join with `zak: undefined` (Zoom SDK tolerates this for internal meetings as of Aug 2026).

#### Additional Details

- **Priority**: Medium / **Complexity**: Medium / **Dependencies**: REQ-1, REQ-2, predecessor plan Phase 2 (Zoom S2S adapter) + Phase 5 (per-user tokens)
- **Assumptions**: The Zoom tenant has the OBF endpoint enabled in Marketplace org settings (documented in the runbook).

### Requirement 4: MeetingSurfaceContext GraphQL Query

**User Story:** As a joining user, I want a single GraphQL query returning everything the front-end needs to render the right meeting surface (Embedded Zoom View vs redirect) so I don't issue multiple round trips.

#### Acceptance Criteria

1. WHEN `meetingSurfaceContext(classInstanceId: UUID!)` is invoked THEN the resolver SHALL look up the `class_instances` row, resolve the linked `MeetingProvider` via `class_meeting_configs` (or fallback to `user_meeting_configs`), and return a `MeetingSurfaceContext` object.
2. WHEN the linked provider's `providerKind === "zoom_oauth"` THEN the resolver SHALL populate `{ mode: "embed", providerSlug: "zoom", meetingNumber, password?, sdkSignature, obfToken?, joinWebUrl, userName, role, externalMeeting }`.
3. WHEN the linked provider's `providerKind ∈ { "google_meet_oauth", "microsoft_teams_oauth", "manual" }` THEN the resolver SHALL return `{ mode: "redirect", providerSlug, joinWebUrl, userName }` and skip SDK signature mint entirely.
4. WHERE `class_instances.meetingJoinUrl` is null (booking-time generation pending per predecessor plan REQ-8) THEN the resolver SHALL throw typed `MeetingUrlPendingError` mapped to `errors.meeting.urlPending` and the front-end SHOULD poll or render the "URL pending" badge from the predecessor plan.
5. WHERE the actor is neither the linked class teacher, nor an enrolled student/parent, nor an admin THEN the resolver SHALL throw `UNAUTHORIZED` (resolver-level auth) — see REQ-7 for the new permission.
6. WHEN the response is built THEN the resolver SHALL set the GraphQL `cacheControl` scope to `private` and `maxAge: 0` (no Apollo cache normalisation of join signatures) — implements the `no-store` requirement from REQ-2 AC8.

#### Additional Details

- **Priority**: High / **Complexity**: Medium / **Dependencies**: REQ-2, REQ-3, predecessor plan Phase 3.4 (booking-time `providerMetadata.meetingId`)

### Requirement 5: Zoom Embedded Surface Component (Desktop + Mobile)

**User Story:** As a student joining a Zoom class, I want to see the Zoom meeting render inside Siraj's `/dashboard/classes/[id]/meeting` route rather than being bounced to a third-party client.

#### Acceptance Criteria

1. WHEN the `ZoomEmbeddedSurface` common component mounts AND `meetingSurfaceContext.mode === "embed"` THEN the desktop tier (`frontend/desktop/...`) SHALL render the Zoom SDK **Component View** via `ZoomMtgEmbedded.createClient()` + `client.init({ zoomAppRoot, language: ctx.locale })` + `client.join({ signature, meetingNumber, password, userName, obfToken? })`. The SDK Client ID (`appKey`/`sdkKey`) MUST be embedded in the JWT payload only — **do not** pass `sdkKey`/`apiKey` to `client.join()` (removed in Meeting SDK v4.0.0 per [JoinOptions](https://marketplacefront.zoom.us/sdk/meeting/web/components/interfaces/JoinOptions.html)). Component View uses `password` (lowercase); Client View (`ZoomMtg.join`) uses `passWord` — tier-specific wrappers handle this.
2. WHEN the same context mounts on the mobile tier (`frontend/mobile/...`) THEN it SHALL render the Zoom SDK **Client View** instead, because the Zoom docs state Component View is desktop-only.
3. WHEN the SDK emits `meeting.ended`, `connection.failure`, or `user_left` events THEN the surface SHALL dispatch a `meetingEnded` Apollo mutation that updates the local cache for the linked `class_instances` row (`meetingState = "ended"`) AND redirects to `/dashboard/classes/[id]` showing the post-class drawer with the "Recording will appear shortly" affordance.
4. WHEN the SDK emits an auth failure (signature invalid, OBF invalid, scope insufficient) THEN the surface SHALL render an error card with the typed error code translated via `errors.zoomSdk.<code>` AND a "Retry join" action that re-fetches `meetingSurfaceContext`.
5. WHERE the user toggles the "Switch to classic Zoom view" affordance on desktop (REQ-15 open question resolves default) THEN the surface SHALL switch from Component View to Client View at runtime without leaving the route (the SDK supports swapping via `client.destroy()` then re-init).
6. WHEN the embedded surface unmounts (route change, tab close) THEN the surface SHALL call `client.leaveMeeting()` and dispose the WASM instance to prevent memory leaks.
7. WHEN `meetingSurfaceContext.obfToken` is non-null AND the SDK `client.join` requires it (Zoom external meetings after Feb 2026) THEN the surface SHALL pass `obfToken` to the join call.
8. WHEN the SDK reports a `WebRTCNotSupported` error (Firefox has no WebRTC video per [Zoom browser support](https://developers.zoom.us/docs/meeting-sdk/web/browser-support/) — it falls back to WebAssembly video, which may still fail on some configurations) THEN the surface SHALL render the fallback "Open in Zoom client" deep link preserved from the predecessor plan's `joinWebUrl`, with an explanatory translated note.

#### Additional Details

- **Priority**: High / **Complexity**: High / **Dependencies**: REQ-4, REQ-2, REQ-3

### Requirement 6: MeetingJoinCard Common Switcher

**User Story:** As a class attendee looking at a class-instance row in Siraj, I want the "Join" button to know whether to launch the embedded surface or redirect to a new tab — and to do the right thing per provider.

#### Acceptance Criteria

1. WHEN the existing `EffectiveMeeting` "Join" affordance renders on class-instance rows THEN it SHALL delegate to a new common `MeetingJoinCard` component that queries `MEETING_SURFACE_CONTEXT_QUERY` (lazy, runs only on click) per row.
2. WHEN the join affordance is clicked AND `meetingSurfaceContext.mode === "embed"` THEN the card SHALL navigate to `/dashboard/classes/[classInstanceId]/meeting` (in-app route; preserves scroll position via Next.js back behaviour).
3. WHEN the join affordance is clicked AND `meetingSurfaceContext.mode === "redirect"` THEN the card SHALL call `window.open(joinWebUrl, "_blank", "noopener,noreferrer")` AND surface a transient toast "Opening meeting in a new tab".
4. WHEN `meetingSurfaceContext` resolves with `MeetingUrlPendingError` THEN the card SHALL render the "URL pending" chip from the predecessor plan's Phase 4.6 and offer a "Retry" action.
5. WHERE the actor does not hold `MEETING_VIEW` permission (per REQ-7) THEN the card SHALL be hidden entirely — backward compatible with predecessor plan's role gating.
6. WHEN the `MeetingJoinCard` is used in a Storybook story THEN it SHALL mock `useMeetingSurfaceContextViewModel` per `frontend/stores/` mock-store convention.

#### Additional Details

- **Priority**: High / **Complexity**: Medium / **Dependencies**: REQ-4, REQ-7, predecessor plan Phase 4.6 ("URL pending" badge)

### Requirement 7: MEETING_VIEW Permission

**User Story:** As an admin, I want a dedicated `MEETING_VIEW` permission so I can grant access to in-app meeting join + recording/attendance read without granting the heavier `MEETING_CONFIGS_MANAGE_OWN`.

#### Acceptance Criteria

1. WHEN `backend/enum/permissions/permission.enum.ts` is updated THEN the new enum entry `MEETING_VIEW = "meeting.view"` SHALL appear in the meeting permission cluster (mirrors existing `MEETING_*` enums).
2. WHEN `frontend/common/types/page-permissions.types.ts` is updated THEN the entry `meetingView: [AppPermission.MEETING_VIEW] as PagePermissions` SHALL be added.
3. WHEN the `/dashboard/classes/[id]/meeting` route renders THEN the page SHALL be gated by `RequirePermission` enforcing `MEETING_VIEW`.
4. WHEN the admin Meeting Integrations tab is granted to a role THEN it SHALL additionally grant `MEETING_VIEW` so the recordings/attendance sub-panels can stream.
5. WHEN a teacher is granted `MEETING_CONFIGS_MANAGE_OWN` (existing — to manage their own configs per predecessor plan) THEN they SHALL automatically hold `MEETING_VIEW` (implied permission rule added to `assertCanViewMeeting` resolver-level helper).
6. WHERE the actor only holds `MEETING_VIEW` (and not `MEETING_CONFIGS_MANAGE_OWN`) THEN the actor CAN join meetings and read recordings/attendance but CANNOT create or edit meeting configs.

#### Additional Details

- **Priority**: High / **Complexity**: Low / **Dependencies**: predecessor plan Phase 5.1 (SETTINGS_EDIT_MEETING_INTEGRATIONS permission pattern)

### Requirement 8: Recordings Telemetry

**User Story:** As a teacher reviewing a past class, I want its recording surfaced inside Siraj under the class instance — listing with playback + download — so I don't have to log into Zoom/Meet/Teams separately to find it.

#### Acceptance Criteria

1. WHEN a new recording appears THEN the system SHALL persist a row in the `class_meeting_recordings` table with columns `{ id (uuid pk), classInstanceId (fk -> class_instances.id onDelete cascade), providerSlug, upstreamRecordingId, topic, startedAt, durationSecs, playUrl?, downloadUrl?, shareUrl?, password?, recordingFiles (jsonb array of file metadata), source (webhook | poll), createdAt, updatedAt }`.
2. WHEN the Zoom `recording.completed` webhook arrives THEN the `ZoomRecordingIngestService.onRecordingCompleted(payload)` SHALL upsert the recording row keyed by `providerSlug="zoom"` + `upstreamRecordingId`, persisting `download_url`/`play_url`/`share_url` from `recording_files[]` and using the root-level `download_token` (expires **24 hours** — ingest MUST persist URLs before expiry).
3. WHEN a Google Meet `google.workspace.meet.recording.v2.fileGenerated` event arrives via Google Workspace Events API → Pub/Sub push (primary path) THEN the `MeetRecordingIngestService` SHALL upsert the recording row keyed by `providerSlug="google_meet"` + upstream recording ID. WHEN the `MeetRecordingPollingService` runs on its schedule (default every 15 minutes; configurable via `MEET_RECORDING_POLL_INTERVAL`) THEN it SHALL list `conferenceRecords/{id}/recordings` for recent class instances and backfill any missing rows (polling is the fallback, not the only path).
4. WHEN a Teams recording change notification arrives via Graph subscription (`communications/onlineMeetings/getAllRecordings` or meeting-level recordings resource) THEN the `TeamsRecordingIngestService` SHALL upsert the row. WHEN the `TeamsRecordingPollingService` runs on its schedule (default every 15 minutes) THEN it SHALL call Graph `GET /me/onlineMeetings/{id}/recordings` and persist matching rows using `recordingContentUrl` (not `downloadUrl` — per [callRecording resource](https://learn.microsoft.com/en-us/graph/api/resources/callrecording?view=graph-rest-1.0)).
5. WHEN the admin Meeting Integrations Recordings sub-panel renders THEN it SHALL show a sortable table per `classInstanceId` with columns `{ class title, provider, startedAt, duration, view action, download action, share action }`.
6. WHEN the teacher opens the per-class-instance "Recordings" drawer THEN it SHALL show the same table scoped to that class instance, AND each row SHALL expose a "Play in app" affordance that opens Zoom's `play_url` in a modal iframe (when Zoom allows embedding) or falls back to "Open in Zoom/Meet/Teams" outlink (when iframe embedding is blocked, e.g. for Meet recordings).
7. WHERE the provider is Google Meet AND the recording has no `playUrl` (Meet `conferenceRecords.recordings` returns only `driveDestination.fileId` + `shareUri` — no `playUrl` per [recordings resource](https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.recordings)) THEN the sub-panel SHALL show "Open in Drive" outlink using the Drive `fileId` or `shareUri`.
8. WHEN a recording's upstream retention expires (Zoom 30-day default; Teams configurable) THEN the polling services SHALL detect a 410 Gone and mark the row `state: "expired"` (new enum column) without deleting it — historical rows preserve audit trail.
9. WHERE a `recording.completed` webhook arrives for a `classInstanceId` that does not match any in-app class instance (orphan via shared Zoom account) THEN the ingest service SHALL persist the row with `classInstanceId = null` and the admin Recordings sub-panel SHALL show an "unmatched" badge so an admin can manually link it.

#### Additional Details

- **Priority**: Medium / **Complexity**: High / **Dependencies**: predecessor plan Phase 2 (adapters) + Phase 5 (admin Meeting Integrations tab)
- **Assumptions**: Recording auto-deletion policies are configured per provider tenant — Siraj is read-only on retention.

### Requirement 9: Attendance Telemetry

**User Story:** As a supervisor overseeing a class, I want a per-participant attendance breakdown (join/leave/duration) per class instance so I can audit engagement and follow up with absent students.

#### Acceptance Criteria

1. WHEN attendance data is captured THEN the system SHALL persist rows in the `class_meeting_attendance` table with columns `{ id (uuid pk), classInstanceId (fk onDelete cascade), providerSlug, upstreamParticipantId, displayName, userEmail?, joinAt (timestamptz), leaveAt (timestamptz?), durationSecs, attentiveness?, source, createdAt, updatedAt }`.
2. WHEN the Zoom `participant.joined` and `participant.left` webhooks arrive THEN the `ZoomAttendanceIngestService` SHALL upsert attendance rows keyed by `(classInstanceId, upstreamParticipantId, joinAt)` — a participant who rejoins creates a new row per session.
3. WHEN the Zoom polling fallback runs (every 15 minutes, default) for class instances whose webhook events went missing THEN the service SHALL pull `GET /report/meetings/{meetingId}/participants` (granular scope `report:read:list_meeting_participants:admin` — legacy `report:read:admin` is deprecated) and reconcile rows.
4. WHEN the `MeetAttendanceIngestService` runs THEN it SHALL call `conferenceRecords/{id}/participants` + `participantSessions` sub-resources and persist one row per participant session (each re-join creates a new `participantSession` with its own `startTime`/`endTime` per [participantSessions docs](https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.participants.participantSessions)).
5. WHEN the `TeamsAttendanceIngestService` runs THEN it SHALL call Graph `GET /me/onlineMeetings/{id}/attendanceReports` (poll-only — **no** Graph change notification for attendance reports) and persist rows for each `attendanceRecord`, expanding `attendanceIntervals[]` (each interval has `joinDateTime`/`leaveDateTime`/`durationInSeconds`). Attendance reports require the tenant's `AllowEngagementReport` meeting policy to be enabled (default: on, organizers can disable per meeting).
6. WHEN the admin Attendance sub-panel renders THEN it SHALL show a sortable table per `classInstanceId` with `{ participant name, email, joinTime, leaveTime, duration, attentiveness }` plus an aggregate header row (total participants, average duration).
7. WHEN the teacher opens the per-class-instance "Attendance" drawer THEN it SHALL show the same table scoped to that class instance AND a "Download CSV" affordance generating the same columns.
8. WHERE a participant's `userEmail` matches a Siraj `users.email` THEN the row SHALL be enriched with `userId` (new nullable column) so academic rollups can later attribute attendance to enrolled students.
9. WHEN attendance rows persist for a class instance that has zero recordings AND zero engagement events THEN the system SHALL NOT mark the class as "completed"; the completion check requires ≥1 recording OR ≥1 attendance row (whichever arrives first).

#### Additional Details

- **Priority**: Medium / **Complexity**: High / **Dependencies**: REQ-8 (admin tab infrastructure), REQ-10 (engagement events for completion detection)

### Requirement 10: Live Engagement Webhooks

**User Story:** As an admin monitoring a live class, I want to see a real-time feed of engagement events (meeting.started, participant.joined, recording.completed) without polling — so I can react to incidents mid-class.

#### Acceptance Criteria

1. WHEN a provider webhook arrives THEN the system SHALL persist an append-only row in the `meetings_engagement_events` table with columns `{ id (uuid pk), classInstanceId (fk onDelete set null — orphan events survive class deletion), providerSlug, eventType (text), eventTime (timestamptz), upstreamPayload (jsonb), receivedAt (timestamptz default now()), verified (boolean) }`.
2. WHEN the `app/(dashboard)/api/zoom-webhooks/route.ts` handler receives a POST THEN it SHALL verify the `x-zm-signature` header against `ZOOM_WEBHOOK_SECRET_TOKEN` using HMAC-SHA256; reject with 401 on mismatch.
3. WHEN the Zoom endpoint validation challenge (`endpoint.url_validation` event with `payload.plainToken`) arrives THEN the route SHALL respond within 3 seconds with `{ plainToken, encryptedToken }` where `encryptedToken = HMAC-SHA256(plainToken, ZOOM_WEBHOOK_SECRET_TOKEN)` hex-encoded (field is **`encryptedToken`**, not `encryptedTimestamp` — per [Zoom webhooks docs](https://developers.zoom.us/docs/api/webhooks/)).
4. WHEN the Meet webhook arrives THEN it SHALL be delivered via Google Pub/Sub (Siraj exposes the route as the push endpoint; Google signs the OIDC token, route verifies via Pub/Sub JWT verification).
5. WHEN the Teams webhook arrives THEN the route SHALL handle the lifecycle handshake (`?validationToken=<token>` → respond 200 with URL-decoded token as plain-text body within 10 seconds) AND verify `validationTokens` JWTs on rich notifications. Teams `meetingCallEvents` and recording change notifications use **encrypted** rich payloads (`encryptedContent` with certificate decryption) — attendance reports are **not** webhook-deliverable (poll-only).
6. WHERE an inbound event matches a known `classInstanceId` (by upstream `meetingId` in `class_instances.providerMetadata`) THEN the handler SHALL populate `classInstanceId` on the row; otherwise `classInstanceId = null` and the admin Live Engagement sub-panel SHALL show an "unmatched" filterable badge.
7. WHEN the admin Live Engagement sub-panel renders THEN it SHALL show a sortable event feed filterable by `{ provider, eventType, time range, matched/unmatched }` with the raw upstream payload in a collapsible `<details>` block (admin scope only).
8. WHEN an inbound webhook fails verification THEN the route SHALL respond 401, log `meeting.webhook.verificationFailed` to the audit channel, AND NOT persist any row.
9. WHEN an inbound webhook is verified but the event type is unknown THEN the handler SHALL persist the row with `eventType = "unknown"` and log `meeting.webhook.unknownEventType` at warn level — unknown events are kept for forensics but do not trigger downstream ingest services.

#### Additional Details

- **Priority**: Medium / **Complexity**: High / **Dependencies**: REQ-8 (admin tab), predecessor plan Phase 6.2 (OAuth callback App Router pattern)
- **Assumptions**: The deploying org has registered webhook endpoints with each provider marketplace / Pub/Sub topic / Graph subscription before activation (documented in runbook).

### Requirement 11: Admin Meeting Integrations Tab Extension (Sub-panels)

**User Story:** As a super-admin, I want the existing Meeting Integrations tab from the predecessor plan to gain three sub-panels (Recordings, Attendance, Live Engagement) so I can audit the full meeting lifecycle from one place.

#### Acceptance Criteria

1. WHEN the admin opens `/dashboard/settings?tab=meetingIntegrations` THEN the existing per-provider accordion (Zoom / Meet / Teams from predecessor plan REQ-13) SHALL be preserved unchanged AND three new sub-tabs SHALL appear above the accordion: `Recordings | Attendance | Engagement`.
2. WHEN the Recordings sub-tab is active THEN the panel SHALL show a sortable/filterable table across all class instances with `{ class, provider, startedAt, duration, view download share actions }` AND filter by provider and date range.
3. WHEN the Attendance sub-tab is active THEN the panel SHALL show a per-class-instance breakdown with expandable rows revealing the participant list.
4. WHEN the Engagement sub-tab is active THEN the panel SHALL show the live engagement feed per REQ-10 AC7.
5. WHEN any sub-tab renders THEN it SHALL reuse the existing aggregate health headers (config / creds / connected teachers / last-test) from the predecessor plan — those headers stay visible regardless of the active sub-tab.
6. WHERE the admin's session is being impersonated (`ctx.isImpersonating === true`) THEN the sub-tab mutations (revoke token, regenerate) SHALL refuse with `ImpersonationBlockedError` per the predecessor plan's pattern; read access (listing/CSV download) is permitted under impersonation.
7. WHEN a sub-tab is exported to CSV (Recordings or Attendance) THEN the CSV SHALL match the on-screen table column set AND include the upstream raw `providerMetadata.meetingId` for cross-reference with the provider portal.
8. WHEN the new sub-tabs render THEN they SHALL be lazy-loaded via `LazyMeetingIntegrationsRecordingsTab` / `LazyMeetingIntegrationsAttendanceTab` / `LazyMeetingIntegrationsEngagementTab` in `SettingsTabPanels.tsx` mirroring the existing 7 lazy entries.

#### Additional Details

- **Priority**: High / **Complexity**: High / **Dependencies**: REQ-8, REQ-9, REQ-10, predecessor plan Phase 5 (Settings 7th tab + subcomponent scaffold)

### Requirement 12: Storybook + Tests

**User Story:** As a maintainer, I want component stories + unit integration smoke tests so regressions in the embedded view, recording ingest, and webhook verification are caught.

#### Acceptance Criteria

1. WHEN `ZoomEmbeddedSurface` is implemented THEN a Storybook story SHALL cover the states: idle, joining, joined, meeting.ended, connection.failure (signature invalid), WebRTC unsupported fallback, switching Component <-> Client view.
2. WHEN `MeetingJoinCard` is implemented THEN stories SHALL cover `mode: embed`, `mode: redirect`, `MeetingUrlPendingError` state, and `MEETING_VIEW` missing (hidden card).
3. WHEN each ingest service is implemented THEN unit tests with mocked `fetch` SHALL cover the happy path + 4xx + 5xx + 429 branches; 100% coverage on the ingest function entry points.
4. WHEN each webhook route is implemented THEN HMAC verification tests SHALL cover a valid signature, an invalid signature, the Zoom endpoint validation challenge handshake, the Meet OIDC token verification path, and the Teams validation token handshake — each with the documented payloads.
5. WHEN `bun run test:integration test/integration/meeting/in-app/zoom-sdk-signature.integration.test.ts` runs AND `ZOOM_MSDK_*` env vars are set THEN the test SHALL mint one real SDK JWT signature against the live Zoom tenant and assert shape (`sdkKey`, `mn`, `role`, `exp` in valid bounds) — no actual meeting join attempted.
6. WHEN `bun run test:integration test/integration/meeting/in-app/zoom-recording.integration.test.ts` runs AND `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` are set THEN the test SHALL set up a test meeting, complete it, await the `recording.completed` webhook against an ephemeral local listener, assert a recording row is persisted, then delete the recording for cleanup.
7. WHERE the relevant env vars are missing THEN the integration tests SHALL skip via `describeLiveWhen(hasXxxConfig, ...)` (no CI failure when secrets absent) — mirrors predecessor plan REQ-12 pattern.
8. WHEN the integration smokes run THEN they SHALL NOT be called from the regular `bun run test:services` suite — registered in `package.json` existing `test:integration` script (auto-globbed).

#### Additional Details

- **Priority**: Medium / **Complexity**: Low / **Dependencies**: REQ-5, REQ-8, REQ-9, REQ-10

### Requirement 13: Internationalisation

**User Story:** As an Arabic-speaking student joining an embedded Zoom class, I want all new copy in Arabic.

#### Acceptance Criteria

1. WHEN a new error label is added under `errors.zoomSdk.<code>` THEN the system SHALL add it to `shared/locale/ar/errors` AND `shared/locale/en/errors` with the same key.
2. WHEN a notification label is added (recording-available, attendance-ready) THEN the system SHALL add it to `shared/locale/{ar,en}/notifications` AND `shared/locale/{ar,en}/dashboard/settings` for the sub-tab titles.
3. WHERE the error is upstream-provider-specific (e.g. `zoomSdk.3712` invalid signature) THEN the system SHALL fall back to a generic translated message rather than the upstream English string.
4. WHEN the embedded surface renders THEN its in-meeting controls come from the Zoom SDK locale (set via `client.init({ language: ctx.locale })` — Zoom SDK honours `en-US` / `ar-SA` per [Zoom i18n docs](https://developers.zoom.us/docs/meeting-sdk/web/localization/)) AND the surrounding Siraj chrome uses the active locale.
5. WHEN the engagement sub-tab event type label renders THEN the system SHALL translate known event types (`meeting.started` -> "بدأ الاجتماع" / "Meeting started") and fall back to the raw event string for unknown events.

#### Additional Details

- **Priority**: High / **Complexity**: Low / **Dependencies**: All adapter + UI requirements

### Requirement 14: Knowledge Propagation

**User Story:** As a future maintainer, I want the canonical `docs/services/meeting-providers.md` (produced by the predecessor plan) extended with In-App Embed & Telemetry sections so I don't have to reverse-engineer patterns from the codebase.

#### Acceptance Criteria

1. WHEN all implementation phases complete THEN the plan SHALL extend `docs/services/meeting-providers.md` with a new "## In-App Embed (Zoom Meeting SDK)" section covering: why Zoom-only, the separate Meeting SDK app type, the SDK JWT signature service pattern, the Component vs Client view tier rule, the OBF token resolution.
2. WHEN the webhook routes are implemented THEN the plan SHALL also add a "## Meeting Lifecycle Webhooks" section covering: HMAC verification per provider, the endpoint validation handshakes (Zoom `endpoint.url_validation`, Meet Pub/Sub OIDC, Teams Graph validation tokens), and the append-only ingestion pattern.
3. WHEN `IMeetingSurface` is implemented THEN the plan SHALL add an "## Meeting Surface Discrimination" subsection under the existing adapter pattern doc explaining the `mode: "embed" | "redirect"` rule and how to add a new embeddable provider in the future.
4. WHEN knowledge propagation runs THEN the plan SHALL update `backend/services/AGENTS.md` with the rule "Embedded meeting joins for `zoom_oauth` MUST go through `ZoomSdkSignatureService`; never issue SDK JWTs in the front-end."
5. WHEN knowledge propagation runs THEN the plan SHALL update `frontend/views/AGENTS.md` with the rule "`ZoomEmbeddedSurface` MUST render Client View on mobile and Component View on desktop per Zoom SDK browser-support constraints."
6. WHEN knowledge propagation runs THEN the plan SHALL update `.agents/instructions/backend.instructions.md` with a "Meeting Surface Adapters" subsection requiring future backend work that touches meeting join to consult `docs/services/meeting-providers.md`'s surface section.
7. WHEN knowledge propagation runs THEN the root `AGENTS.md` Important References section SHALL reference the extended `docs/services/meeting-providers.md` (no new doc file — extends existing).

#### Additional Details

- **Priority**: High / **Complexity**: Low / **Dependencies**: All prior requirements complete

## UX/Navigation Requirements

### Actual Codebase Routing Convention (from predecessor plan, still valid)

The App Router group is `app/(dashboard)/...` (not `app/[locale]/dashboard/...`). Locale is read server-side via `getLocale()` from `@/shared/locale/server-cookies`. The existing admin Settings page lives at `app/(dashboard)/settings/page.tsx` and is the canonical 7-tab (soon to be sub-panel-extended) settings surface.

The predecessor plan established the `meetingIntegrations` tab at `?tab=meetingIntegrations`. This plan EXTENDS that tab with sub-panels; we do NOT create a new top-level tab. We DO add a new route for the embedded view itself.

### New Route & Tab Placement

| Route / Tab / Path | Purpose | Permission | Roles with Access |
|--------------------|---------|------------|-------------------|
| `/dashboard/classes/[id]/meeting` (new) | Full-screen embedded Zoom meeting view OR redirect-affordance for Meet/Teams | `MEETING_VIEW` (new, REQ-7) | TEACHER (own classes), STUDENT, PARENT, SUPERVISOR (oversight), SUPER_ADMIN, ACADEMY_ADMIN |
| `/dashboard/settings` existing page — `meetingIntegrations` tab (already exists from predecessor plan) — gains 3 sub-tabs `recordings` / `attendance` / `engagement` | Admin audit surface for recordings / attendance / engagement | `SETTINGS_EDIT_MEETING_INTEGRATIONS` (existing from predecessor plan) OR `SETTINGS_VIEW` (read-only) | SUPER_ADMIN (primary); ACADEMY_ADMIN when explicitly granted |
| `app/(dashboard)/api/zoom-webhooks/route.ts` (new) | Zoom Marketplace webhook receiver — HMAC verified, middleware excluded | none (HMAC signature trust anchor) | any caller holding valid Zoom signature |
| `app/(dashboard)/api/meet-webhooks/route.ts` (new) | Google Pub/Sub push endpoint — OIDC verified, middleware excluded | none (Pub/Sub JWT trust) | Google Pub/Sub service account |
| `app/(dashboard)/api/teams-webhooks/route.ts` (new) | Microsoft Graph subscription change notification receiver — validation-token verified, middleware excluded | none (Graph validation token trust) | Microsoft Graph tenant |

### Sidebar Navigation Integration

- **Group**: `grp_admin` (existing parent group, label `navGroupAdmin`).
- **Parent item**: inherits the existing `settings` sidebar item — NO new sidebar entry.
- **Children**: none visible in the sidebar — the sub-tabs live inside the existing `MeetingIntegrationsTab`.
- For the embedded view route: NO new sidebar item — the route is reached by clicking "Join" on a class-instance row (the `MeetingJoinCard`).
- **Mobile Bottom Nav**: no new mobile bottom-nav item. The embedded view route is reachable from class-instance rows in the existing mobile schedule grid.
- **Group permission survivor**: add `MEETING_VIEW` to the existing `grp_admin` group's `permission` array in `frontend/common/views/dashboard/config/navigationConfig.ts` so the group survives filter when an admin holds `MEETING_VIEW` only.

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| STUDENT | Class-instance "Join" button — embedded for Zoom classes (one tap, in-app), redirect for Meet/Teams. Post-class: per-class "Recording" drawer on class detail. |
| PARENT | Same as STUDENT — embedded/redirect Join + per-class recording drawer. Cannot manage own meeting configs (existing role gating). |
| TEACHER | Same Join + post-class Recordings. Per-class-instance "Attendance" drawer (read/write-none; data appended by ingest services). Reuses predecessor plan's "Auto-generated" badge + "URL pending" badge. |
| SUPERVISOR | Read-only Attendance sub-panel (per class) + Engagement sub-tab (admin scope). Cannot Join in-app (no `MEETING_VIEW`); can audit. |
| SUPER_ADMIN | Settings 7th tab extended with Recordings / Attendance / Engagement sub-tabs. Full per-class drill-down. Per-provider unmatched events table. CSV exports. |
| ACADEMY_ADMIN | Same as SUPER_ADMIN when explicitly granted. |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Embedded Zoom view | Component View (modular widgets) with "Switch to classic Zoom view" toggle | Client View (full-page, mobile-supported per Zoom browser matrix) |
| Admin Settings sub-tabs | Full accordion per provider + sortable tables (admin tab is desktop-primary per Siraj convention) | Tab stack; tables become stacked card lists with horizontally-scrollable rows |
| Recording playback | Inline modal iframe for Zoom `play_url`; outlink for Meet/Teams | Tap-to-open in native browser or Zoom app via deep link (iframe playback supported on iOS 16.4+ Safari) |
| Attendance drawer | Sortable table + Download CSV affordance | Card list with collapsible per-participant rows; CSV download via native share sheet |
| Live Engagement feed | Sortable table with collapsible `<details>` for raw payload | Stream of cards with time + event type; raw payload collapsed by default |
| MeetingJoinCard | Inline button next to class-instance row; opens route in same tab | Full-width CTA below class-instance row; opens route in same tab |

### Permission Mapping

| Component / Route / Action | Required Permission | Source Gating |
|----------------------------|---------------------|---------------|
| `/dashboard/classes/[id]/meeting` page | `MEETING_VIEW` (new, REQ-7) | `RequirePermission` in page server component |
| `meetingSurfaceContext` GraphQL query | `MEETING_VIEW` (new, REQ-7) OR implied by `MEETING_CONFIGS_MANAGE_OWN` | resolver-level `assertCanViewMeeting` helper |
| Admin Recordings / Attendance / Engagement sub-tabs | `SETTINGS_EDIT_MEETING_INTEGRATIONS` (existing) OR `SETTINGS_VIEW` (read-only) | `SettingsTabPanels.tsx` per sub-tab gate + `settingsTabs.config.ts` sub-entries |
| CSV export (Recordings, Attendance) | `SETTINGS_EDIT_MEETING_INTEGRATIONS` OR `SETTINGS_VIEW` | new GraphQL mutation `exportMeetingTelemetryCsv(input)` scoped to admin OR supervisor |
| Recording webhook routes | none (HMAC trust) | middleware-excluded + route handler verifies signature |
| Attendance webhook routes | none (HMAC trust) | same |
| Engagement webhook routes | none (HMAC trust) | same |
| Teacher per-class Recordings/Attendance drawer | `MEETING_VIEW` (implied by `MEETING_CONFIGS_MANAGE_OWN` for own classes) | existing per-class-instance access gate |

## Non-Functional Requirements

### Performance

- WHEN `meetingSurfaceContext` is queried THEN the resolver SHALL return in <500ms P95 (single lookup + cached SDK signature + cached OBF token).
- WHEN the embedded surface mounts THEN the Zoom WASM SDK cold-start SHALL be tolerated up to 5 seconds before the loading skeleton transitions to a "taking longer than expected" state.
- WHEN the recording/attendance polling services run THEN each batch SHALL process at most 100 class instances per run with a target budget of <30s per batch — provider API quota limits respected (Zoom 10 req/s HEAVY on reports; Meet 6000/min/project + 600/min/user for reads, 100/min/project + 10/min/user for `spaces.create`; Teams 10k subscriptions/tenant for change notifications). Meet service accounts share a single per-user quota bucket.
- WHEN webhook routes handle inbound events THEN each handler SHALL respond within 3 seconds (provider retry windows expect fast ACK).

### Security

- WHEN SDK JWT signatures are minted THEN they SHALL never be logged AND never returned in error responses (only the typed error code surfaces to user).
- WHEN `ZOOM_MSDK_CLIENT_SECRET` is stored in env-config THEN it SHALL use `isSecret: true` + `displayStrategy: "db_with_mask_only"` per predecessor plan pattern.
- WHEN webhook handlers verify HMAC signatures THEN the comparison SHALL be constant-time (use `crypto.timingSafeEqual` or equivalent — never `===`). Zoom webhook routes SHALL read the raw body via `await req.text()` before JSON parsing (re-serialized JSON breaks HMAC verification).
- WHEN Zoom webhook handlers check timestamp freshness THEN a ±5-minute replay window SHOULD be enforced as a best practice (not an officially documented Zoom requirement, but widely adopted).
- WHEN webhook routes are excluded from middleware auth THEN the exclusion SHALL be scoped only to `/api/{zoom,meet,teams}-webhooks` paths — NOT broad `/api/**` exclusion that would weaken other API routes.
- WHEN attendance rows persist THEN participant `userEmail` SHALL be treated as PII — masked in non-admin reads, encrypted at rest is optional given the encryptedText custom type's overhead (decision documented in design).
- WHEN the engagement sub-tab raw upstream payload renders THEN it SHALL be visible to admin scope only — teachers/students never see raw payloads (only typed event labels).

### Reliability

- WHEN a webhook handler fails to persist an engagement event after 3 retries THEN the system SHALL write to an out-of-band `meeting.webhook.deadLetter` audit log AND alert the admin via toast in the Engagement sub-tab.
- WHEN the OBF token service is unavailable (Zoom 5xx) THEN the embedded surface SHALL fall back to "Open in Zoom client" deep link with a translated explanatory message — never silently fail to join.
- WHEN the recording polling service hits a provider rate limit (429) THEN it SHALL respect `Retry-After` AND back off AND not retry within the same batch — preventing cascading rate limiting.
- WHEN the Zoom SDK WASM module fails to load (network/CORS) THEN the surface SHALL render the same "Open in Zoom client" fallback with the predecessor plan's `joinWebUrl`.

### Usability / Accessibility

- WHEN the embedded surface renders THEN the surrounding Siraj chrome (header, navigation) SHALL be hidden (immersive route) AND an "Exit meeting" affordance SHALL be keyboard-accessible (Esc key + visible button).
- WHEN the recording/attendance CSV export completes THEN the user SHALL receive a translated toast confirming the download.
- WHEN the Engagement sub-tab renders THEN the raw upstream payload SHALL be inside `<details>` collapsed by default so screen readers don't read JSON aloud on load.

## Constraints and Assumptions

### Technical

- Runtime: Bun (not Node) — webhook routes use `fetch`-based request handlers (Next.js 16 App Router), no Node-only APIs.
- SDK integration: `@zoom/meetingsdk` package (WASM module) — this is the one heavy SDK the project accepts because the auto-meeting-url plan's "no heavy SDK" rule does not apply to the embed view (embed is impossible without the SDK).
- Zoom SDK JWT via `jose` (already installed per predecessor plan) — no new server-side deps.
- Drizzle Postgres: new tables (`class_meeting_recordings`, `class_meeting_attendance`, `meetings_engagement_events`) use `bun run db push` (additive, default policy enabled per auto-meeting-url plan).
- GraphQL: Pothos v4 extensions to the predecessor plan's schema; `bun run generate:gqlSchema && bun codegen` after each Pothos change.

### Business

- Zoom-only embed is the recognized provider asymmetry; admin runbook MUST document that Meet/Teams cannot be embedded (provider limitation, not Siraj limitation).
- Recording retention stays at provider config — Siraj is read-only on retention; deletion upstream marks Siraj rows `state: "expired"` without row deletion.

### Assumptions

- The deploying org has registered a separate Zoom Meeting SDK app type and obtained Client ID + Secret.
- The deploying org has configured webhook endpoints per provider before activation. Teams Graph app permissions require an **Application Access Policy** (`New-CsApplicationAccessPolicy` + `Grant-CsApplicationAccessPolicy`) in addition to admin consent — failure symptom: `"No application access policy found for this app"`.
- Teachers using the in-app view have granted any required media permissions (camera/mic) at the browser level.

## Success Criteria

### Definition of Done

- [ ] All 14 requirements' acceptance criteria met.
- [ ] All NFRs satisfied.
- [ ] Integration smoke tests pass when creds present, skip when absent.
- [ ] Quality gate (`bun quality-gate`) exits clean.
- [ ] `docs/services/meeting-providers.md` extended with In-App Embed & Telemetry sections; AGENTS.md/instructions updated.
- [ ] Both ar + en locale files updated and compile-time validated.
- [ ] The `/dashboard/classes/[id]/meeting` route renders an embedded Zoom meeting on desktop + mobile for `zoom_oauth` provider and offers redirect for `google_meet` / `microsoft_teams` / `manual`.
- [ ] The admin Meeting Integrations tab's three new sub-panels (Recordings, Attendance, Engagement) functional end-to-end with webhook-driven data for Zoom and polling data for Meet/Teams.

### Acceptance Metrics

- P95 `meetingSurfaceContext` < 500ms warm.
- Webhook handler P95 < 3s response time.
- Zero user-visible env-variable-name leakage in error strings.
- 100% unit test coverage on ingest services and webhook verification branches.
- Zero dead-letter audit alerts during a 100-class-instance pilot.

## Glossary

| Term | Definition |
|------|------------|
| `IMeetingSurface` | New adapter interface declaring either `mode: "embed"` (Zoom) or `mode: "redirect"` (Meet/Teams/manual). |
| Zoom Meeting SDK | Zoom's WebAssembly web client (`@zoom/meetingsdk`) embedding a Zoom meeting inside a third-party page either as Client View (full-page) or Component View (modular widgets). |
| Meeting SDK JWT signature | Server-minted JWT signed with Meeting SDK Client ID + Secret authorizing the front-end SDK join — distinct from the auto-meeting-url plan's S2S OAuth token. |
| OBF token | "On Behalf Of" token required by Zoom for external (cross-tenant) meeting joins. Enforcement begins **March 2, 2026**; readiness deadline Feb 23, 2026. Mutually exclusive with ZAK in `client.join()`. |
| ZAK token | Zoom Access Token — alternative per-user host identity token, used when OBF is unavailable. |
| Component View | Zoom SDK mode providing modular widgets (video tile, chat, controls) for custom layouts — desktop only. |
| Client View | Zoom SDK mode providing a full-page Zoom web client experience — mobile + desktop. |
| `meetingSurfaceContext` | GraphQL query returning the full context needed by the front-end to render the appropriate meeting surface. |
| `meetingEngagementEvents` | Append-only table capturing raw upstream webhook payloads (meeting.started, participant.joined, recording.completed, etc.). |
| `class_meeting_recordings` | Per-class-instance recording list table populated from per-provider ingest. |
| `class_meeting_attendance` | Per-class-instance attendance rows table populated from per-provider ingest. |
| `MEETING_VIEW` | New permission gating in-app join + read access to recordings/attendance. |
| `endpoint.url_validation` | Zoom's webhook endpoint-verification handshake: respond `{ plainToken, encryptedToken }` where `encryptedToken = HMAC-SHA256(plainToken, secret)` hex. |
| Google Workspace Events API | Google's event-delivery mechanism for Meet lifecycle events (`recording.v2.fileGenerated`, `conference.v2.ended`, etc.) via Pub/Sub — not a direct HTTP webhook from Meet. |
| Pub/Sub OIDC token | Google Cloud Pub/Sub's per-push-endpoint JWT signed by Google's service account; receivers verify via Google's JWKS. |
| Graph validation token | Microsoft Graph's lifecycle handshake for change-notification subscriptions. |

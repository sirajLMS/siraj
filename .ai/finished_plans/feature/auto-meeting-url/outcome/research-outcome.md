# Research Outcome — Verified Provider API Specifications

## Document Information

- **Date**: 2026-07-31
- **Source**: Direct live fetch of official provider documentation (Zoom, Google Meet, Microsoft Graph) + confirmation of Zoom user-OAuth refresh-token flow via secondary search.
- **Purpose**: Persist researched API specifics so subsequent tasks don't re-fetch. Read this before implementing any adapter (REQ 3, 4, 5, 9).

## 1. Zoom — REST API Create a meeting (verified)

### Endpoint
```
POST https://api.zoom.us/v2/users/me/meetings
Authorization: Bearer <access_token>
Content-Type: application/json
```

Use `/me` path with user-level (General app `authorization_code` grant) tokens. S2S tokens also use `/me` (token represents the account owner). Admin-level apps with `meeting:write:admin` scope can use `/users/{userId}/meetings` instead, not needed for our use case.

### Request body (verified)
```json
{
  "topic": "Q1 Planning Meeting",
  "type": 2,
  "start_time": "2025-03-15T10:00:00Z",
  "duration": 60,
  "timezone": "America/New_York",
  "settings": {
    "host_video": true,
    "participant_video": true,
    "join_before_host": false,
    "waiting_room": true,
    "mute_upon_entry": true,
    "auto_recording": "cloud"
  }
}
```

- `type: 2` = scheduled (instant meeting = `type: 1`).
- `start_time` ISO 8601 UTC, optional when `type: 2` (default: now).
- `duration` minutes.
- `settings.waiting_room` (true), `settings.host_video` (true), `settings.participant_video` (true), `settings.join_before_host` (false) — sane defaults for educational meetings. Updated post-analysis: the executed adapter (`backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts:116`) uses `participant_video: true`. The `trackable-tasks.md` value was correct; this research-outcome was stale.

### Response body (verified)
```json
{
  "id": 93123456789,
  "uuid": "xyzAbC1234==",
  "host_id": "abc123def456",
  "topic": "Q1 Planning Meeting",
  "type": 2,
  "start_time": "2025-03-15T10:00:00Z",
  "duration": 60,
  "timezone": "America/New_York",
  "created_at": "2025-02-09T12:30:00Z",
  "join_url": "https://zoom.us/j/93123456789",
  "start_url": "https://zoom.us/s/93123456789?zak=...",
  "password": "auto-generated if account requires it",
  "settings": { "host_video": true, "participant_video": true, "waiting_room": true, "auto_recording": "cloud" }
}
```

- `join_url` — what students/parents use to join. Store as `details.meetingUrl`.
- `start_url` — host-only URL with embedded ZAK token. Store under `providerMetadata.startUrl`.
- `password` — auto-generated when account requires one. Store under `encryptedSecret`.
- `h323_id`, `pstn_password` etc. ignored for our use case.

### Delete endpoint (for class-cancel cleanup)
```
DELETE https://api.zoom.us/v2/meetings/{meetingId}
Authorization: Bearer <access_token>
```
Returns `204 No Content`. Per Zoom docs — supports the cancel-path best-effort in REQ-8.

### Security note (verified from Meeting API Security Enhancements docs)
If you disable `password`, `waiting_room`, and `meeting_authentication` together, Zoom overwrites the request to enable at least one. **Always** read back the response to see the actual applied settings — don't trust the request echoed back.

## 2. Zoom — Authentication (S2S vs User-OAuth — both verified)

### S2S OAuth (org path, REQ-3)
```
POST https://zoom.us/oauth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded
Body: grant_type=account_credentials&account_id=<ACCOUNT_ID>
```

Response:
```json
{ "access_token": "<JWT>", "token_type": "bearer", "expires_in": 3599, "scope": "user:read:admin meeting:write:admin ...", "api_url": "https://api.zoom.us" }
```

- **No refresh token** — when the token expires, re-call `/oauth/token` with `account_credentials` grant.
- Cache until `exp - 60s` (earliest refresh margin).
- Required scopes: `meeting:write:admin` (account-wide), `meeting:write` (own user). Pick `meeting:write:admin` for S2S because S2S apps always operate account-wide.

### User OAuth (per-teacher fallback, REQ-9)

Authorize URL (browser redirect):
```
https://zoom.us/oauth/authorize?response_type=code&client_id=<ID>&redirect_uri=<URI>&state=<STATE>
```

Token exchange:
```
POST https://zoom.us/oauth/token
Authorization: Basic base64(client_id:client_secret)
Body: grant_type=authorization_code&code=<CODE>&redirect_uri=<URI>
```

Refresh:
```
POST https://zoom.us/oauth/token
Authorization: Basic base64(client_id:client_secret)
Body: grant_type=refresh_token&refresh_token=<TOKEN>
```

- **Refresh tokens rotate** — Zoom returns a new `refresh_token` on every refresh; the old one is invalidated. **The adapter MUST persist the new refresh token after every refresh exchange** (REQ-9 criteria 3 — already captured).
- Zoom does not document a fixed refresh-token lifetime. Treat `invalid_grant` as the sole re-auth trigger (verified from Zoom's Token & Authorization Code Flow docs fetched during analysis). When `invalid_grant` surfaces, throw `ProviderReauthRequiredError` and show the "Reconnect your Zoom account" UI state.
- Scopes: `meeting:write` (user-level, requires user OAuth app). Scope names are identical for S2S and user OAuth except for the `:admin` suffix.
- Use the `/me` path with user tokens — never user-id paths with user-level OAuth tokens.

### Revocation (for disconnect path)
```
POST https://zoom.us/oauth/revoke?token=<TOKEN>
Authorization: Basic base64(client_id:client_secret)
```

Returns `{ status: "success" }`. Best-effort, log on failure.

## 3. Google Meet — REST API `spaces.create` (verified)

### Endpoint
```
POST https://meet.googleapis.com/v2/spaces
Authorization: Bearer <access_token>
Content-Type: application/json
Body: { "config": { "accessType": "OPEN" } }    // optional body — defaults picked if omitted
```

### Request body (verified)
The request body contains an instance of `Space`. Only `config` (a `SpaceConfig`) is meaningful for create. Configurable fields:
- `config.accessType` — `OPEN | TRUSTED | RESTRICTED | ACCESS_TYPE_UNSPECIFIED` (default = user's org default, RESTRICTED for enterprise). For per-user OAuth fallback, suggest `OPEN` to mirror Zoom's open meeting room. For DWD path, configure via env (`GOOGLE_MEET_DEFAULT_ACCESS_TYPE`, default `OPEN`).
- `config.entryPointAccess` — `ALL | CREATOR_APP_ONLY`. Use default `ALL` so attendees can join from `meet.google.com`.

### Response body (verified)
```json
{
  "name": "spaces/jQCFfuBOdN5z",
  "meetingUri": "https://meet.google.com/abc-mnop-xyz",
  "meetingCode": "abc-mnop-xyz",
  "config": { "accessType": "OPEN", "entryPointAccess": "ALL" }
}
```

- `meetingUri` — the join URL. Store as `details.meetingUrl`.
- `meetingCode` — short code (useful for SMS invites). Store under `providerMetadata.meetingCode`.
- `name` — the resource identifier `spaces/{space}`. Store as `meetingId`.

### Required scope
- `https://www.googleapis.com/auth/meetings.space.created` (sensitive) — only this scope is needed for `spaces.create`.

### No native DELETE
Meet spaces have no `spaces.delete` method (per the resource's listed methods: `create`, `endActiveConference`, `get`, `patch`). The space auto-expires when the active conference ends and attendees leave. Document this for the cancel-path (REQ-8): "no delete endpoint; space auto-expires" — log-only no-op on cancel.

## 4. Google Meet — Authentication (service-account + DWD verified)

### Service-account JWT (RS256) — verified
Header:
```json
{ "alg": "RS256", "typ": "JWT", "kid": "<private_key_id from service account JSON>" }
```

Payload:
```json
{
  "iss": "<client_email from service account JSON>",
  "scope": "https://www.googleapis.com/auth/meetings.space.created",
  "aud": "https://oauth2.googleapis.com/token",
  "exp": <iat + 3600>,
  "iat": <now>,
  "sub": "<GOOGLE_MEET_IMPERSONATE_SUBJECT — Workspace user email>"
}
```

- `iss` and (for DWD) `sub` both come from the service account JSON's `client_email`. Without `sub`, the service account impersonates itself — `spaces.create` returns 403 (confirmed by official docs).
- Signing algorithm MUST be RS256. `jose.SignJWT` supports it.
- `exp` max = `iat + 3600` (1h).

### Token exchange
```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded
Body: grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=<SIGNED_JWT>
```

Response:
```json
{ "access_token": "1/8xbJqaOZXSUZbHLl5EOtu1pxz3fmmetKx9W8CV4t79M", "token_type": "Bearer", "expires_in": 3599 }
```

- No refresh token — re-mint a JWT and re-exchange when `exp - 60s` approached.

### Service-account JSON shape (input from `GOOGLE_MEET_SERVICE_ACCOUNT_JSON` env)
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "sa-name@project-id.iam.gserviceaccount.com",
  "client_id": "..."
}
```

Parse on construction; validate `type === "service_account"`, presence of `client_email` + `private_key` + `private_key_id`. Fail fast with `InvalidServiceAccountJsonError` on shape errors.

### Per-user OAuth (REQ-9 fallback)
Authorize URL:
```
https://accounts.google.com/o/oauth2/v2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fmeetings.space.created&access_type=offline&redirect_uri=<URI>&response_type=code&client_id=<ID>&state=<STATE>&prompt=consent
```

Token exchange (`POST https://oauth2.googleapis.com/token`, `grant_type=authorization_code`). Refresh (`grant_type=refresh_token`). No DWD, no `sub` claim — user's own OAuth access token grants the scope directly on `spaces.create`.

## 5. Microsoft Teams — Microsoft Graph `onlineMeetings` (verified)

### Endpoint (application permission path)
```
POST https://graph.microsoft.com/v1.0/users/{userId}/onlineMeetings
Authorization: Bearer <access_token>
Content-Type: application/json
```

`{userId}` = organizer user's `id` or `userPrincipalName` (UPN — typically their email). Sourced from `MS_TEAMS_ORGANIZER_USER_ID` env var.

### Request body (verified)
```json
{
  "startDateTime": "2026-08-15T10:00:00Z",
  "endDateTime": "2026-08-15T11:00:00Z",
  "subject": "Class title"
}
```

- `subject` — required.
- `startDateTime` + `endDateTime` — required (UTC ISO 8601). `endDateTime = startDateTime + durationMinutes`.
- The `onlineMeeting` resource has many optional fields (`lobbySettings`, `participants`, `recordAutomatically`, etc.) — all optional for v1; we set sensible defaults server-side.

### Response body (verified)
```json
{
  "id": "<id>",
  "joinWebUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "subject": "Class title",
  "startDateTime": "2026-08-15T10:00:00Z",
  "endDateTime": "2026-08-15T11:00:00Z",
  "joinMeetingIdSettings": { "joinMeetingId": "...", "passcode": "..." },
  "lobbySettings": { "scope": "...", "isDialInBypassEnabled": false },
  ...
}
```

- `joinWebUrl` — full meeting hyperlink. Store as `details.meetingUrl`.
- `id` — the onlineMeeting id. Store as `meetingId`.
- `joinMeetingIdSettings.passcode` — meeting passcode. Store under `encryptedSecret` if non-null.

### Permissions (verified)
- **Application permission**: `OnlineMeetings.ReadWrite.All` (least privileged app permission; no higher).
- App MUST also have an **application access policy** assigned via `New-CsApplicationAccessPolicy` + `Grant-CsApplicationAccessPolicy` (PowerShell, SkypeForBusiness module) — otherwise `/users/{userId}/onlineMeetings` returns 403 "No application access policy found for this app".
- Delegated permission (per-user fallback): `OnlineMeetings.ReadWrite` — uses `/me/onlineMeetings` path instead.

### Delete endpoint (for class-cancel cleanup)
```
DELETE https://graph.microsoft.com/v1.0/users/{userId}/onlineMeetings/{id}
Authorization: Bearer <access_token>
```
Returns `204 No Content`. Supports the cancel-path best-effort in REQ-8.

## 6. Microsoft — Entra client-credentials flow (verified)

### Token endpoint
```
POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded
Body:
  client_id=<CLIENT_ID>
  &client_secret=<URL_ENCODED_SECRET>
  &scope=https%3A%2F%2Fgraph.microsoft.com%2F.default
  &grant_type=client_credentials
```

- `{tenantId}` is the tenant GUID or domain — sourced from `MS_TEAMS_TENANT_ID` env var.
- Basic auth variant (per RFC 6749 §2.3.1) is also accepted — but the form-body approach above is the documented default and easier to mock in tests.

### Response
```json
{ "token_type": "Bearer", "expires_in": 3599, "access_token": "..." }
```

- No refresh token (app-only). Re-mint when `exp - 120s` approached (slightly larger caveat than Zoom/Meet because Graph tokens sometimes have clock skew with Entra).
- `scope` MUST be a single resource — `https://graph.microsoft.com/.default` is correct; multiple-resource scopes error out.

## 7. Cross-cutting for all three adapters

### Token cache shape
```typescript
interface TokenCache {
  accessToken: string;
  expiresAt: number; // ms-since-epoch (decoded JWT `exp` claim * 1000 or response `expires_in` + Date.now())
}
```
Cache lives on the adapter instance (per-slug singleton via factory). Reset on `resetMeetingChannel`.

### HTTP
- `fetch` global (Bun-native) — no `undici` direct import needed (Bun polyfills `fetch`).
- 30s per-request timeout via `AbortController`.
- Retry: 1 retry on 5xx with 200ms+jitter backoff; no retry on 4xx except `429` (caller decides via `RateLimitedError`).

### Logging hygiene
- Mask `Authorization` headers + body fields named `password`/`token`/`refresh_token`/`secret` recursively before `logger.*` calls.
- Never log full URLs containing `?pwd=` (Zoom) — use a `redactUrlSecrets(url)` utility.

## 8. Carry-over notes for implementation tasks

- **REQ-3 (Zoom adapter)**: the API request body accepts ISO 8601 with timezone suffix (`start_time`, `timezone`) OR UTC. Use UTC `Z` and provide `timezone: "UTC"` to avoid surprising teachers with auto-converted local times.
- **REQ-4 (Google Meet adapter)**: confirm the deployment chooses `accessType` env value carefully — `OPEN` means anyone with the link joins without knocking. For an open student-portal where the URL is shown only to enrolled students, `OPEN` is fine. If the deployment wants knocking, use `TRUSTED`.
- **REQ-5 (Teams adapter)**: `MS_TEAMS_ORGANIZER_USER_ID` can be either object ID or UPN — recommend UPN because admins more easily identify it (it's the user's email).
- **REQ-9 (hybrid fallback)**: refresh-token rotation matters most for Zoom (Zoom rotates refresh tokens explicitly and invalidates old). Google and Microsoft also rotate but less abruptly. Document in the adapter README.
- **REQ-10 (consent UI)**: Google's authorize URL needs `prompt=consent` to force a fresh refresh-token issuance — without it, Google returns the cached refresh-token only the first time the user consents, which breaks re-connection flows.

## 9. Source URLs (verified live on 2026-07-31)

- Zoom S2S OAuth: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
- Zoom user OAuth + refresh: https://developers.zoom.us/docs/integrations/oauth/
- Zoom REST API create meeting: https://github.com/zoom/skills/blob/main/skills/rest-api/examples/meeting-lifecycle.md
- Zoom Meeting API Security Enhancements: https://developers.zoom.us/docs/api/references/meeting-api-security-enhancements/
- Zoom authentication flows (scopes table): https://github.com/zoom/skills/blob/main/skills/rest-api/concepts/authentication-flows.md
- Google Meet spaces.create: https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/create
- Google Meet spaces resource: https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces
- Google service account JWT: https://developers.google.com/identity/protocols/oauth2/service-account
- Microsoft Graph application-post-onlinemeetings: https://learn.microsoft.com/en-us/graph/api/application-post-onlinemeetings
- Microsoft Graph onlinemeeting resource: https://learn.microsoft.com/en-us/graph/api/resources/onlinemeeting
- Microsoft Entra client-credentials: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
- Microsoft Teams application access policy: https://learn.microsoft.com/en-us/graph/cloud-communication-online-meeting-application-access-policy

# Cross-Plan Consistency — Zoom Claims

This file checks **consistency between the two plans** on Zoom-specific topics where they overlap or depend on each other. The `in-app-meeting-view` draft plan explicitly builds on the `auto-meeting-url` finished plan.

---

## 1. Env-Key Separation — S2S OAuth vs Meeting SDK

### Finished Plan (`auto-meeting-url`)
- Uses `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` for S2S OAuth (server-to-server REST API access).
- These credentials mint access tokens for `/v2/users/me/meetings` etc.

### Draft Plan (`in-app-meeting-view`)
- Uses `ZOOM_MSDK_CLIENT_ID`, `ZOOM_MSDK_CLIENT_SECRET` for Meeting SDK JWT signing.
- Explicitly warns (REQ-1 AC-5): "the two app types cannot mint each other's tokens."

### Consistency Check
✅ **Consistent.** The env-key naming is clearly separated (`ZOOM_CLIENT_*` for S2S vs `ZOOM_MSDK_*` for SDK). The draft plan reuses the finished plan's env-config infrastructure (`resolveEnvConfigMany`) and correctly identifies the separation.

⚠️ **Risk**: An admin could accidentally set `ZOOM_MSDK_CLIENT_ID` to the same value as `ZOOM_CLIENT_ID`. The draft plan (REQ-1 AC-5) notes this and says "no cross-validation in v1 but the canonical doc SHALL warn against this." This is acceptable for v1 but should be documented.

---

## 2. Auth Token Resolution — Hybrid Auth Pattern

### Finished Plan (`auto-meeting-url`)
- Introduces hybrid auth: org S2S OAuth as primary path, per-teacher user OAuth as fallback.
- `MeetingChannelFactory.getAccessToken("zoom", hostUserId)` resolves the best available token.
- Per-teacher tokens stored in `meeting_provider_tokens` table.

### Draft Plan (`in-app-meeting-view`)
- REQ-3 AC-1: "Resolve host S2S access token via `MeetingChannelFactory.getAccessToken("zoom", hostUserId)`; OR per-actor token via `MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, "zoom")` when per-user fallback active."
- Used for OBF token resolution.

### Consistency Check
✅ **Consistent.** The draft plan correctly reuses the finished plan's `MeetingChannelFactory` and `MeetingProviderTokenRepository` abstractions. The hybrid auth pattern is applied correctly to the OBF token resolution path.

⚠️ **Ambiguity**: The draft plan says "OR per-actor token" — it's unclear whether:
- (a) The system tries S2S first, falls back to per-actor on failure, or
- (b) The system uses per-actor when a `meeting_provider_tokens` row exists, otherwise S2S.

The finished plan's pattern is (b) — per-user token takes priority when available. The draft plan should clarify this to avoid implementation ambiguity.

---

## 3. Meeting Number Source — `providerMetadata.meetingId`

### Finished Plan (`auto-meeting-url`)
- Booking-time generation (REQ-8) creates a Zoom meeting and stores the Zoom `id` (meeting number) in `providerMetadata.meetingId` on the `class_meeting_configs` or `class_instances` row.
- The `join_url` is stored as `details.meetingUrl`.

### Draft Plan (`in-app-meeting-view`)
- REQ-4 (MeetingSurfaceContext): resolver looks up `class_instances` row, resolves linked `MeetingProvider`, and returns `meetingNumber` for the SDK JWT and join call.
- REQ-2 AC-1: `ZoomSdkSignatureService.sign({ meetingNumber, role, actorUserId })` — takes `meetingNumber` as input.

### Consistency Check
✅ **Consistent.** The draft plan correctly sources `meetingNumber` from the `providerMetadata.meetingId` established by the finished plan's booking-time generation. The data flow is:

```
Finished Plan (REQ-8) → creates Zoom meeting → stores meetingId in providerMetadata
                                          ↓
Draft Plan (REQ-4)     → reads providerMetadata.meetingId → meetingNumber
                                          ↓
Draft Plan (REQ-2)     → ZoomSdkSignatureService.sign({ meetingNumber }) → SDK JWT
```

---

## 4. Meeting Password — `encryptedSecret` vs `password` in `client.join()`

### Finished Plan (`auto-meeting-url`)
- Stores Zoom's auto-generated meeting `password` under `encryptedSecret`.

### Draft Plan (`in-app-meeting-view`)
- REQ-4 AC-2: `meetingSurfaceContext` returns `password?` for the SDK `client.join()` call.
- REQ-5 AC-1: `client.join({ signature, meetingNumber, password, userName, obfToken? })`.

### Consistency Check
✅ **Consistent.** The draft plan surfaces the password (stored by the finished plan under `encryptedSecret`) in the `meetingSurfaceContext` query result. The password is passed to `client.join()` for Component View (lowercase `password`) or `ZoomMtg.join()` for Client View (`passWord` camelCase).

---

## 5. Webhook Route — New in Draft Plan

### Finished Plan (`auto-meeting-url`)
- Does not define webhook routes. Zoom integration is outbound-only (create/delete meetings via REST API).

### Draft Plan (`in-app-meeting-view`)
- Phase 7.2: `app/(dashboard)/api/zoom-webhooks/route.ts` — receives Zoom webhooks for recording/attendance/engagement telemetry.
- Verify HMAC-SHA256 of `v0:<timestamp>:<rawBody>` against `x-zm-signature`.
- For `endpoint.url_validation`: respond with `{ plainToken, encryptedToken }`.

### Consistency Check
✅ **Consistent — no conflicts.** The webhook route is a new addition in the draft plan and does not conflict with any finished plan's routes. The draft plan correctly adds `ZOOM_WEBHOOK_SECRET_TOKEN` as a new env key (REQ-1 AC-3) and notes that `middleware.ts` should skip auth on `/api/zoom-webhooks` (signature is the trust anchor).

---

## 6. Provider Slug — `"zoom"` vs `"zoom_oauth"`

### Finished Plan (`auto-meeting-url`)
- `MeetingProviderKind = "manual" | "zoom_oauth" | "google_meet_oauth" | "microsoft_teams_oauth"`
- `MeetingProvider = "zoom" | "google_meet" | "microsoft_teams"` (the slug)

### Draft Plan (`in-app-meeting-view`)
- REQ-4 AC-2: `providerKind === "zoom_oauth"` → populate embedded surface context
- REQ-4 AC-3: `providerKind ∈ { "google_meet_oauth", "microsoft_teams_oauth", "manual" }` → redirect mode
- Uses `"zoom"` as the providerSlug in `meetingSurfaceContext`

### Consistency Check
✅ **Consistent.** `providerKind` (includes `_oauth` suffix) is used for branching logic. `providerSlug` (bare `"zoom"`) is used for adapter resolution and token lookups. Both plans use the same dual-identifier convention.

---

## 7. Error Type Hierarchy — ZoomApiError vs ZoomSdkSignatureInvalidError

### Finished Plan (`auto-meeting-url`)
- Typed errors: `ZoomApiError`, `ProviderReauthRequiredError`, `InsufficientScopesError`, etc.
- These are REST API errors (create/delete meeting, OAuth token exchange).

### Draft Plan (`in-app-meeting-view`)
- Typed errors: `ZoomSdkSignatureInvalidError`, `ZoomObfTokenError`, `MissingMeetingSdkCredentialsError`, `MeetingUrlPendingError`, `WebRtcUnsupportedError`.
- These are SDK/embed errors (JWT mint, OBF resolution, surface rendering).

### Consistency Check
✅ **Consistent — complementary, no overlap.** The two plans introduce error types for different failure domains:
- Finished plan: REST API / OAuth layer
- Draft plan: SDK JWT / OBF / embedded surface layer

No naming collisions. Both extend a shared `MeetingChannelError` base class (finished plan) or analogous base (draft plan).

---

## Summary

| # | Cross-Plan Topic | Consistency |
|---|-----------------|-------------|
| 1 | Env-key separation (S2S vs SDK) | ✅ Consistent (⚠️ admin misconfiguration risk acknowledged) |
| 2 | Hybrid auth token resolution | ✅ Consistent (⚠️ ambiguity in fallback order) |
| 3 | Meeting number source | ✅ Consistent — data flow is clear |
| 4 | Meeting password flow | ✅ Consistent — `encryptedSecret` → `password` in join call |
| 5 | Webhook route | ✅ Consistent — new addition, no conflicts |
| 6 | Provider slug convention | ✅ Consistent — dual-identifier convention maintained |
| 7 | Error type hierarchy | ✅ Consistent — complementary domains |

**Overall**: The two plans are consistent on Zoom-specific claims. The draft plan correctly builds on the finished plan's infrastructure. Two minor items to clarify: (1) the admin misconfiguration risk for env keys, and (2) the fallback order ambiguity in hybrid auth token resolution.

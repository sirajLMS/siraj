# Draft Plan (`in-app-meeting-view`) — Zoom Claims Verification

**Plan status**: 0/51 tasks complete (not started — draft).
**Zoom-relevant sections**: `specs.md` REQ 1 (SDK app type + env keys), REQ 2 (SDK JWT signature service), REQ 3 (OBF token service), REQ 4 (surface context query), REQ 5 (embedded surface component); `design.md` (SDK JWT cache decision); `outcome/research-verification-outcome.md` (14 corrections applied); `trackable-tasks.md` Phase 2 (signature + OBF), Phase 5/6/7 (telemetry), Phase 7.2 (webhooks).

---

## 1. Zoom Meeting SDK — Separate App Type + Env Keys

**Claim** (`specs.md` REQ-1, lines 85–100):
> Register a separate Zoom Meeting SDK app type in Zoom App Marketplace. Env keys: `ZOOM_MSDK_CLIENT_ID`, `ZOOM_MSDK_CLIENT_SECRET`, `ZOOM_MSDK_OBF_ENABLED` (default `false`), `ZOOM_WEBHOOK_SECRET_TOKEN`. The SDK Client ID/Secret cannot mint S2S OAuth tokens and vice versa.

**Official source**: Zoom Meeting SDK Auth docs (`https://developers.zoom.us/docs/meeting-sdk/auth/`).

**Verdict**: ✅ **Correct.**
- Zoom Meeting SDK uses a separate app type (Meeting SDK) distinct from Server-to-Server OAuth apps.
- The Meeting SDK app has its own Client ID and Client Secret used only for signing SDK JWTs — they cannot be used for REST API OAuth.
- The plan's warning (REQ-1 AC-5) that "the two app types cannot mint each other's tokens" is accurate and well-placed.
- `ZOOM_WEBHOOK_SECRET_TOKEN` is the correct env key for Zoom webhook HMAC verification (confirmed via webhook docs — "Zoom includes a webhook secret token on the Add Feature page for your app").

---

## 2. SDK JWT Payload — `appKey`, `sdkKey`, `mn`, `role`, `iat`, `exp`, `tokenExp`

**Claim** (`specs.md` REQ-2 AC-1, line 108):
> JWT payload: `{ appKey: ZOOM_MSDK_CLIENT_ID, sdkKey: ZOOM_MSDK_CLIENT_ID, mn: meetingNumber, role: 0|1, iat: now-30s, exp: iat+1800, tokenExp: exp }` signed with `ZOOM_MSDK_CLIENT_SECRET` via `jose` using `HS256`. Include both `appKey` and `sdkKey` with the same value for cross-platform compatibility.

**Official source**:
- Zoom Meeting SDK Auth (`https://developers.zoom.us/docs/meeting-sdk/auth/`) — JWT payload fields.
- Zoom JoinOptions (`https://marketplacefront.zoom.us/sdk/meeting/web/components/interfaces/JoinOptions.html`) — `sdkKey` deprecation note.

**Verdict**: ✅ **Correct.**

Sub-claims verified:

| Sub-claim | Official docs | Verdict |
|-----------|--------------|---------|
| `appKey` = Client ID (canonical field) | "After v5.0.0, the signature is required to have the appKey field `appKey:sdkKey` or `appKey:clientId`" | ✅ |
| Include both `appKey` and `sdkKey` (same value) | Zoom signature troubleshooting blog recommends both for cross-platform compat | ✅ |
| `mn` = meeting number | Documented payload field | ✅ |
| `role` = `0` (attendee) or `1` (host) | Documented payload field | ✅ |
| `iat` = issued-at timestamp | Documented payload field | ✅ |
| `exp` = expiration timestamp | Documented payload field | ✅ |
| `tokenExp` = token expiration (can equal `exp`) | Documented payload field | ✅ |
| HS256 signing algorithm | Documented | ✅ |
| `sdkKey` deprecated in `client.join()` after v4.0.0 | JoinOptions: "The sdkKey is deprecated for the joinOptions() after v4.0.0. You can just use signature." | ✅ |

The plan's research-verification-outcome correctly caught that `sdkKey` must NOT be passed to `client.join()` (only embedded in the JWT payload). ✅

---

## 3. SDK JWT `exp` Bounds — [1800s, 172800s]

**Claim** (`specs.md` REQ-2 AC-2, line 109):
> `exp - iat` SHALL be in `[1800, 172800]` seconds (Zoom's documented bounds — 30 min minimum, 48 h maximum).

**Official source**: Zoom Meeting SDK Auth docs.

**Verdict**: ✅ **Correct.**
- Zoom's documented bounds: `exp - iat` minimum 1800 seconds (30 min), maximum 172800 seconds (48 hours).
- The plan states the bounds correctly.

**⚠️ Risk — At the minimum bound**: The plan uses `exp = iat + 1800` (exactly 30 min). This is the **minimum** allowed value. Combined with `iat = now - 30s` (backdated to account for clock skew), the effective lifetime is 30 min − 30s backdate = 1740s real-time. This is within Zoom's bounds (the JWT `exp - iat` = 1800s satisfies the bound even with backdate). However:
  - If the server clock drifts more than 30s ahead of Zoom's validation server, the JWT could be rejected as having `exp - iat < 1800`.
  - **Recommendation**: Consider using `exp = iat + 3600` (60 min) for a safer margin, since the cache TTL is `exp - 60s` anyway. The cost of a 60-min JWT is negligible and eliminates clock-skew risk at the minimum boundary.

See `04-issues-and-recommendations.md` Issue #3 for details.

---

## 4. SDK JWT Caching — 30-min TTL, Race-Safe, Per-Meeting+Role+User

**Claim** (`specs.md` REQ-2 AC-3, AC-4, AC-5, line 110–112):
> Cache per `(meetingNumber, role, userId)`, TTL = `exp - 60s`. Race-safe single-mint-in-flight promise. `resetZoomSdkSignatureCache(meetingNumber?)` for invalidation.

**Official source**: N/A — this is an implementation pattern, not a Zoom docs claim.

**Verdict**: ✅ **Sound design.**
- Caching the JWT for `exp - 60s` (29 min) is appropriate — the token is valid for 30 min, and the 60s margin prevents edge-case expiry between mint and use.
- Race-safe promise memoisation is a correct concurrency pattern.
- The `userId` dimension in the cache key is important: different users get different role assignments (host vs attendee), so per-user caching is correct.
- `resetZoomSdkSignatureCache` for invalidation (e.g., when a meeting provider is reconfigured) is a sound escape hatch.

---

## 5. Role Assignment — Host=1, Attendee=0

**Claim** (`specs.md` REQ-2 AC-6, line 113):
> Actor is the linked class teacher or schedule owner → `role: 1`; otherwise `role: 0`.

**Official source**: Zoom Meeting SDK Auth docs.

**Verdict**: ✅ **Correct.**
- `role: 1` = host/start meeting; `role: 0` = attendee/join meeting.
- The plan correctly maps host (teacher/schedule owner) to role 1 and everyone else to role 0.
- **⚠️ Edge case**: If a teacher delegates co-host privileges in Zoom, the role mapping doesn't account for it — but this is an acceptable v1 simplification (co-host is a Zoom-side runtime concept, not a JWT-role concept).

---

## 6. OBF Token Endpoint & Scope

**Claim** (`specs.md` REQ-3 AC-1, line 127):
> `GET https://api.zoom.us/v2/users/{userId}/token?type=onbehalf&meeting_id={meeting_id}` (requires `user:read:token` scope).

**Official source**: Zoom OBF FAQ (`https://developers.zoom.us/docs/meeting-sdk/obf/`).

**Verdict**: ✅ **Correct.**
- The OBF token endpoint path and query params match official docs.
- `type=onbehalf` and `meeting_id` query parameter are correct.
- `user:read:token` is the correct granular scope (confirmed via Zoom granular scopes doc).

---

## 7. OBF Enforcement Date — March 2, 2026

**Claim** (`outcome/research-verification-outcome.md`, correction applied):
> OBF enforcement date is **March 2, 2026** (not Feb 23, 2026 — Feb 23 is the readiness deadline, not enforcement).

**Official source**: Zoom OBF FAQ.

**Verdict**: ✅ **Correct (correction was properly applied).**
- The research-verification-outcome correctly distinguishes the readiness deadline (Feb 23) from the enforcement date (March 2, 2026).
- This was one of the 14 corrections applied — the original spec conflated the two dates, and the verification outcome fixed it.

---

## 8. OBF vs ZAK — Mutual Exclusivity in `client.join()`

**Claim** (`specs.md` REQ-3 AC-1, line 127):
> `obfToken` and `zak` are mutually exclusive in `client.join()`.

**Official source**: Zoom JoinOptions (`https://marketplacefront.zoom.us/sdk/meeting/web/components/interfaces/JoinOptions.html`).

**Verdict**: ✅ **Correct.**
- JoinOptions docs: `obfToken` — "Optional 'obfToken' param to pass to the backend. Mutually exclusive with zak."
- The plan correctly captures this constraint.

**⚠️ Framing issue**: See Issue #2 in `04-issues-and-recommendations.md` — the plan's user story for REQ-3 frames OBF under "external participant" without distinguishing:
- **OBF** = app-as-participant (the SDK app itself joins on behalf of a user identity). Requires an authorized user already in the meeting.
- **ZAK** = user-as-participant (a real person's OAuth token starts/joins the meeting). No pre-existing user needed.

The plan treats them as a simple "external vs internal" switch, which is functionally correct for the join call but conceptually conflates two different Zoom concepts.

---

## 9. OBF User-Presence Sequencing Constraint

**Claim**: Not explicitly stated in the plan.

**Official source**: Zoom OBF FAQ.

**Verdict**: ⚠️ **Missing constraint.**
- Zoom's OBF FAQ states that OBF tokens represent the **app** joining the meeting, and the app can only join **after an authorized user is already in the meeting**. If no authorized user is present, the OBF-based join will fail or sit in the waiting room.
- The plan's REQ-3 does not surface this sequencing constraint to the frontend. The `ZoomEmbeddedSurface` component (REQ-5) does not implement a "waiting for host" state for the OBF-token join path.
- **Risk**: For external meetings where the first joiner is an external participant using an OBF token, the join will fail because no authorized host is in the meeting yet. The frontend should show a "waiting for host to start the meeting" state.

See Issue #1 in `04-issues-and-recommendations.md`.

---

## 10. Component View (Desktop) vs Client View (Mobile)

**Claim** (`specs.md` REQ-5 AC-1, AC-2, lines 162–163):
> Desktop: Component View via `ZoomMtgEmbedded.createClient()`. Mobile: Client View because Component View is desktop-only.

**Official source**: Zoom Meeting SDK Web docs (`https://developers.zoom.us/docs/meeting-sdk/web/`).

**Verdict**: ✅ **Correct.**
- Zoom's Component View is documented as desktop-only (full in-page embed with gallery/chat widgets).
- Client View is the full-screen overlay used for mobile (and as a desktop fallback).
- The tier rule (Component View on desktop, Client View on mobile) is correct and aligns with Zoom's documented capabilities.

---

## 11. `client.join()` — `password` (Component View) vs `passWord` (Client View)

**Claim** (`specs.md` REQ-5 AC-1, line 162):
> Component View uses `password` (lowercase); Client View (`ZoomMtg.join`) uses `passWord` — tier-specific wrappers handle this.

**Official source**: Zoom JoinOptions (Component View) shows `password` (lowercase). Client View `ZoomMtg.join` API uses `passWord` (camelCase).

**Verdict**: ✅ **Correct.**
- Component View `JoinOptions`: `password?: string` (lowercase).
- Client View `ZoomMtg.join()` historically uses `passWord` (camelCase) — this is a known Zoom SDK quirk.
- The plan correctly captures the casing difference and delegates it to tier-specific wrappers.

---

## 12. Webhook HMAC Verification — `x-zm-signature` with `v0:` prefix

**Claim** (`trackable-tasks.md` line 601):
> Verify HMAC-SHA256 of `v0:<timestamp>:<rawBody>` against `x-zm-signature` header using `ZOOM_WEBHOOK_SECRET_TOKEN`; `crypto.timingSafeEqual` for constant-time compare.

**Official source**: Zoom Webhooks docs (`https://developers.zoom.us/docs/api/webhooks/`).

**Verdict**: ✅ **Correct.**
- Webhook docs confirm: message string = `v0:{x-zm-request-timestamp}:{request-body}`, HMAC-SHA256 with secret token, hex output, compare with `x-zm-signature` header value.
- The `v0:` prefix is correct.
- `crypto.timingSafeEqual` for constant-time comparison is a security best practice (prevent timing attacks).
- Using the raw request body (not re-serialized JSON) is critical — the docs example uses `JSON.stringify(request.body)`, but for production, the raw body must be used to avoid key-ordering differences. The plan says `<rawBody>` which is correct.

---

## 13. Webhook `endpoint.url_validation` — `encryptedToken` Field Name

**Claim** (`trackable-tasks.md` line 603):
> For `endpoint.url_validation` event: respond with `{ plainToken, encryptedToken }` where `encryptedToken = HMAC-SHA256(plainToken, ZOOM_WEBHOOK_SECRET_TOKEN)` hex (NOT `encryptedTimestamp`).

**Official source**: Zoom Webhooks docs (url_validation section).

**Verdict**: ✅ **Correct (correction was properly applied).**
- Webhook docs confirm the response shape: `{ "plainToken": "...", "encryptedToken": "..." }` where `encryptedToken` = HMAC-SHA256(plainToken, secret) hex.
- The plan explicitly notes "NOT `encryptedTimestamp`" — this was one of the 14 corrections in research-verification-outcome.md (the original spec used the wrong field name).
- The correction is accurate and well-documented.

---

## 14. Participant Report Scope — `report:read:list_meeting_participants:admin`

**Claim** (`draft plan` attendance telemetry):
> Uses `report:read:list_meeting_participants:admin` scope for participant report polling.

**Official source**: Zoom Granular Scopes doc.

**Verdict**: ✅ **Correct (correction was properly applied).**
- The granular scopes doc confirms `report:read:list_meeting_participants:admin` as the correct granular scope.
- The legacy scope `report:read:admin` is deprecated — the research-verification-outcome correctly caught and updated this.
- This was another of the 14 corrections applied.

---

## 15. OBF Token Caching — `min(tokenTTL - 120, 1800)s`

**Claim** (`specs.md` REQ-3 AC-5, line 131):
> Cache OBF token in-memory for the shorter of (token TTL − 120 s) or 30 minutes, keyed by `(meetingNumber, actorUserId)`.

**Official source**: N/A — implementation pattern.

**Verdict**: ✅ **Sound design.**
- The 120s margin (vs 60s for the SDK JWT) is conservative but reasonable for OBF tokens, which may have shorter TTLs.
- Capping at 30 minutes prevents stale OBF tokens from causing join failures.
- Keyed by `(meetingNumber, actorUserId)` is correct — OBF tokens are per-actor-per-meeting.

---

## 16. `meetingSurfaceContext` — `fetchPolicy: 'no-cache'`

**Claim** (`specs.md` REQ-2 AC-8, line 115):
> Front-end `useMeetingSurfaceContextViewModel` hook SHALL query with `fetchPolicy: 'no-cache'` (Apollo Client v4 does not auto-respect HTTP `Cache-Control` headers).

**Official source**: N/A — Apollo Client implementation detail.

**Verdict**: ✅ **Correct and important.**
- Apollo Client v4 does not auto-respect HTTP `Cache-Control` no-store headers — `fetchPolicy: 'no-cache'` is required to prevent caching SDK signatures.
- Caching SDK signatures would be a security risk (stale signatures could be replayed).
- The resolver also setting `cacheControl: { scope: "Private", maxAge: 0 }` is defense-in-depth for HTTP intermediaries.

---

## 17. Recording Webhook — `recording.completed` Event

**Claim** (`trackable-tasks.md` line 460):
> Parse payload per Zoom `recording.completed` schema; map to `ClassMeetingRecording` row shape.

**Official source**: Zoom Webhooks docs — `recording.completed` is a documented webhook event.

**Verdict**: ✅ **Correct.**
- `recording.completed` is a valid Zoom webhook event for cloud recordings.
- The plan's choice to use webhook-driven ingestion for Zoom recordings (vs polling) is correct and efficient.

---

## Summary Table — Draft Plan Zoom Claims

| # | Claim | Source | Verdict |
|---|-------|--------|---------|
| 1 | Separate SDK app type + env keys | specs REQ-1 | ✅ |
| 2 | SDK JWT payload fields | specs REQ-2 | ✅ |
| 3 | SDK JWT `exp` bounds [1800, 172800] | specs REQ-2 | ✅ (⚠️ at minimum bound) |
| 4 | SDK JWT caching pattern | specs REQ-2 | ✅ (implementation design) |
| 5 | Role assignment host=1, attendee=0 | specs REQ-2 | ✅ |
| 6 | OBF token endpoint + scope | specs REQ-3 | ✅ |
| 7 | OBF enforcement date March 2, 2026 | verification-outcome | ✅ (correction applied) |
| 8 | OBF/ZAK mutual exclusivity | specs REQ-3 | ✅ (⚠️ framing issue) |
| 9 | OBF user-presence sequencing | specs REQ-3 | ⚠️ Missing constraint |
| 10 | Component View desktop, Client View mobile | specs REQ-5 | ✅ |
| 11 | `password` vs `passWord` casing | specs REQ-5 | ✅ |
| 12 | Webhook HMAC `v0:` verification | trackable-tasks 7.2 | ✅ |
| 13 | `encryptedToken` field name | trackable-tasks 7.2 | ✅ (correction applied) |
| 14 | Participant scope `report:read:list_meeting_participants:admin` | verification-outcome | ✅ (correction applied) |
| 15 | OBF token caching pattern | specs REQ-3 | ✅ (implementation design) |
| 16 | `fetchPolicy: 'no-cache'` for signatures | specs REQ-2 | ✅ (Apollo detail) |
| 17 | `recording.completed` webhook event | trackable-tasks 5.1 | ✅ |

**Overall**: The draft plan's Zoom claims are accurate. The research-verification-outcome process successfully caught and corrected several issues (OBF date, `encryptedToken` field name, participant scope, `appKey` in JWT, `sdkKey` deprecation). Three residual items need attention: OBF user-presence sequencing (Issue #1), OBF vs ZAK framing (Issue #2), and JWT at minimum bound (Issue #3).

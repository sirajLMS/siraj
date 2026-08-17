# Zoom Issues & Recommendations

This file consolidates all Zoom-specific issues found during the analysis, ranked by severity, with recommendations for the team. **No plan or doc files were modified** — these are recommendations only.

---

## Issue #1 — OBF User-Presence Sequencing Constraint (Medium)

### Problem

The draft plan's `ZoomObfTokenService` (REQ-3) resolves an OBF token for external participants to join a meeting. However, the plan does not surface the **user-presence sequencing constraint** documented in Zoom's OBF FAQ:

> An OBF token allows the **SDK app** to join the meeting on behalf of a user identity, but the app can only join **after an authorized user is already in the meeting**.

If the first joiner is an external participant using an OBF token, and no authorized host/co-host is in the meeting yet, the join will fail or sit in the waiting room indefinitely.

### Where

- `in-app-meeting-view/specs.md` REQ-3 (ZoomObfTokenService) — missing sequencing constraint
- `in-app-meeting-view/specs.md` REQ-5 (ZoomEmbeddedSurface) — no "waiting for host" state for OBF joins

### Impact

For external meetings where:
1. The host (teacher) has not yet joined, AND
2. The first joiner is an external participant (e.g., a parent joining a parent-teacher conference)

…the external participant's in-app embedded join will hang or fail with no clear error message.

### Recommendation

1. Add a "waiting for host" state to `ZoomEmbeddedSurface` that polls the meeting's participant list (via the Zoom API) to detect when an authorized host has joined.
2. Surface a translated message: "Waiting for the host to start the meeting" while polling.
3. Document the sequencing constraint in the runbook: "OBF-token joins require an authorized user already in the meeting. For external-only meetings, ensure the host joins first or joins simultaneously."
4. Consider a backend pre-join hook that uses the host's S2S token to join the meeting first (as a bot), then allows external OBF joins — though this adds complexity and should be a v2 consideration.

---

## Issue #2 — OBF vs ZAK Framing Conflation (Low)

### Problem

The draft plan's REQ-3 user story frames OBF under "external participant joining an in-app-embedded Zoom meeting," which conflates two distinct Zoom concepts:

- **OBF (On-Behalf-Of) tokens** represent the **app** joining the meeting. They are for automated/bot joins where the SDK app itself is the participant. Requires an authorized user already in the meeting.
- **ZAK (Zoom Access) tokens** represent a **person** joining the meeting via OAuth. They are for user-on-behalf joins where a real human's identity starts/joins the meeting. No pre-existing user needed.

The plan treats them as a simple "external vs internal meeting" switch (REQ-3 AC-6: "internal joins return `null` and join with `zak: undefined`"), which is functionally correct for the `client.join()` call but conceptually conflates the two.

### Where

- `in-app-meeting-view/specs.md` REQ-3 user story (line 123): "As an external participant..."

### Impact

Low — the implementation is functionally correct (OBF for external, no token for internal). The conflation is conceptual, not behavioral. However, it could mislead future implementers who read the Zoom OBF FAQ and expect the two concepts to be used differently.

### Recommendation

Clarify REQ-3's user story and acceptance criteria to distinguish:
- "External meeting with OBF" = app joins on behalf of an external user identity (requires host presence).
- "Internal meeting" = user joins with no token (ZAK is for OAuth user-on-behalf starts, not in-scope for v1 embedded joins).

This is a documentation/comment clarity improvement, not a behavioral change.

---

## Issue #3 — SDK JWT at Minimum Bound (Low)

### Problem

The draft plan's `ZoomSdkSignatureService` uses `exp = iat + 1800` (30 minutes), which is exactly at Zoom's documented **minimum** bound (`exp - iat >= 1800s`). Combined with `iat = now - 30s` (backdated for clock skew), the effective real-time lifetime is ~1740s (29 min).

If the server clock drifts more than 30s ahead of Zoom's validation server, the JWT's `exp - iat` could be computed as less than 1800s by Zoom's validator, causing rejection.

### Where

- `in-app-meeting-view/specs.md` REQ-2 AC-1 (line 108): `exp: iat+1800`
- `in-app-meeting-view/specs.md` REQ-2 AC-2 (line 109): bounds `[1800, 172800]`

### Impact

Low — the 30s backdate (`iat = now - 30s`) provides some clock-skew tolerance, and JWT validation typically allows a few seconds of skew. However, running at the exact minimum leaves no margin for server clock drift beyond 30s.

### Recommendation

Consider using `exp = iat + 3600` (60 minutes) instead of 1800 (30 min). This:
- Stays well within Zoom's bounds [1800, 172800].
- Doubles the effective lifetime to ~3540s (59 min) real-time.
- Eliminates clock-skew risk at the minimum boundary.
- Has negligible cost (JWTs are cached for `exp - 60s`, so a 60-min JWT is cached for 59 min vs 29 min — same number of mints per meeting).
- The cache TTL would increase from 29 min to 59 min, reducing server load for long meetings.

If the team prefers to keep 30 min for security reasons (shorter token lifetime = less replay risk), document the clock-skew tradeoff explicitly.

---

## Issue #4 — Refresh Token 90-Day Expiry Unverified (Informational)

### Problem

The finished plan's `research-outcome.md` (line 119) claims:

> Refresh tokens expire in 90 days (per docs).

This claim could not be directly verified from the fetched Zoom OAuth documentation. The fetched pages discuss refresh-token rotation but do not explicitly state a 90-day expiry duration.

### Where

- `auto-meeting-url/outcome/research-outcome.md` line 119

### Impact

Low — the plan correctly treats `invalid_grant` as the authoritative re-auth trigger regardless of the stated duration. Even if the 90-day figure is wrong, the `ProviderReauthRequiredError` + "Reconnect your Zoom account" UX will fire correctly when the token actually expires.

However, if the expiry is shorter than 90 days (e.g., 30 days), users may see the "Reconnect" prompt more frequently than expected, leading to support tickets.

### Recommendation

1. Do not rely on the 90-day figure for any proactive renewal logic.
2. Treat `invalid_grant` as the sole authority for re-auth triggers (the plan already does this correctly).
3. If proactive renewal is ever needed, verify the actual expiry duration directly with Zoom support or by testing.
4. Consider adding a note to the canonical doc: "Refresh token expiry duration is Zoom-account-policy-dependent; treat `invalid_grant` as the authoritative trigger."

---

## Issue #5 — `participant_video` Internal Inconsistency (Informational)

### Problem

The finished plan has an internal inconsistency on the `participant_video` setting in the Zoom create-meeting request body:

- `research-outcome.md` (line 30): `"participant_video": false`
- `trackable-tasks.md` (line 224): `participant_video: true`

### Where

- `auto-meeting-url/outcome/research-outcome.md` line 30
- `auto-meeting-url/trackable-tasks.md` line 224

### Impact

Informational — both values are valid Zoom settings. The inconsistency is between two artifacts of the same finished plan; the executed code (canonical doc) should be checked for which value was actually used. This does not affect Zoom API compatibility.

### Recommendation

Check `backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts` (the implemented adapter) to confirm which value was used. If `true` (participants join with video on), consider whether this is appropriate for educational meetings (students may not want cameras on by default). If `false` (participants join with video off), update the trackable-tasks artifact for consistency.

---

## Summary of Issues

| # | Issue | Severity | Action Required |
|---|-------|----------|----------------|
| 1 | OBF user-presence sequencing | Medium | Add "waiting for host" state to embedded surface |
| 2 | OBF vs ZAK framing conflation | Low | Clarify REQ-3 user story (documentation) |
| 3 | SDK JWT at minimum bound | Low | Consider `exp = iat + 3600` (60 min) |
| 4 | Refresh token 90-day expiry unverified | Informational | Treat `invalid_grant` as sole authority |
| 5 | `participant_video` internal inconsistency | Informational | Check executed adapter code |

---

## What's Correct (Reassurance)

The following are **correctly implemented or planned** and need no changes:

- ✅ S2S OAuth endpoint, grant type, and "no refresh token" pattern
- ✅ S2S scope `meeting:write:admin`
- ✅ Create meeting endpoint (`POST /v2/users/me/meetings`), body shape, and `type: 2`
- ✅ Create meeting response handling (`join_url`, `start_url`, `password`)
- ✅ Delete meeting endpoint (`DELETE /v2/meetings/{meetingId}`, `204`)
- ✅ Security note (disable all features → Zoom re-enables one; read back response)
- ✅ User OAuth flow (authorize, token, refresh, revoke)
- ✅ Refresh token rotation (persist new token after every refresh)
- ✅ SDK JWT payload (`appKey`, `sdkKey`, `mn`, `role`, `iat`, `exp`, `tokenExp`)
- ✅ `appKey` and `sdkKey` both included (same value) for cross-platform compat
- ✅ `sdkKey` deprecated in `client.join()` — only in JWT payload
- ✅ HS256 signing algorithm
- ✅ OBF token endpoint (`GET /v2/users/{userId}/token?type=onbehalf&meeting_id={meeting_id}`)
- ✅ OBF scope `user:read:token`
- ✅ OBF enforcement date (March 2, 2026 — corrected from Feb 23)
- ✅ OBF/ZAK mutual exclusivity in `client.join()`
- ✅ Component View (desktop) vs Client View (mobile) tier rule
- ✅ `password` (Component View) vs `passWord` (Client View) casing
- ✅ Webhook HMAC verification (`v0:timestamp:body`, `x-zm-signature`, `ZOOM_WEBHOOK_SECRET_TOKEN`)
- ✅ Webhook `endpoint.url_validation` response (`encryptedToken`, not `encryptedTimestamp`)
- ✅ Participant report scope (`report:read:list_meeting_participants:admin` — corrected)
- ✅ `fetchPolicy: 'no-cache'` for SDK signature queries (Apollo Client v4)
- ✅ `recording.completed` webhook event for recording ingestion
- ✅ Env-key separation (S2S vs Meeting SDK)
- ✅ Hybrid auth pattern consistency (MeetingChannelFactory reuse)
- ✅ Error type hierarchy (complementary, no collisions)
- ✅ Provider slug convention (`providerKind` with `_oauth` suffix vs `providerSlug` bare)

**Conclusion**: Both plans are technically sound on Zoom integration. The issues found are medium-to-low severity and primarily relate to edge cases (OBF sequencing), documentation clarity (OBF vs ZAK framing), and minor risks (JWT at minimum bound). No errors were found that would cause Zoom API failures in the happy path.

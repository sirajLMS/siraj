# Zoom Token Types & Auth Semantics

This document consolidates the five Zoom token and authentication mechanisms verified during the Zoom meeting-URL fixes plan. Each section covers the token's purpose, lifetime/caching semantics, and constraints that affect implementation. This is the canonical reference for Zoom auth — `docs/services/meeting-providers.md` covers the adapter/factory pattern and provider-agnostic concerns.

## SDK JWT

**Purpose:** Meeting SDK auth token. The client-side Zoom Meeting SDK requires a JWT signed server-side to initialize and join/preview a meeting.

**Lifetime:**
- `exp = iat + 3600` (60 minutes) — 2× Zoom's documented minimum of 1800 s (30 min). The wider margin protects against server clock drift.
- 30-second `iat` backdate to accommodate client-side clock skew (effective lifetime ~3570 s).
- JWTs are cached until `exp - 30 s`. A repeat signature request for the same `(actorUserId, meetingNumber, role)` within this window returns the cached signature instead of re-minting.
- `exp - iat` MUST remain within `[1800, 172800]` seconds (Zoom's documented bounds — 30 min minimum, 48 h maximum). The plan default widens from the 1800 minimum to 3600; it never narrows below Zoom's minimum.

**Caching:** Per-`(actorUserId, meetingNumber, role)` memoisation. The `ZoomSdkSignatureService` owns the cache and returns `tokenExp` so the client can validate before presenting.

**Source:** Zoom Meeting SDK Auth docs; verified in `.ai/analysis/zoom/`.

---

## OBF (On-Behalf-Of)

**Purpose:** The SDK app joins as a participant *on behalf of* an external user (outside the host's Zoom tenant). Used after Zoom's March 2026 enforcement date for cross-tenant meeting joins.

**User-presence sequencing constraint (CRITICAL):** OBF tokens allow the SDK app to join **only after an authorized user (host or co-host) is already present in the meeting**. For external-only meetings where the host has not yet joined, the OBF join will sit in the waiting room or fail.

**"Waiting for the host" state:** When an OBF-joined external participant's join is blocked by the absence of a host, the `ZoomEmbeddedSurface` enters a "Waiting for the host" state:
1. Poll `GET /metrics/meetings/{meetingId}/participants` every 5 s to detect host arrival.
2. On host detection → resume SDK join.
3. On 10-minute timeout → show `hostJoinTimeout` translation + "Keep waiting" / "Leave" actions.

The `ZoomObfTokenService` surfaces a `hostPresenceRequired: true` flag when returning an OBF token for an external meeting. ZAK-issued joins set `hostPresenceRequired: false`.

**Per-audience note:** The WaitingForHost state applies only to external participants joining via OBF (e.g., parents). Teachers/hosts follow their normal host-join flow.

**v2 consideration (out of scope for v1):** A backend pre-join hook that joins the host first (as a bot via the host's S2S token), allowing external OBF joins without waiting, is a v2 consideration. v1 surfaces the waiting state and polls the participant API instead.

**Source:** Zoom OBF FAQ ("the app can only join after an authorized user is already in the meeting").

---

## ZAK (Zoom Access Key)

**Purpose:** A host-equivalent token for a specific person. The ZAK holder acts as the host — they can start the meeting, admit participants, and manage the session.

**No host-presence dependency:** Unlike OBF, ZAK-issued joins do not require an authorized host to be already in the meeting. The ZAK holder *is* the host-equivalent.

**OBF vs ZAK selection:** The choice between OBF and ZAK is a **per-meeting configuration** driven by whether external participants need host-like authority — NOT a generic "external vs internal" toggle. OBF is used when the SDK app joins on behalf of an external user (participant role, host-presence required). ZAK is used when a specific person needs host-equivalent authority (no dependency on another host being present).

**Source:** `.ai/analysis/zoom/04-issues-and-recommendations.md` Issue #2; verified in amended `in-app-meeting-view/specs.md` REQ-3.

---

## S2S (Server-to-Server OAuth)

**Purpose:** Org-level credentials for server-to-server API access. Used when the adapter operates without per-user OAuth context (e.g., system-level meeting management).

**Grant type:** `grant_type=account_credentials` at `https://zoom.us/oauth/token`.

**Lifetime:** Returns a JWT access token. No refresh token is issued. The token is cached until `exp - 60 s`. When it expires, the adapter re-calls the token endpoint to mint a new JWT.

**Scopes:** `meeting:write:admin` (S2S-level).

**Source:** `docs/services/meeting-providers.md` Zoom adapter section; `backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts`.

---

## Per-User OAuth

**Purpose:** Per-user access for actions scoped to a specific Zoom user (e.g., creating meetings as that user, with their settings).

**Flow:** `authorization_code` → `refresh_token` grant. The initial authorization code exchange produces an access token + refresh token. Subsequent token refreshes use the `refresh_token` grant type.

**Refresh-token rotation:** Zoom **rotates refresh tokens on every refresh** — each refresh exchange returns a new `refresh_token`. The adapter MUST persist the new `refresh_token` back to `MeetingProviderTokenRepository` after each refresh exchange.

**Re-auth trigger (CRITICAL):** There is **no documented absolute refresh-token lifetime** (no 90-day expiry). The `invalid_grant` error is the **sole authoritative signal** that re-auth is required. When `invalid_grant` surfaces, throw `ProviderReauthRequiredError` and show the "Reconnect your Zoom account" UI state. Do **NOT** build proactive renewal on a hardcoded 90-day clock.

**Scopes:** `meeting:write` (user-level).

**Source:** Zoom Token & Authorization Code Flow docs (fetched during analysis); verified in `.ai/finished_plans/auto-meeting-url/outcome/research-outcome.md`.

---

## Rules / Conventions

- **SDK JWT exp** MUST be `iat + 3600` (60 min), not the 1800 minimum. This is 2× Zoom's documented minimum for clock-drift safety.
- **OBF joins require an authorized host already in the meeting.** Surface a "Waiting for the host" state + poll the participant API every 5 s (10-min timeout) when the host has not joined.
- **`invalid_grant` is the sole re-auth trigger** for per-user OAuth. There is no documented 90-day refresh-token expiry. Do not build proactive renewal on a hardcoded clock.
- **participant_video** MUST be `true` to match the executed adapter behavior (`ZoomMeetingAdapter.ts:116`). The research-outcome's stale `false` value has been corrected.
- **OBF vs ZAK** is a per-meeting configuration driven by whether external participants need host-like authority — not a generic external/internal switch.
- **S2S tokens** have no refresh token — re-call the token endpoint when the cached JWT approaches expiry (`exp - 60 s`).
- **Per-user refresh tokens** are rotated on every refresh — always persist the new `refresh_token`.

## Related Documents

- `docs/services/meeting-providers.md` — Meeting provider adapter/factory pattern reference (auto URL generation)
- `.ai/analysis/zoom/` — Zoom analysis files (issues, recommendations, verified docs)
- `.ai/plans/zoom-meeting-fixes/` — This plan's specs, design, tasks, outcomes
- `.ai/draft_plans/in-app-meeting-view/` — The draft plan that inherits the corrected OBF/ZAK/SDK JWT specs
- `.ai/finished_plans/auto-meeting-url/` — The finished plan whose research-outcome was corrected

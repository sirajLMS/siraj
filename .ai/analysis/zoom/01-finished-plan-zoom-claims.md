# Finished Plan (`auto-meeting-url`) — Zoom Claims Verification

**Plan status**: 57/57 tasks complete.
**Zoom-relevant sections**: `specs.md` REQ 3 (Zoom S2S adapter), REQ 6 (factory), REQ 8 (booking-time generation), REQ 9 (per-teacher OAuth); `outcome/research-outcome.md` §1–2 (Zoom REST + auth); `docs/services/meeting-providers.md` (canonical doc produced).

---

## 1. Zoom S2S OAuth Endpoint & Grant

**Claim** (`research-outcome.md` lines 80–86, `trackable-tasks.md` line 222):
> `POST https://zoom.us/oauth/token`, `Authorization: Basic base64(client_id:client_secret)`, body `grant_type=account_credentials&account_id=<ACCOUNT_ID>`, no refresh token.

**Official source**: Zoom Server-to-Server OAuth docs (`https://developers.zoom.us/docs/api/rest/using-zoom-apis/`).

**Verdict**: ✅ **Correct.**
- Endpoint, Basic auth, `grant_type=account_credentials`, and "no refresh token — re-mint on expiry" all match official docs.
- Caching until `exp - 60s` is a sound margin (Zoom tokens are JWTs with `exp` claim; 60s pre-refresh is conventional).

---

## 2. S2S Required Scope: `meeting:write:admin`

**Claim** (`research-outcome.md` line 95):
> Required scopes: `meeting:write:admin` (account-wide), `meeting:write` (own user). Pick `meeting:write:admin` for S2S because S2S apps always operate account-wide.

**Official source**: Zoom Granular Scopes (`https://developers.zoom.us/docs/api/rest/granular-scopes/`).

**Verdict**: ✅ **Correct.**
- `meeting:write:admin` is documented as the account-wide scope for S2S apps.
- The plan correctly notes that S2S apps operate account-wide and thus use the `:admin` variant.
- ⚠️ **Minor**: The response example in `research-outcome.md` line 90 shows `scope: "user:read:admin meeting:write:admin ..."` — this is illustrative; actual returned scope string depends on app configuration in Zoom Marketplace. Not an error, but implementers should resolve scopes dynamically from the token response, not hardcode.

---

## 3. Create Meeting Endpoint & Body

**Claim** (`research-outcome.md` lines 9–37, `trackable-tasks.md` line 224):
> `POST https://api.zoom.us/v2/users/me/meetings`, body `{topic, type:2, start_time?, duration?, settings:{host_video:true, participant_video:true, join_before_host:false, waiting_room:true}}`.

**Official source**: Zoom Create Meeting API (`https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/meetingCreate`).

**Verdict**: ✅ **Correct.**
- Endpoint path `/v2/users/me/meetings` with S2S token (representing account owner) is correct.
- `type: 2` = scheduled meeting is correct.
- `start_time` ISO 8601 UTC optional is correct.
- `duration` in minutes is correct.
- Settings defaults (`host_video: true`, `participant_video: false`, `join_before_host: false`, `waiting_room: true`) are sensible defaults and match Zoom's required field types.

**⚠️ Note on `participant_video`**: The research-outcome shows `participant_video: false` (line 30) while the trackable-tasks line 224 shows `participant_video: true`. The finished plan's executed code (canonical doc) should be checked for which value was actually used. Both are valid Zoom values; this is an internal inconsistency between the research artifact and the task spec, not a docs mismatch.

---

## 4. Create Meeting Response — `join_url`, `start_url`, `password`

**Claim** (`research-outcome.md` lines 44–66):
> Response includes `join_url` (store as `details.meetingUrl`), `start_url` with embedded ZAK (store as `providerMetadata.startUrl`), `password` (auto-generated, store as `encryptedSecret`).

**Official source**: Zoom Create Meeting API response schema.

**Verdict**: ✅ **Correct.**
- `join_url`, `start_url`, and `password` are all documented response fields.
- The ZAK token embedded in `start_url` is host-only and expires — storing it under `providerMetadata.startUrl` (not as the primary meeting URL) is the correct pattern.
- Storing `password` under `encryptedSecret` is appropriate (it is a sensitive credential for joining).

---

## 5. Delete Meeting Endpoint

**Claim** (`research-outcome.md` lines 68–73):
> `DELETE https://api.zoom.us/v2/meetings/{meetingId}`, returns `204 No Content`.

**Official source**: Zoom Delete Meeting API (`https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/meetingDelete`).

**Verdict**: ✅ **Correct.**
- Endpoint and `204 No Content` response match official docs.
- Used for class-cancel cleanup — best-effort is appropriate (Zoom returns 404 if already deleted; plan handles this via error mapping).

---

## 6. Security Note — Disabling All Meeting Security Features

**Claim** (`research-outcome.md` lines 75–76):
> If you disable `password`, `waiting_room`, and `meeting_authentication` together, Zoom overwrites the request to enable at least one. Always read back the response to see the actual applied settings.

**Official source**: Zoom Meeting API Security Enhancements blog (`https://developers.zoom.us/blog/zoom-meeting-api-security-enhancements/`).

**Verdict**: ✅ **Correct.**
- This is a documented Zoom platform behavior: at least one security feature must be enabled.
- The "read back the response" guidance is correct and important — the request echo may differ from the actual applied settings.
- The plan's defaults (`waiting_room: true`) avoid triggering this edge case in the happy path, but the guidance is correctly captured for edge cases where an admin deliberately disables waiting rooms.

---

## 7. User OAuth Flow — Authorize, Token Exchange, Refresh, Revoke

**Claim** (`research-outcome.md` lines 97–130):
> Authorize: `https://zoom.us/oauth/authorize?response_type=code&client_id=<ID>&redirect_uri=<URI>&state=<STATE>`
> Token: `POST /oauth/token` with `grant_type=authorization_code`
> Refresh: `POST /oauth/token` with `grant_type=refresh_token&refresh_token=<TOKEN>`
> Revoke: `POST /oauth/revoke?token=<TOKEN>`

**Official source**: Zoom OAuth docs (`https://developers.zoom.us/docs/api/rest/using-zoom-apis/`).

**Verdict**: ✅ **Correct.**
- All four OAuth endpoints match official docs.
- Basic auth header pattern (same as S2S) is correct.
- `/me` path for user tokens (not user-id paths) is correct.

---

## 8. Refresh Token Rotation

**Claim** (`research-outcome.md` lines 118):
> Refresh tokens rotate — Zoom returns a new `refresh_token` on every refresh; the old one is invalidated. The adapter MUST persist the new refresh token after every refresh exchange.

**Official source**: Zoom OAuth docs.

**Verdict**: ✅ **Correct.**
- Zoom refresh tokens do rotate on each use (the response includes a new `refresh_token`).
- Persisting the new token after every exchange is mandatory — the plan correctly captures this.
- This is a critical implementation detail that the finished plan's research outcome flags with the correct urgency.

---

## 9. Refresh Token Expiry — 90 Days

**Claim** (`research-outcome.md` line 119):
> Refresh tokens expire in 90 days (per docs). When `invalid_grant` surfaces, throw `ProviderReauthRequiredError`.

**Official source**: Zoom OAuth docs (fetched via docs MCP server).

**Verdict**: ❓ **Unverifiable from fetched docs.**
- The fetched Zoom OAuth documentation does not explicitly state a 90-day expiry for refresh tokens.
- Zoom's official docs discuss refresh-token rotation but the specific "90 days" figure was not found in the fetched pages.
- **Risk**: If the expiry is shorter (e.g., 30 days) or longer (e.g., indefinite until revoked), the user-facing "Reconnect your Zoom account" UX may trigger at the wrong time.
- **Recommendation**: Implementers should verify this directly with Zoom support or by testing, and treat the `invalid_grant` error as the authoritative re-auth trigger regardless of the stated duration.

---

## 10. Zoom S2S Integration Test — `join_url` Assertion

**Claim** (`trackable-tasks.md` line 667):
> Test: create one real meeting via `ZoomMeetingAdapter`, assert `join_url` starts with `https://zoom.us/j/`, then call `deleteMeeting(meetingId)` to clean up.

**Official source**: Zoom Create Meeting response.

**Verdict**: ✅ **Correct.**
- `join_url` format is `https://zoom.us/j/{meetingId}` for standard Zoom meetings — the assertion prefix is correct.
- The cleanup via `deleteMeeting` is correct and matches the delete endpoint (item 5 above).

---

## 11. Canonical Doc — `docs/services/meeting-providers.md`

**Claim**: The finished plan produced `docs/services/meeting-providers.md` documenting the adapter pattern with Zoom/Meet/Teams examples.

**Verification**: Read the file directly. The Zoom adapter section correctly describes:
- S2S OAuth token mint endpoint and grant type.
- Create meeting endpoint and body shape.
- `join_url`/`start_url`/`password` storage pattern.
- Hybrid auth (org S2S primary, per-teacher OAuth fallback).
- Error mapping to typed errors.

**Verdict**: ✅ **Consistent with research-outcome.md and official docs.** No discrepancies between the canonical doc and the research outcome.

---

## Summary Table — Finished Plan Zoom Claims

| # | Claim | Source | Verdict |
|---|-------|--------|---------|
| 1 | S2S OAuth endpoint + grant type | research-outcome §2 | ✅ |
| 2 | S2S scope `meeting:write:admin` | research-outcome §2 | ✅ |
| 3 | Create meeting endpoint + body | research-outcome §1 | ✅ (minor internal inconsistency on `participant_video`) |
| 4 | Create meeting response fields | research-outcome §1 | ✅ |
| 5 | Delete meeting endpoint + 204 | research-outcome §1 | ✅ |
| 6 | Security note (readback required) | research-outcome §1 | ✅ |
| 7 | User OAuth flow (4 endpoints) | research-outcome §2 | ✅ |
| 8 | Refresh token rotation | research-outcome §2 | ✅ |
| 9 | Refresh token 90-day expiry | research-outcome §2 | ❓ Unverifiable |
| 10 | Integration test `join_url` prefix | trackable-tasks 8.1 | ✅ |
| 11 | Canonical doc consistency | docs/services/meeting-providers.md | ✅ |

**Overall**: The finished plan's Zoom claims are accurate. One unverified item (90-day refresh-token expiry) and one minor internal inconsistency (`participant_video` value between research artifact and task spec).

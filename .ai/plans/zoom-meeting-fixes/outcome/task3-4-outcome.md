# Task 3 & 4 Outcome — research-outcome.md and meeting-providers.md Amendments

## Date
2026-08-17

## Summary

Two documentation files were amended to correct Issues #4 (refresh-token lifetime) and #5 (`participant_video`):

1. **`.ai/finished_plans/auto-meeting-url/outcome/research-outcome.md`** — corrected `participant_video: false` → `true` in three locations; replaced the stale "90 days" refresh-token expiry claim with the `invalid_grant`-sole-trigger language.
2. **`docs/services/meeting-providers.md`** — added `participant_video: true` to the documented Zoom create-meeting settings; appended the `invalid_grant` authoritative-signal note to the per-user OAuth path description.

No source code files were modified.

---

## Task 3 — research-outcome.md Amendments

### 3.2 — Correct participant_video (Issue #5)

**Location 1 — Request body (line 30):**

Before:
```json
    "participant_video": false,
```

After:
```json
    "participant_video": true,
```

**Location 2 — Narrative bullet (line 42):**

Before:
```
- `settings.waiting_room` (true), `settings.host_video` (true), `settings.participant_video` (false), `settings.join_before_host` (false) — sane defaults for educational meetings.
```

After:
```
- `settings.waiting_room` (true), `settings.host_video` (true), `settings.participant_video` (true), `settings.join_before_host` (false) — sane defaults for educational meetings. Updated post-analysis: the executed adapter (`backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts:116`) uses `participant_video: true`. The `trackable-tasks.md` value was correct; this research-outcome was stale.
```

**Location 3 — Response body settings echo (line 59):**

Before:
```json
  "settings": { "host_video": true, "participant_video": false, "waiting_room": true, "auto_recording": "cloud" }
```

After:
```json
  "settings": { "host_video": true, "participant_video": true, "waiting_room": true, "auto_recording": "cloud" }
```

### 3.3 — Correct the 90-day refresh-token claim (Issue #4)

**Line 119:**

Before:
```
- Refresh tokens expire in **90 days** (per docs). When `invalid_grant` surfaces, throw `ProviderReauthRequiredError` and show the "Reconnect your Zoom account" UI state.
```

After:
```
- Zoom does not document a fixed refresh-token lifetime. Treat `invalid_grant` as the sole re-auth trigger (verified from Zoom's Token & Authorization Code Flow docs fetched during analysis). When `invalid_grant` surfaces, throw `ProviderReauthRequiredError` and show the "Reconnect your Zoom account" UI state.
```

### 3.4 — Cross-reference grep audit

Grep pattern `90.day|90 day` (case-insensitive) across the entire `research-outcome.md`:
- **Result: 0 matches.** No numeric refresh-token lifetime is cited anywhere in the file.

---

## Task 4 — docs/services/meeting-providers.md Amendments

### 4.2 — Add participant_video to documented settings (Issue #5)

**Line 82:**

Before:
```
- **Create meeting**: `POST https://api.zoom.us/v2/users/me/meetings` with `type: 2` (scheduled) + sensible defaults (`waiting_room: true`, `join_before_host: false`, `host_video: true`). Returns `join_url` → stored as `details.meetingUrl`, `start_url` → `providerMetadata.startUrl`.
```

After:
```
- **Create meeting**: `POST https://api.zoom.us/v2/users/me/meetings` with `type: 2` (scheduled) + sensible defaults (`host_video: true`, `participant_video: true`, `waiting_room: true`, `join_before_host: false`, `mute_upon_entry: true`). Returns `join_url` → stored as `details.meetingUrl`, `start_url` → `providerMetadata.startUrl`.
```

Verified against the executed adapter (`ZoomMeetingAdapter.ts:114–120`):
- `host_video: true` ✅
- `participant_video: true` ✅
- `join_before_host: false` ✅
- `waiting_room: true` ✅
- `mute_upon_entry: true` ✅

### 4.3 — Add invalid_grant note (Issue #4)

**Line 81:**

Before:
```
- **Per-user path**: OAuth `authorization_code` → `refresh_token` grant. Zoom **rotates refresh tokens** on every refresh — the adapter MUST persist the new `refresh_token` back to `MeetingProviderTokenRepository` after each refresh exchange.
```

After:
```
- **Per-user path**: OAuth `authorization_code` → `refresh_token` grant. Zoom **rotates refresh tokens** on every refresh — the adapter MUST persist the new `refresh_token` back to `MeetingProviderTokenRepository` after each refresh exchange. There is **no documented absolute 90-day expiry** — the `invalid_grant` error is the *sole authoritative signal* that re-auth is required. Do **NOT** build proactive renewal on a hardcoded 90-day clock.
```

### 4.4 — Semantic review

- **Settings list matches adapter**: The amended line 82 lists `host_video: true, participant_video: true, waiting_room: true, join_before_host: false, mute_upon_entry: true` — matches `ZoomMeetingAdapter.ts:114–120` exactly. ✅
- **`invalid_grant` note emphasis**: The note uses **bold** for "no documented absolute 90-day expiry" and "NOT", plus *italics* for "sole authoritative signal" — marking it as authoritative. ✅
- **Grep audit for "90-day"**: Pattern `90.day|90 day` (case-insensitive) across the entire `docs/services/meeting-providers.md`:
  - **Result: 0 matches.** The only occurrence of "90-day" in the file is the qualified negation "no documented absolute 90-day expiry" on line 81, which explicitly warns against it. ✅

---

## Grep Audit Summary

| File | Pattern | Matches | Status |
|---|---|---|---|
| `research-outcome.md` | `90.day\|90 day` (case-insensitive) | 0 | ✅ Clean |
| `meeting-providers.md` | `90.day\|90 day` (case-insensitive) | 0 unqualified (1 qualified negation on line 81) | ✅ Clean |

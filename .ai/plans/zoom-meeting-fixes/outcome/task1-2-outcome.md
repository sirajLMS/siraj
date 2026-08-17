# Task 1 & 2 Outcome — Amend in-app-meeting-view specs.md & design.md

## Date
2026-08-17

## Summary

Tasks 1 and 2 amended the DRAFT `in-app-meeting-view` plan's `specs.md` and `design.md` to fix Issues #1 (OBF user-presence sequencing), #2 (OBF vs ZAK framing), and #3 (SDK JWT lifetime margin).

**No source code was modified** — only planning documents in `.ai/draft_plans/in-app-meeting-view/`.

---

## Task 1 — specs.md Amendments

### 1.2 — REQ-2 (ZoomSdkSignatureService) — Issue #3 (SDK JWT Lifetime)

**Before (line 108):**
```
exp: iat+1800, tokenExp: exp } signed with ...
```
```
2. WHEN the JWT is minted THEN `exp - iat` SHALL be in `[1800, 172800]` seconds (Zoom's documented bounds — 30 min minimum, 48 h maximum).
3. WHEN the signature request for the same `(actorUserId, meetingNumber, role)` repeats within a 30-minute window THEN the service SHALL return a cached signature instead of re-minting (per-meetingNumber+role+userId memoisation, TTL = `exp - 60s`).
```

**After (line 108):**
```
exp: iat+3600, tokenExp: exp } signed with ... Effective lifetime ~3570 s after the 30 s `iat` backdate. Server clock drift of up to ~30 s remains safe.
```
```
2. WHEN the JWT is minted THEN `exp - iat` SHALL be in `[1800, 172800]` seconds (Zoom's documented bounds — 30 min minimum, 48 h maximum); the plan default is `iat + 3600` (60 min), 2× the documented minimum, chosen for clock-drift margin without replay risk.
3. WHEN the signature request for the same `(actorUserId, meetingNumber, role)` repeats within a 60-minute window THEN the service SHALL return a cached signature instead of re-minting (per-meetingNumber+role+userId memoisation, TTL = `exp - 30s`).
```

### 1.3 — REQ-3 (ZoomObfTokenService) — Issue #1 + Issue #2

**Before (line 123):**
```
**User Story:** As an external participant (outside the host's Zoom tenant) joining an in-app-embedded Zoom meeting, I want an OBF token resolved server-side so I can join cross-tenant meetings after Zoom's March 2026 enforcement date.
```

**After (lines 123–131):**

User story rewritten to distinguish OBF vs ZAK with blockquote definitions:
- **OBF (On-Behalf-Of)** — SDK app joins on behalf of external user; host-presence required.
- **ZAK (Zoom Access Key)** — host-equivalent token; no host-presence dependency.
- "OBF vs ZAK is a per-meeting configuration driven by whether external participants need host-like authority — NOT a generic 'external vs internal' switch."

**New AC #7 added (line 141):**
```
7. WHEN an OBF token is used to join THEN the surface SHALL treat the join as dependent on an authorized host (host/co-host) already being present in the meeting; the OBF join will sit in the waiting room or fail if the host has not yet joined (see REQ-5 for the "Waiting for the host" UX). This constraint does NOT apply to ZAK-issued joins, where the ZAK holder is the host-equivalent.
```

**Glossary updated (lines ~495-496):**
- OBF token: added host-presence constraint text.
- ZAK token: changed from "alternative per-user host identity token, used when OBF is unavailable" to "host-equivalent token for a specific person. No host-presence dependency; the ZAK holder acts as host."

### 1.4 — REQ-5 (ZoomEmbeddedSurface) — Issue #1

**New ACs #9–#12 added (lines 179–186):**
- AC #9: WHEN OBF-joined participant's join blocked by absence of host THEN enter "Waiting for the host" state + poll `GET /metrics/meetings/{meetingId}/participants` every 5 s until host joins or 10-min timeout.
- AC #10: Translation keys from canonical i18n system (`shared/locale/types/dashboard/meeting-providers/` + `shared/locale/{en,ar}/dashboard/meeting-providers/`); define `waitingForHost` and `hostJoinTimeout` as `string` type (not `() => string`).
- AC #11: On 10-min timeout → show `hostJoinTimeout` + "Keep waiting" / "Leave" actions.
- AC #12: Per-audience note — WaitingForHost applies only to external OBF participants (e.g., parents); teachers/hosts follow normal flow.

---

## Task 2 — design.md Amendments

### 2.2 — SDK JWT cache section — Issue #3

**Decision section (lines 50–59):**
- Title: "for 30 minutes" → "with 60-minute TTL"
- Option 2 TTL: `exp - 60s` → `exp - 30s`
- Decision: "30-minute TTL (`exp = iat + 1800`, the Zoom minimum)" → "60-minute TTL (`exp = iat + 3600`, 2× the Zoom documented minimum of 1800 s)"
- Rationale: added "Effective lifetime ~3570 s after the 30 s `iat` backdate. JWTs are cached until `exp - 30 s`. Server clock drift of up to ~30 s remains safe."

**Component 2 (ZoomSdkSignatureService, lines 439–440):**
- Payload: `exp: iat+1800` → `exp: iat+3600`
- Cache TTL: `exp - 60s` → `exp - 30s`

### 2.3 — OBF resolution section — Issue #1

**OBF decision section (after line 70):**
- Added "Host-presence constraint (Issue #1)" blockquote with component-interaction pseudo-code:
  ```
  join() → ZoomObfTokenService.resolveOBFToken()
    → if no host in meeting:
        → enter "WaitingForHost" state
        → poll GET /metrics/meetings/{meetingId}/participants every 5 s
        → timeout after 10 min
    → on host detection → resume SDK join
    → on timeout → show hostJoinTimeout translation + "Keep waiting" / "Leave" buttons
  ```
- Added OBF vs ZAK per-meeting configuration note.
- Added per-audience note (external OBF participants only).

**Component 3 (ZoomObfTokenService, lines 472–488):**
- Added OBF vs ZAK blockquote definitions (matching specs.md).
- Added responsibility: "Surface a `hostPresenceRequired: true` flag when an OBF token is returned (external meeting) so the front-end `ZoomEmbeddedSurface` can enter the 'WaitingForHost' polling state per REQ-5 AC #9–#12. ZAK-issued joins set `hostPresenceRequired: false`."

**Error Handling table (line ~1024):**
- Added new row: "OBF join blocked — host not present" → `WaitingForHost` state in `ZoomEmbeddedSurface` → show translated `waitingForHost`, poll participant API every 5 s, on 10-min timeout show `hostJoinTimeout` + "Keep waiting" / "Leave".

### 2.4 — v2 backend pre-join hook note — Issue #1

**Added "Future Consideration: Backend Pre-Join Hook (v2)" subsection (lines 87–89):**
```
A backend pre-join hook that joins the host first (as a bot via the host's S2S token), allowing external OBF joins without waiting, is a v2 consideration. v1 surfaces the waiting state and polls the participant API instead. This is explicitly marked out of scope for v1.
```

### 2.5 — Translation keys section

**Added "Translation Keys (REQ-0.5 / Issue #1 — 'Waiting for the host')" section (lines 1146–1163):**
- Table defining `waitingForHost` (type `string`) and `hostJoinTimeout` (type `string`).
- Namespace: `shared/locale/types/dashboard/meeting-providers/` (type schema) + `shared/locale/{en,ar}/dashboard/meeting-providers/` (implementations).
- Convention: static strings typed as `string`, not `() => string`.
- Implementation ownership: belongs to the in-app plan, NOT this plan-correction plan.
- Namespace Registration requirements: (1) `MessageSchema` in `shared/locale/types/message.ts`, (2) path mapping in `shared/locale/serverLegacy.ts` `namespacePaths`, (3) `LocaleProvider` in `app/[locale]/layout.tsx`.

---

## Carry-Forward Notes

1. **No source code modified** — all amendments are to `.ai/draft_plans/in-app-meeting-view/specs.md` and `.ai/draft_plans/in-app-meeting-view/design.md` only.
2. The in-app-meeting-view plan's `trackable-tasks.md` may need paragraph updates to reference the new ACs (#7 in REQ-3, #9–#12 in REQ-5) — this is out of scope for the zoom-meeting-fixes plan; flag for the executing team.
3. The `ZoomObfTokenResult` interface in the design references a `reason` field but not yet a `hostPresenceRequired` boolean — the executing team should add `hostPresenceRequired: boolean` to the interface when implementing.
4. The `ZoomSdkSignatureResult` interface does not expose `tokenExp` — the executing team should verify the payload includes `tokenExp: exp` per the spec.
5. All EARS clauses use WHEN…THEN…SHALL form. No hardcoded translation strings — all reference the canonical i18n system path `shared/locale/types/dashboard/meeting-providers/` + `shared/locale/{en,ar}/dashboard/meeting-providers/`.
6. The JWT lifetime change does not narrow below Zoom's documented minimum of 1800 s — it widens to 3600 s.

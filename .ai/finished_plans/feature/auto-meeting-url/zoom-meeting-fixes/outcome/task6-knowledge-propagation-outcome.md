# Task 6 — Knowledge Propagation & Documentation Outcome

## Date
2026-08-17

## Summary

Task 6 synthesized all learnings from the zoom-meeting-fixes plan (Tasks 1–4 + plan reviews R1/R2) and propagated them into canonical documentation and AGENTS.md files. No source code was modified — only documentation and architectural rule files.

---

## 6.1 — Synthesized Learnings

The following recurring patterns and gotchas were extracted from all outcome files:

1. **OBF user-presence sequencing constraint** — OBF tokens allow the SDK app to join only *after* an authorized host/co-host is already in the meeting. External-only meetings where the host hasn't joined result in a waiting-room or join-failure state. The "Waiting for the host" UX state (poll participant API every 5 s, 10-min timeout) was added to the in-app-meeting-view spec.

2. **`invalid_grant` is the sole authoritative re-auth trigger** — Zoom does not document a fixed refresh-token lifetime. The stale "90 days" claim was corrected in both `research-outcome.md` and `docs/services/meeting-providers.md`. Proactive renewal on a hardcoded 90-day clock has no basis in Zoom docs.

3. **SDK JWT 60-minute margin** — Changed `exp` from `iat + 1800` (30 min, Zoom's documented minimum) to `iat + 3600` (60 min, 2× margin) for clock-drift safety. With a 30-second `iat` backdate, effective lifetime is ~3570 s. JWTs are cached until `exp - 30 s`.

4. **`participant_video` reconciliation** — `research-outcome.md` had stale `participant_video: false`; corrected to `true` to match the executed adapter (`ZoomMeetingAdapter.ts:116`). `docs/services/meeting-providers.md` was also updated to include `participant_video: true` in the documented settings.

5. **OBF vs ZAK conceptual distinction** — OBF (app-for-user, host-presence required) vs ZAK (user-as-host, no host-presence dependency). The choice is a per-meeting configuration driven by whether external participants need host-like authority — not a generic external/internal toggle.

---

## 6.2 — Canonical Reference Doc Created

**File:** `docs/services/zoom-token-types.md` (new)

Consolidates all five Zoom token/auth mechanisms:
- **SDK JWT** — Meeting SDK auth token; `exp = iat + 3600`; 30 s `iat` backdate; cached until `exp - 30 s`
- **OBF (On-Behalf-Of)** — SDK app joins on behalf of external user; requires authorized host already in meeting; "Waiting for host" state with polling + timeout
- **ZAK (Zoom Access Key)** — host-equivalent token; no host-presence dependency
- **S2S (Server-to-Server OAuth)** — org-level; `grant_type=account_credentials`; no refresh token; re-call when JWT expires
- **Per-user OAuth** — `authorization_code` → `refresh_token` grant; Zoom rotates refresh tokens on every refresh; `invalid_grant` is sole re-auth trigger (no documented 90-day expiry)

Includes "Rules / Conventions" section and "Related Documents" cross-references.

---

## 6.3 — Root AGENTS.md Updated

**File:** `/home/ahmed/Projects/siraj/AGENTS.md`

Added one-line reference under `## Important References`, immediately after the `docs/services/meeting-providers.md` line:
```
- `docs/services/zoom-token-types.md` - Zoom token kinds (SDK JWT, OBF, ZAK, S2S OAuth, per-user OAuth) semantics and constraints
```

---

## 6.4 — Backend AGENTS.md Files Updated

### `backend/services/AGENTS.md`
Added one-line rule to the "Meeting Provider Adapters (CRITICAL)" section:
```
- **Zoom refresh-token re-auth**: Treat `invalid_grant` as the sole authoritative trigger for re-auth — do NOT build proactive renewal on a hardcoded 90-day clock. See `docs/services/zoom-token-types.md`.
```

### `backend/AGENTS.md`
Added one-line reference to the "Important References" section:
```
- `docs/services/zoom-token-types.md` - Zoom token kinds (SDK JWT, OBF, ZAK, S2S OAuth, per-user OAuth) semantics and constraints
```

---

## Files Created/Modified

| File | Action |
|---|---|
| `docs/services/zoom-token-types.md` | **Created** — canonical Zoom token types reference |
| `AGENTS.md` (root) | **Modified** — added zoom-token-types.md to Important References |
| `backend/AGENTS.md` | **Modified** — added zoom-token-types.md to Important References |
| `backend/services/AGENTS.md` | **Modified** — added `invalid_grant` re-auth rule to Meeting Provider Adapters section |

---

## Final State of All Translations and References

- `docs/services/zoom-token-types.md` is cross-referenced from:
  - Root `AGENTS.md` Important References
  - `backend/AGENTS.md` Important References
  - `backend/services/AGENTS.md` Meeting Provider Adapters section
- The `invalid_grant` re-auth rule in `backend/services/AGENTS.md` links to `docs/services/zoom-token-types.md`
- `docs/services/meeting-providers.md` already contains the `invalid_grant` note (from Task 4) and `participant_video: true` (from Task 4)
- The `in-app-meeting-view/specs.md` and `design.md` already contain the OBF/ZAK/SDK JWT corrections (from Tasks 1–2)
- `research-outcome.md` already contains the `participant_video: true` and `invalid_grant` corrections (from Task 3)

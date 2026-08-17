# Zoom Meeting-URL Fixes — Requirements Specification

## Overview

This plan corrects five issues identified in `.ai/analysis/zoom/04-issues-and-recommendations.md` — discrepancies between existing planning documents and verified Zoom documentation. The fixes apply to **two prior plans**:

- **`in-app-meeting-view`** (draft, 0/51 tasks): Issues #1, #2, #3 amend its `specs.md` and `design.md` to surface the OBF user-presence sequencing constraint, clarify OBF vs ZAK framing, and widen the SDK JWT lifetime margin.
- **`auto-meeting-url`** (finished, 57/57 tasks): Issues #4, #5 correct a research-outcome mismatch and add a refresh-token note to the canonical provider doc.

**No source code is modified by this plan.** It is a plan-correction plan. Implementation teams executing `in-app-meeting-view` will inherit the corrected specs.

## Source Authority

All requirements trace to verified Zoom docs fetched during analysis:

- Zoom OBF FAQ → "the app can only join **after an authorized user is already in the meeting**"
- Zoom Meeting SDK Auth → SDK JWT minimum `exp` window: 30 min (1800 s); 60 min is a safer margin
- Zoom Token & Authorization Code Flow → refresh tokens are rotated on every refresh — no documented 90-day absolute expiry
- Zoom Create Meeting API → `participant_video` default `false`; an adapter MAY set `true` — but the plan and research-outcome must agree

---

## REQ-0 — Execution Protocol & Baseline

**User Story:** As the plan author, I want every task to begin from a recorded baseline and read prior outcome files, so that introduced defects are distinguishable from pre-existing issues.

**Acceptance Criteria:**
1. WHEN the plan starts THEN the author SHALL record tsgo/biome/lint counts in `outcome/phase0-baseline-outcome.md`.
2. WHEN any task begins THEN the executing agent SHALL read all existing files in `outcome/`.
3. WHEN any task completes THEN the executing agent SHALL write `outcome/<task-id>-outcome.md`.
4. WHEN any task completes THEN the executing agent SHALL mark its checkbox `[ ]` → `[x]` in `tasks.md`.

---

## REQ-0.5 — Translation & Enum Compliance

**User Story:** As the plan author, I want all user-facing strings in corrected specs to use the compile-time translation system, so that UI text remains localized and type-checked.

**Acceptance Criteria:**
1. WHEN the corrected `ZoomEmbeddedSurface` spec introduces a "Waiting for the host" user-facing string THEN the spec SHALL define it as a typed translation in the canonical i18n system at `shared/locale/types/dashboard/<namespace>/` (type schema), `shared/locale/{en,ar}/dashboard/<namespace>/` (implementations), and registered in `shared/locale/types/message.ts` (`MessageSchema`) per the Namespace Registration rules in `shared/AGENTS.md` — never inline. The natural namespace is the existing `meeting-providers` namespace (`shared/locale/types/dashboard/meeting-providers/`, `shared/locale/{en,ar}/dashboard/meeting-providers/`) or a new `in-app-meeting-view` sub-namespace under `dashboard/`.
2. WHEN the spec references a UserStatus/MeetingStatus enum THEN the spec SHALL use the canonical enum from `shared/` or `backend/enum/`, never a string literal.

---

## REQ-1 — OBF User-Presence Sequencing Constraint (Issue #1, Medium)

**Source:** Zoom OBF FAQ; `.ai/analysis/zoom/04-issues-and-recommendations.md` Issue #1.

**User Story:** As an external participant using an OBF token, I want the meeting surface to tell me when the host hasn't arrived yet, so that I don't sit in an indefinite join/spinner if I join before the authorized host.

**Acceptance Criteria:**
1. WHEN the `in-app-meeting-view/specs.md` is amended THEN the spec SHALL add a new acceptance criterion to **REQ-3 (ZoomObfTokenService)** stating: "OBF tokens allow the SDK app to join only **after an authorized user (host/co-host) is already in the meeting**. For external-only meetings where the host has not joined, the OBF join will sit in the waiting room or fail."
2. WHEN the `in-app-meeting-view/specs.md` is amended THEN the spec SHALL add a new acceptance criterion to **REQ-5 (ZoomEmbeddedSurface)** stating: "WHEN an OBF-joined external participant's join would be blocked by the absence of a host THEN the surface SHALL enter a 'Waiting for the host' state with a translated message and poll the participant list (via the Zoom API) until the host joins or a timeout (e.g., 10 min) is reached."
3. WHEN the `in-app-meeting-view/design.md` is amended THEN the design SHALL document a v2 backend option: a pre-join hook that joins the host (as a bot via the host's S2S token) first, allowing external OBF joins — and SHALL explicitly mark it out of scope for v1.
4. WHEN the spec references the "Waiting for the host" state THEN the string SHALL be a typed translation key referenced via the canonical i18n system in `shared/locale/` (per REQ-0.5), not hardcoded. Static strings with no parameters SHALL be typed as `string`, not `() => string`, per the `shared/AGENTS.md` Pluralization/Interpolation Pattern.

_Requirements: Fixes Issue #1 of the analysis._

---

## REQ-2 — OBF vs ZAK Framing Clarification (Issue #2, Low)

**Source:** `.ai/analysis/zoom/04-issues-and-recommendations.md` Issue #2.

**User Story:** As an engineer reading the in-app spec, I want OBF and ZAK described in distinct terms, so that I implement the correct participant-identity model without conflating the two token kinds.

**Acceptance Criteria:**
1. WHEN the `in-app-meeting-view/specs.md` REQ-3 user story is rewritten THEN it SHALL clearly distinguish:
   - **OBF (On-Behalf-Of)** — the SDK app joins as a participant on behalf of an external user; the app requires an authorized host already in the meeting.
   - **ZAK (Zoom Access Key)** — a host-equivalent token that lets a specific person act as host; no host-presence dependency.
2. WHEN the spec distinguishes them THEN the choice between OBF and ZAK SHALL be described as a per-meeting configuration driven by whether external participants need host-like authority — not as a generic "external vs internal" toggle.

_Requirements: Fixes Issue #2 of the analysis._

---

## REQ-3 — SDK JWT Lifetime Margin (Issue #3, Low)

**Source:** Zoom Meeting SDK Auth docs; `.ai/analysis/zoom/04-issues-and-recommendations.md` Issue #3.

**User Story:** As an engineer implementing the SDK JWT service, I want a wider `exp` margin than the documented minimum, so that server clock drift doesn't cause JWT rejection.

**Acceptance Criteria:**
1. WHEN the `in-app-meeting-view/specs.md` REQ-2 (ZoomSdkSignatureService) is amended THEN `exp` SHALL be set to `iat + 3600` (60 min) instead of `iat + 1800` (30 min — Zoom's documented minimum).
2. WHEN the `in-app-meeting-view/design.md` SDK JWT cache section is amended THEN the design SHALL note: "Effective lifetime is ~3570 s after the 30 s `iat` backdate. With JWTs cached until `exp - 30 s`, server clock drift of up to ~30 s remains safe."
3. WHEN the spec or design mentions the lifetime THEN it SHALL NOT use a value below Zoom's documented minimum of 1800 s — the change widens the margin, never narrows it.

_Requirements: Fixes Issue #3 of the analysis._

---

## REQ-4 — Refresh-Token 90-Day Expiry Correction (Issue #4, Informational)

**Source:** `.ai/analysis/zoom/04-issues-and-recommendations.md` Issue #4.

**User Story:** As an engineer reading the canonical provider doc, I want the refresh-token semantics to reflect Zoom's documented behavior, so that I don't build proactive 90-day renewal that has no basis in the docs.

**Acceptance Criteria:**
1. WHEN `docs/services/meeting-providers.md` is amended THEN it SHALL add a note under the Zoom per-user OAuth path: "Zoom **rotates refresh tokens** on every refresh. There is **no documented absolute 90-day expiry** — the `invalid_grant` error is the sole authoritative signal that re-auth is required. Do NOT build proactive renewal on a hardcoded 90-day clock."
2. WHEN the note is added THEN it SHALL italicize or otherwise mark the `invalid_grant` statement as authoritative.
3. WHEN the `auto-meeting-url/outcome/research-outcome.md` is amended THEN the line claiming a 90-day refresh-token expiry SHALL be corrected to state: "Zoom does not document a fixed refresh-token lifetime. Treat `invalid_grant` as the sole re-auth trigger (verified from Zoom's Token & Authorization Code Flow docs fetched during analysis)."

_Requirements: Fixes Issue #4 of the analysis._

---

## REQ-5 — participant_video Research-Outcome Correction (Issue #5, Informational)

**Source:** Verified against `backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts` line 116 — the executed adapter uses `participant_video: true`.

**User Story:** As an engineer auditing the finished plan, I want the research-outcome to match the adapter's actual behavior, so that the discrepancy noted in the plan's `trackable-tasks.md` isn't mistaken for a code mismatch.

**Acceptance Criteria:**
1. WHEN `auto-meeting-url/outcome/research-outcome.md` line 30 is amended THEN `participant_video: false` SHALL be corrected to `participant_video: true` to match the executed adapter code.
2. WHEN the corrected line is written THEN it SHALL include a note: "Updated post-analysis: the executed adapter (`backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts:116`) uses `participant_video: true`. The `trackable-tasks.md` value was correct; this research-outcome was stale."
3. WHEN `docs/services/meeting-providers.md` is reviewed for the correction THEN line 82 (which says `host_video: true`) SHALL ALSO be amended to include `participant_video: true` in the documented settings list so that the canonical doc and adapter agree.

_Requirements: Fixes Issue #5 of the analysis._

---

## Requirements Checklist

- [x] All affected plans identified (in-app-meeting-view + auto-meeting-url)
- [x] Normal cases covered (OBF/ZAK distinction, JWT margin)
- [x] Edge cases covered (external-only meetings where host arrives late)
- [x] Error cases covered (`invalid_grant` authoritative trigger, OBF join-failure state)
- [x] Requirements are testable — each AC references a specific document amendment
- [x] No conflicting requirements (the two plans are corrected independently)
- [x] EARS format used consistently (WHEN…THEN…SHALL)
- [x] Translation compliance addressed (REQ-0.5, REQ-1 AC #4)
- [x] Outcome Knowledge Base addressed (REQ-0)

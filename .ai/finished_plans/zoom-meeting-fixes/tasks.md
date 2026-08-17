# Zoom Meeting-URL Fixes — Actionable Tasks

## Execution Protocol (Applies to Every Task)

**BEFORE starting any task:**
1. Read ALL existing files in `.ai/plans/zoom-meeting-fixes/outcome/` to absorb prior research and decisions.
2. Read the affected plan's current `specs.md` / `design.md` / `research-outcome.md` before amending — do not amend blind.
3. Update the task status to `in_progress` in this file.

**AFTER completing any task:**
1. Write `.ai/plans/zoom-meeting-fixes/outcome/<task-id>-outcome.md` with: what was amended, exact line changes, and any carry-over notes.
2. Mark the task checkbox `[ ]` → `[x]` in this file.

## Applicable AGENTS.md & Instruction Files

This plan amends files in `.ai/` and `docs/` — no `frontend/`, `backend/`, or `shared/` source files. The applicable layer rule is `shared/AGENTS.md` (Translation System / Namespace Registration) when defining the `waitingForHost` and `hostJoinTimeout` translation keys: keys MUST live under `shared/locale/types/dashboard/meeting-providers/` (type schema) + `shared/locale/{en,ar}/dashboard/meeting-providers/` (implementations), be registered in `MessageSchema` (`shared/locale/types/message.ts`), given a path mapping in `shared/locale/serverLegacy.ts` `namespacePaths`, and wired into `LocaleProvider` if rendered at layout time. Static strings (no params) MUST be typed `string`, not `() => string`.

No `sub-loop.ts` quality loops apply — the artifacts are markdown files, not TypeScript. Tasks reference reading chapter-specific AGENTS.md as needed.

---

## Task 1 — Amend in-app-meeting-view specs.md (REQ-1, REQ-2, REQ-3)

- [x] 1.1 **Read context**
  - Read `.ai/draft_plans/in-app-meeting-view/specs.md` (current state of REQ-1, REQ-2, REQ-3, REQ-5).
  - Read `.ai/analysis/zoom/04-issues-and-recommendations.md` Issues #1, #2, #3 for the canonical wording.
  - _Requirements: REQ-1, REQ-2, REQ-3_

- [x] 1.2 **Amend REQ-2 (ZoomSdkSignatureService) — Issue #3**
  - Change the SDK JWT specification: `exp` SHALL be `iat + 3600` (60 min) instead of `iat + 1800` (30 min).
  - Add a note: "Effective lifetime ~3570 s after the 30 s `iat` backdate. Server clock drift of up to ~30 s remains safe."
  - _Requirements: REQ-3 AC #1, AC #2_

- [x] 1.3 **Amend REQ-3 (ZoomObfTokenService) — Issue #1 + Issue #2**
  - Add the user-presence sequencing constraint: "OBF tokens allow the SDK app to join only **after an authorized user (host/co-host) is already in the meeting**. For external-only meetings where the host has not joined, the OBF join will sit in the waiting room or fail."
  - Rewrite the REQ-3 user story to distinguish:
    - **OBF (On-Behalf-Of)** — SDK app joins on behalf of an external user; host-presence required.
    - **ZAK (Zoom Access Key)** — host-equivalent token for a specific person; no host-presence dependency.
  - Add: "OBF vs ZAK is a per-meeting configuration driven by whether external participants need host-like authority — NOT a generic 'external vs internal' switch."
  - _Requirements: REQ-1 AC #1, REQ-2 AC #1, AC #2_

- [x] 1.4 **Amend REQ-5 (ZoomEmbeddedSurface) — Issue #1**
  - Add a new acceptance criterion: "WHEN an OBF-joined external participant's join would be blocked by the absence of a host THEN the surface SHALL enter a 'Waiting for the host' state with a translated message and poll the participant list (via the Zoom `GET /metrics/meetings/{meetingId}/participants` API) every 5 s until the host joins or a 10-min timeout is reached."
  - Add: "The translated string SHALL be a typed translation key from the canonical i18n system in `shared/locale/types/dashboard/meeting-providers/` (type schema) + `shared/locale/{en,ar}/dashboard/meeting-providers/` (implementations), not hardcoded (per REQ-0.5)." Define two keys: `waitingForHost` ("Waiting for the host to start the meeting"), `hostJoinTimeout` ("The host hasn't joined yet. You can keep waiting or try again later."). Both keys are static strings (no params), so type them as `string`, not `() => string`.
  - Add per-audience note: "The WaitingForHost state applies only to external participants joining via OBF (e.g., parents). Teachers/hosts follow their normal host-join flow."
  - _Requirements: REQ-1 AC #2, AC #4_

- [x] 1.5 **Semantic review** — verify the amended `specs.md`:
  - All EARS clauses use "WHEN…THEN…SHALL" form.
  - No string literals where a translation key should be referenced.
  - The OBF/ZAK distinction is factually consistent with Zoom's OBF FAQ (the app joins only after an authorized user is in the meeting).
  - The JWT lifetime change doesn't narrow below Zoom's minimum (1800 s).
  - _Requirements: REQ-0.5, REQ-3 AC #3_

- [x] 1.6 **Write outcome file** — `.ai/plans/zoom-meeting-fixes/outcome/task1-outcome.md`
  - Record exact lines changed in `specs.md` (before/after diff excerpts).
  - Note any cross-reference pages that may need updating (design.md — see Task 2).
  - _Outcome written as combined `task1-2-outcome.md` per execution instructions._

---

## Task 2 — Amend in-app-meeting-view design.md (REQ-1, REQ-3)

- [x] 2.1 **Read context**
  - Read `.ai/draft_plans/in-app-meeting-view/design.md` (SDK JWT cache section, OBF resolution section).
  - Read `.ai/plans/zoom-meeting-fixes/specs.md` REQ-1, REQ-3 for the authoritative requirement text.
  - _Requirements: REQ-1, REQ-3_

- [x] 2.2 **Amend the SDK JWT cache section — Issue #3**
  - Change the `exp` value: `iat + 3600` (60 min) replacing any reference to `iat + 1800`.
  - Add the margin note: "Effective lifetime ~3570 s after the 30 s `iat` backdate. JWTs are cached until `exp - 30 s`. Server clock drift of up to ~30 s remains safe."
  - _Requirements: REQ-3 AC #2_

- [x] 2.3 **Amend the OBF resolution section — Issue #1**
  - Add a component-interaction diagram or block describing the "Waiting for the host" state in `ZoomEmbeddedSurface`:
    - `join()` → `ZoomObfTokenService.resolveOBFToken()` → if no host in meeting → enter `WaitingForHost` → poll `GET /metrics/meetings/{meetingId}/participants` every 5 s → timeout 10 min.
    - On host detection → resume SDK join.
    - On timeout → show `hostJoinTimeout` translation + "Keep waiting" / "Leave" buttons.
  - _Requirements: REQ-1 AC #2_

- [x] 2.4 **Add v2 backend pre-join hook note — Issue #1**
  - Explicitly mark as out-of-scope for v1: "A backend pre-join hook that joins the host first (as a bot via the host's S2S token), allowing external OBF joins, is a v2 consideration. v1 surfaces the waiting state and polls the participant API instead."
  - _Requirements: REQ-1 AC #3_

- [x] 2.5 **Add translation keys section**
  - Define the two required translation keys: `waitingForHost` (type `string`), `hostJoinTimeout` (type `string`). Reference the existing `meeting-providers` namespace (`shared/locale/types/dashboard/meeting-providers/` for the type schema; `shared/locale/{en,ar}/dashboard/meeting-providers/` for implementations).
  - Document that the implementation (adding keys to locale files) belongs to the in-app plan, not this plan-correction plan. The in-app plan MUST complete Namespace Registration per `shared/AGENTS.md`: (1) add to `MessageSchema` in `shared/locale/types/message.ts`, (2) add path mapping in `shared/locale/serverLegacy.ts` `namespacePaths`, (3) wire into `LocaleProvider` translations in `app/[locale]/layout.tsx` if rendered at layout time.
  - _Requirements: REQ-1 AC #4, REQ-0.5_

- [x] 2.6 **Semantic review** — verify the amended `design.md`:
  - The polling interval, timeout, and translation keys match the specs.md text exactly.
  - The v2 backend hook is marked out-of-scope, not in-scope.
  - No behavioral claim contradicts the OBF FAQ.
  - _Requirements: REQ-1 AC #4_

- [x] 2.7 **Write outcome file** — `.ai/plans/zoom-meeting-fixes/outcome/task2-outcome.md`
  - Record exact lines changed in `design.md`.
  - Note any references in `tasks.md` of the in-app-meeting-view plan that may need paragraph updates (out-of-scope for this plan — flag for the executing team).

---

## Task 3 — Amend research-outcome.md (REQ-4, REQ-5)

- [x] 3.1 **Read context**
  - Read `.ai/finished_plans/auto-meeting-url/outcome/research-outcome.md` lines 1–130 (Zoom REST + auth verification section).
  - Read `backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts:116` to confirm `participant_video: true`.
  - Read `.ai/finished_plans/auto-meeting-url/trackable-tasks.md` line 224 (`participant_video: true`).
  - _Requirements: REQ-4, REQ-5_

- [x] 3.2 **Correct participant_video — Issue #5**
  - Find line 30 (`"participant_video": false`) in `research-outcome.md`.
  - Change to `participant_video: true`.
  - Add a clarifying note on the same line or immediately below: "Updated post-analysis: the executed adapter (`backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts:116`) uses `participant_video: true`. The `trackable-tasks.md` value was correct; this research-outcome was stale."
  - _Requirements: REQ-5 AC #1, AC #2_

- [x] 3.3 **Correct the 90-day refresh-token claim — Issue #4**
  - Locate the line referencing a 90-day refresh-token expiry (around line 119 of the research-outcome.md).
  - Replace with: "Zoom does not document a fixed refresh-token lifetime. Treat `invalid_grant` as the sole re-auth trigger (verified from Zoom's Token & Authorization Code Flow docs fetched during analysis)."
  - _Requirements: REQ-4 AC #3_

- [x] 3.4 **Cross-reference check**
  - Grep the rest of `research-outcome.md` for any other mention of "90 day"/"90-day" and correct any occurrences the same way.
  - Ensure the corrected research-outcome does not cite any numeric refresh-token lifetime.
  - _Requirements: REQ-4 AC #3_

- [x] 3.5 **Write outcome file** — `.ai/plans/zoom-meeting-fixes/outcome/task3-4-outcome.md`
  - Record before/after of the two corrected lines.
  - Note the grep audit confirming no remaining "90 day"/"90-day" mention in `research-outcome.md`.

---

## Task 4 — Amend docs/services/meeting-providers.md (REQ-4, REQ-5)

- [x] 4.1 **Read context**
  - Read `docs/services/meeting-providers.md` (Zoom section, lines 70–90 and 115–125).
  - Confirm line 82 currently mentions `host_video: true` but not `participant_video`.
  - _Requirements: REQ-4, REQ-5_

- [x] 4.2 **Add participant_video to documented settings — Issue #5**
  - On line 82 (or the line describing Zoom create-meeting settings), add `participant_video: true` alongside `host_video: true`.
  - Format: `… host_video: true, participant_video: true, waiting_room: true, join_before_host: false, mute_upon_entry: true …` (match the adapter's actual values).
  - _Requirements: REQ-5 AC #3_

- [x] 4.3 **Add invalid_grant note — Issue #4**
  - Find the Zoom per-user OAuth path description (line 81: "Zoom **rotates refresh tokens** on every refresh…").
  - Append a sentence: "There is **no documented absolute 90-day expiry** — the `invalid_grant` error is the *sole authoritative signal* that re-auth is required. Do **NOT** build proactive renewal on a hardcoded 90-day clock."
  - _Requirements: REQ-4 AC #1, AC #2_

- [x] 4.4 **Semantic review** — verify the amended doc:
  - The settings list on line 82 matches the executed adapter (`host_video: true`, `participant_video: true`, `waiting_room: true`, `join_before_host: false`, `mute_upon_entry: true`).
  - The `invalid_grant` note is italicized or bolded to mark it as authoritative.
  - No "90-day" mention remains unqualified (if it appeared elsewhere in the doc).
  - _Requirements: REQ-4 AC #2, REQ-5 AC #3_

- [x] 4.5 **Write outcome file** — `.ai/plans/zoom-meeting-fixes/outcome/task3-4-outcome.md`
  - Record before/after of the amended doc lines.
  - Grep-audit confirmation that no unqualified "90-day" refresh-token mention remains in `docs/services/meeting-providers.md`.

---

## Task 5 — Phase 1.5 Plan Review Gate (MANDATORY)

- [x] 5.1 **Run @plan-review skill** on the complete plan bundle:
  - `.ai/plans/zoom-meeting-fixes/specs.md`
  - `.ai/plans/zoom-meeting-fixes/design.md`
  - `.ai/plans/zoom-meeting-fixes/tasks.md`
  - Capture every reported violation.
  - _Requirements: REQ-0_

- [x] 5.2 **Fix violations**
  - Apply every fix recommended by the skill.
  - Re-run `@plan-review` until output reads "Plan passes all AGENTS.md rules".
  - _Requirements: REQ-0_

- [x] 5.3 **Write outcome file** — `.ai/plans/zoom-meeting-fixes/outcome/plan-review-R1.md`
  - Record the number of violations found and fixed on each round.
  - Record the final "passes all rules" verdict.

---

## Task 6 — Knowledge Propagation & Documentation

- [x] 6.1 **Synthesize learnings** — Read all outcome files in `.ai/plans/zoom-meeting-fixes/outcome/` and extracted recurring patterns.
  - Key learnings: OBF user-presence sequencing constraint; `invalid_grant` as the sole authoritative re-auth trigger; SDK JWT 60-minute margin; `participant_video` reconciliation.
  - _Requirements: REQ-0_

- [x] 6.2 **Update canonical docs**
  - If `docs/services/meeting-providers.md` needs a dedicated section on OBF vs ZAK token semantics (per REQ-2 AC #1), add it.
  - If a dedicated `docs/services/zoom-token-types.md` is warranted (covering OBF, ZAK, SDK JWT, S2S OAuth in one place), create it.
  - _Requirements: REQ-2, REQ-4_

- [x] 6.3 **Update root AGENTS.md Important References**
  - If a new docs file was created in 6.2, add a one-line reference under `## Important References`:
    - e.g., `- docs/services/zoom-token-types.md — Zoom token kinds (OBF, ZAK, SDK JWT, S2S OAuth) semantics`
  - _Requirements: REQ-0_

- [x] 6.4 **Update layer AGENTS.md files**
  - If any layer-specific architectural rule is introduced (e.g., `backend/services/AGENTS.md` should note that refresh-token re-auth MUST be triggered by `invalid_grant` not a hardcoded clock), add it as a one-line rule with a doc reference.
  - _Requirements: REQ-0_

- [x] 6.5 **Write outcome file** — `.ai/plans/zoom-meeting-fixes/outcome/task6-knowledge-propagation-outcome.md`
  - Record which docs/AGENTS.md files were created or updated.
  - Record the final state of all translations and references.

---

## Tasks Checklist
- [x] All design components have implementation tasks (Tasks 1–4 cover specs, design, research-outcome, canonical doc)
- [x] Tasks ordered to respect dependencies (specs amended before design; plan review after all amendments; propagation last)
- [x] Each task produces a testable artifact (a markdown file amendment with a specific line citation)
- [x] Requirements references included for every subtask
- [x] Scope is appropriate (2–4 hours per task; Tasks 1–4 are ~1 hour each, Task 5 ~1–2 hours, Task 6 ~1 hour)
- [x] Quality loop task per file — N/A: artifacts are markdown files. Tasks 1.5, 2.6, 4.4 are semantic review tasks that replace the `sub-loop.ts` quality loop for markdown artifacts.
- [x] Instruction verification task per subtask — semantic review tasks check the amendment against AGENTS.md rules manually (e.g., translation compliance per REQ-0.5).
- [x] Drizzle schema convention — N/A (no schema changes)
- [x] Knowledge propagation — Task 6 covers doc creation, AGENTS.md updates, root AGENTS.md reference
- [x] Phase 1.5 Plan Review Gate — Task 5 invokes `@plan-review` as a mandatory gate

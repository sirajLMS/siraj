# WhatsApp Plan-Fixes — Requirements (specs.md)

**Date:** 2026-08-17
**Plan name:** `whatsapp-plan-fixes`
**Plan location:** `.ai/plans/whatsapp-plan-fixes/`
**Outcome directory:** `.ai/plans/whatsapp-plan-fixes/outcome/`
**Skill:** spec-driven-development
**Scope:** Documentation + Plan-file corrections only — **no source code changes**.

---

## 1. Background & Motivation

A read-only comparison (`/.ai/analysis/whatsapp/`, dated 2026-08-17) compared the
finished WhatsApp implementation plan set (`.ai/finished_plans/whatsapp/`) against
the canonical docs `docs/services/whatsapp-cloud-api.md` and
`docs/frontend/whatsapp-ui-patterns.md`. It surfaced **34 findings** across four
categories:

- **3 CRITICAL** (all in `.ai/finished_plans/whatsapp/ui-spec/*`)
- **9 MAJOR** (mixed backend-plan + ui-spec + doc)
- **7 MINOR** (mostly ui-spec + doc thinness)
- **4 INFO** (status / hygiene items)
- **11 Internal-consistency issues** (IC1–IC11) within/between plan files

The backend codebase and canonical docs already agree — the actual
`backend/enum/permissions/permission.enum.ts`, `shared/constants/whatsapp-templates.enum.ts`,
and `whatsapp.documents.ts` stubs all match the docs. What is **stale** is the
**plan source**: the ui-spec predates the canonical UI doc and its own outcome
files, so a fresh executing agent reading only the plan source would build
placeholders (`WHATSAPP_MANAGE`, `TIER_250K`, `whatsappTemplates` query) that the
codebase/docs explicitly prohibit.

The fixes here **update the plan files and canonical docs** so they are
re-executable and self-consistent. This plan does **not** touch source code.

---

## 2. Scope

### 2.1 In Scope
- Editing `.ai/finished_plans/whatsapp/ui-spec/specs.md`, `implementation.md`,
  `trackable-tasks.md` to remove stale placeholders, false assumptions, and
  phantom spec codes (D1, D2, D3, D4, D9, PG1–PG8, IC1, IC2, IC6, IC8).
- Editing `.ai/finished_plans/whatsapp/specs.md`, `implementation.md`,
  `trackable-tasks.md` (parent plan) for duplicate numbering, missing Q6 row,
  webhook body-size semantics, and r3-review finding surfacing
  (IC3, IC4, IC5, IC9, IC11, D5, D7, D8, D11).
- Updating `docs/services/whatsapp-cloud-api.md` to add the deprecated
  `phone_number_quality_update` field gotcha, the webhook HTTP status table,
  the Q1-Q5 vs Q6 reconciliation, the "Tasks 1-29 (Task 30 produced this doc)"
  note, and a "Known Open Issues" section listing the two HIGH r3 findings
  (DG1, DG2, DG3, DG5, DG7).
- Updating `docs/frontend/whatsapp-ui-patterns.md` to add a "Plan Debt /
  Deferred parent-plan items" section itemising tasks 26.3-26.6 (DG4) and
  cross-linking the canonical backend doc (no new content gaps remain in the
  UI doc — it is the source of truth — only forward-links).
- Replacing the empty `.ai/todo/whatsapp.md` (currently a single `wwebjs`
  URL) with a structured backlog entry that aligns with the parent plan's
  Cloud-API-only stance (D12).
- Writing an explicit "Assumptions / Non-Assumptions" block at the top of
  `ui-spec/specs.md` pulling forward the canonical UI doc's gotchas
  (D1–D3, PG1, PG2, PG7) per analysis recommendation #2.

### 2.2 Out of Scope
- **Backend / Frontend / App source code changes** — this plan is
  documentation-only. The codebase already matches the canonical docs.
- New backend GraphQL resolvers for `whatsappTemplates` /
  `whatsappOptInAudit` (deferred parent-plan items 26.3–26.6 stay deferred;
  this plan only *records* the deferral in the docs).
- Removing the `whatsapp-implementation-skill-improvement-outcome.md`
  "Pending" quality-check note (D10) — history file, marked "as-is".
- Touching any `backend/`, `frontend/`, `app/`, `shared/` source files.
- Running `bun tsgo`, `bun lint`, or any quality gate on source code.

### 2.3 Pre-Execution Baseline (MANDATORY per spec-driven-development skill)
Before editing any file, the executing agent MUST:

1. **Read ALL files in `.ai/plans/whatsapp-plan-fixes/outcome/`** (currently
   empty) to absorb prior analysis.
2. **Read ALL files in `.ai/analysis/whatsapp/`** (the source-of-truth findings).
   These take precedence over the plan if any wording drifts.
3. Re-verify each cited file path exists with `view`/`grep` before editing —
   the line numbers quoted in `.ai/analysis/whatsapp/*` were captured on
   2026-08-17; whitespace-edits may have shifted them. Anchor edits on unique
   text blocks, not line numbers.
4. Make no edits to files outside the explicit list in §2.1.

---

## 3. User Stories

**US-1** — As a *future executing agent*, I want the WhatsApp plan source to
match the canonical docs and the codebase, so that re-running the plan does
not produce dead i18n keys, non-existent permission symbols, or compile-time
errors.

**US-2** — As a *plan reviewer*, I want the ui-spec to declare its
assumptions and non-assumptions up front (esp. missing backend resolvers and
missing enum values), so I can scope UI work without unknowingly
re-introducing backend dependencies the parent plan deferred.

**US-3** — As a *developer reading `docs/services/whatsapp-cloud-api.md`*,
I want the deprecated Meta webhook field names (`old_limit` / `current_limit`)
and the explicit HTTP status-code table documented, so I do not accidentally
re-introduce the deprecated field path during webhook maintenance.

**US-4** — As a *developer reading the canonical backend doc*, I want to see
the two HIGH r3-comprehensive-review findings (TOCTOU race; dead upsert)
surfaced as "Known Open Issues", so the doc does not falsely imply the
WhatsApp integration is fully clean.

**US-5** — As a *project maintainer*, I want `.ai/todo/whatsapp.md` to either
be empty (file deleted) or contain a structured v2 inbound-chat backlog —
not a single unexplained URL to an unofficial WhatsApp-Web automation
library that contradicts the parent plan's Cloud-API-only stance.

**US-6** — As a *spec-driven-development consumer*, I want to follow the
mandatory outcome-knowledgebase rules (read outcomes first, write outcomes
after, update task checkboxes) so that if this fix plan is ever re-opened,
future agents inherit the rationale for every edit.

---

## 4. Acceptance Criteria (EARS format)

### CRITICAL fixes (D1, D2, D3)

**AC-1 (D1 — WHATSAPP_MANAGE):**
WHEN the ui-spec plan (`specs.md`, `implementation.md`, `trackable-tasks.md`)
is read in full THEN the symbol `WHATSAPP_MANAGE` SHALL NOT appear anywhere,
and every admin affordance SHALL be gated by `AppPermission.WHATSAPP_CONFIG_MANAGE`
(numbers/credentials) or `AppPermission.WHATSAPP_TEMPLATES_MANAGE` (templates
tab) or `AppPermission.WHATSAPP_VIEW` (read), matching
`backend/enum/permissions/permission.enum.ts`.

**AC-2 (D2 — phantom enum i18n keys):**
WHEN the ui-spec plan is read THEN it SHALL NOT instruct adding the i18n
keys `tier250K`, `tier1M`, or `qualityOrange`, and SHALL NOT switch on
`WhatsappLimitTier.TIER_250K`, `WhatsappLimitTier.TIER_1M`, or
`WhatsappQualityRating.ORANGE`. WHERE tier/quality label helpers are
discussed, the plan SHALL enumerate only the actual enum values:
`UNTIERED`, `TIER_50`, `TIER_250`, `TIER_1K`, `TIER_10K`, `TIER_100K`,
`TIER_UNLIMITED`, `TIER_NOT_SET` (tier) and `GREEN`, `YELLOW`, `RED`,
`UNKNOWN` (quality), matching `shared/constants/whatsapp-templates.enum.ts`
and `docs/frontend/whatsapp-ui-patterns.md:180-182`.

**AC-3 (D3 + PG1 — phantom backend resolver assumption):**
WHEN the ui-spec `specs.md` Scope section is read THEN "Out of Scope:
GraphQL resolvers (Pothos) changes" SHALL be accompanied by an explicit
"Assumptions / Non-Assumptions" block that states:
  (a) `whatsappTemplates` query does **NOT** exist in v1;
  (b) `whatsappOptInAudit` query does **NOT** exist in v1;
  (c) templates render from `syncWhatsappAccountsFromMeta` mutation result
      snapshots only (BL3);
  (d) `body` / `buttonStructure` do NOT exist on `WhatsappTemplateSnapshot`;
  (e) UI-REQ-2 "persisted templates query" and UI-REQ-6 "opt-in audit
      history" are **deferred** to a future backend plan (parent-plan items
      26.3-26.6).
AND the `trackable-tasks.md` Progress Summary SHALL NOT contain the
phrase "No backend changes needed: All backend resolvers already exist".

### MAJOR fixes (D4, D5, D6, D7, D8, IC3, IC4, IC5, IC9, IC11)

**AC-4 (D4 + D5 — phantom spec codes):**
WHEN the ui-spec plan references spec codes THEN it SHALL NOT cite `Q10`
or `Q11` (which exist in neither parent plan nor canonical docs), and the
parent plan's `specs.md:406` "Post-review findings applied" line SHALL
list `Q1–Q6` (matching `docs/services/whatsapp-cloud-api.md:28`) or `Q1–Q5`
with a one-line note explaining Q6 is reserved/unused.

**AC-5 (D7 — webhook POST body-size cap semantics):**
IF the plan describes the webhook POST body-size cap THEN it SHALL state
that 413 is returned **only when BOTH Content-Length header AND actual
body length exceed 1 MB** (conjunction), matching
`docs/services/whatsapp-cloud-api.md:160`.

**AC-6 (D8 + DG3 — webhook HTTP status-code table in canonical doc):**
WHEN `docs/services/whatsapp-cloud-api.md` §9 (Webhook Handler) is read
THEN it SHALL contain an explicit two-column table listing:
  | Branch | Status Code | Trigger |,
covering GET (`403` on verify-token mismatch + rate-limit on repeat), POST
(`401` HMAC mismatch, `400` invalid JSON, `404` `body.object` mismatch,
`413` body-size cap, `200` accepted-then-defer).

**AC-7 (IC3 — parent plan duplicate item numbering):**
WHEN `.ai/finished_plans/whatsapp/specs.md` is read THEN items 11, 12, 13
SHALL NOT be duplicated — duplicate numbering at the previously-flagged
lines SHALL be resolved by renumbering or merging.

**AC-8 (IC4 + IC5 — r3-comprehensive-review surfacing):**
WHEN the parent plan's `trackable-tasks.md` Phase 4 ("Knowledge
Propagation") task AND `docs/services/whatsapp-cloud-api.md` are read
THEN both SHALL reference the two HIGH findings from
`r3-comprehensive-review.md` (TOCTOU race in
`notification.repository.ts:346-394`; `handleMessagesStatus` dead upsert)
under a "Known Open Issues" section, AND the canonical backend doc SHALL
state "Fixed: 0 / 23" so the unfixed-count is not silently dropped.

**AC-9 (IC9 — fictional quality-loop command):**
WHEN the parent plan's `trackable-tasks.md` describes the per-file quality
loop THEN it SHALL reference the real invocation
`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (not
the fictional `lint-queue-client`), matching the project AGENTS.md
"Parallel Subagent Quality Gate Workflow" section.

**AC-10 (IC11 — r3 date mismatch):** INFO-only — the
`r3-comprehensive-review.md` "Date" header SHALL either align with the
parent plan's date range or include a one-line note: "Date field retained
from original draft; subsequent plan re-versioned 2026-07-30."

### MINOR / INFO fixes (DG1, DG2, DG4, DG5, DG7, D11, D12, PG3, PG6, PG7, PG8)

**AC-11 (DG1 — Q6 reconciliation):**
WHEN `docs/services/whatsapp-cloud-api.md` prefix table is read THEN
the Quality range SHALL read `Q1–Q5` (Q6 never populated) *or* the doc
SHALL add a one-line "Q6 (reserved, unused)" entry.

**AC-12 (DG2 — deprecated Meta field names):**
WHEN `docs/services/whatsapp-cloud-api.md` §9 documents
`phone_number_quality_update` THEN it SHALL state:
"use `max_daily_conversations_per_business` (deprecated:
`old_limit` / `current_limit`)".

**AC-13 (DG4 — UI doc "Plan Debt" section):**
WHEN `docs/frontend/whatsapp-ui-patterns.md` is read THEN it SHALL
contain a "Plan Debt / Deferred parent-plan items" section itemising
tasks 26.3-26.6 (numbers opt-in table, bulk actions, audit trail) and
cross-linking the parent plan's `trackable-tasks.md:325-328`.

**AC-14 (DG5 — TOCTOU + dead-upsert findings in doc):** covered by AC-8.

**AC-15 (DG7 — doc scope note):**
WHEN `docs/services/whatsapp-cloud-api.md` header is read THEN its
subtitle SHALL read "Tasks 1-29 (knowledge propagation is Task 30)" to
match `trackable-tasks.md:406` which declares 30/30 complete.

**AC-16 (D11 — defensive strip note):** INFO-only — the parent plan
`implementation.md` webhook task SHALL add a one-line note:
"route-level strip (S3) reinforced by belt-and-suspenders handler
re-check per `docs/services/whatsapp-cloud-api.md:218-220`".

**AC-17 (D12 — `.ai/todo/whatsapp.md` cleanup):**
WHEN `.ai/todo/whatsapp.md` is read THEN it SHALL either be deleted
(preferred) or contain a structured "v2 Inbound-Chat Backlog" section
that explicitly notes: "Cloud API is the only supported path in v1
(per `specs.md:17`); inbound-chat (`wwebjs/whatsapp-web.js`) is **out of
scope** until v2/BL4. This file documents the deferred alternative only."

**AC-18 (PG3 — `whatsappThroughputLabel.ts` in task 11):**
WHEN ui-spec `trackable-tasks.md` task 11 description is read THEN it
SHALL list **all four** i18n label helpers: `whatsappQualityLabel.ts`,
`whatsappTierLabel.ts`, `whatsappTemplateStatusLabels.ts`, and
`whatsappThroughputLabel.ts` (matching the actual
`11-i18n-localization-outcome.md:22-27` and the canonical UI doc's
4-helper table at `whatsapp-ui-patterns.md:107-115`).

**AC-19 (PG2 — fabricated account-status category):**
WHEN the ui-spec plan describes `whatsappAccountStatusConfig` THEN it
SHALL NOT invent `CONNECTED/PENDING/DISCONNECTED/ERROR` strings; the
plan SHALL document that account status derives from the **boolean**
`isActive` field via `getWhatsappAccountStatusBadgeConfig(isActive)`
(matching `whatsapp-ui-patterns.md:87-89`).

**AC-20 (PG7 — `MobileCardList` Suspense test gotcha):**
WHEN ui-spec `trackable-tasks.md` task 19 (component tests) is read
THEN it SHALL reference `docs/frontend/whatsapp-ui-patterns.md:165-167`:
"MobileCardList uses `next/dynamic` → tests need `findByText` / `waitFor`,
not synchronous `getByText`; mock `next/navigation` via
`mockNextNavigation` at module scope."

**AC-21 (PG4 — `toggleOptInAction` source value):**
WHEN ui-spec `trackable-tasks.md` task 19 describes the
`toggleOptInAction` test mock THEN it SHALL specify
`source: "graphql"` (not `"settings"` / `"manual"`), matching
`whatsapp-ui-patterns.md:210`.

**AC-22 (PG6 — four template lifecycle events):** INFO-only — verify
the canonical backend doc lists all four lifecycle events
(`message_template_status_update`,
`template_category_update`,
`message_template_quality_update`,
`message_template_components_update`) rather than collapsing them to
one. The parent plan's four-event breakdown is correct; if the doc
collapses them, fix the doc.

**AC-23 (PG8 — ui-spec deferred-row tracker):**
WHEN ui-spec `trackable-tasks.md` is read THEN it SHALL contain a
"Parent-Plan Deferred Items (26.3–26.6)" row linking to the canonical
UI doc's new "Plan Debt" section (AC-13) so deferred backend work is
not lost between plan and doc.

### Process ACs (mandatory per spec-driven-development skill)

**AC-24 (Outcome Knowledge Base — read-before-execute):**
WHEN any task in `tasks.md` is started THEN the executing agent SHALL
first read ALL files in `.ai/plans/whatsapp-plan-fixes/outcome/` plus
ALL files in `.ai/analysis/whatsapp/`.

**AC-25 (Outcome Knowledge Base — write-after-execute):**
WHEN any task completes THEN the executing agent SHALL write
`.ai/plans/whatsapp-plan-fixes/outcome/<task-id>-outcome.md` with the
list of edits made, exact file paths, before/after snippets for
non-trivial changes, and any carry-over notes.

**AC-26 (Task checkbox tracking):**
WHEN any subtask completes THEN the executing agent SHALL update its
checkbox `[ ]` → `[x]` in `.ai/plans/whatsapp-plan-fixes/trackable-tasks.md`.

**AC-27 (No source code touched):**
WHEN the plan completes THEN `git diff --stat` SHALL show **zero**
modifications to `backend/`, `frontend/`, `app/`, `shared/`,
`test/`, `scripts/` source files. Only `.ai/finished_plans/whatsapp/**`,
`.ai/todo/whatsapp.md`, `docs/services/whatsapp-cloud-api.md`,
`docs/frontend/whatsapp-ui-patterns.md`, and this plan's files
(`.ai/plans/whatsapp-plan-fixes/**`) SHALL show diffs.

---

## 5. Glossary

- **ui-spec** — `.ai/finished_plans/whatsapp/ui-spec/` plan set (3 files + outcomes).
- **parent plan** — `.ai/finished_plans/whatsapp/{specs,implementation,trackable-tasks}.md`.
- **canonical backend doc** — `docs/services/whatsapp-cloud-api.md`.
- **canonical UI doc** — `docs/frontend/whatsapp-ui-patterns.md`.
- **r3 review** — `.ai/finished_plans/whatsapp/r3-comprehensive-review.md`.
- **ph findings** — the 34 numbered findings in `.ai/analysis/whatsapp/*.md`
  (D1–D12, DG1–DG7, PG1–PG8, IC1–IC11).

---

## 6. References

- `.ai/analysis/whatsapp/summary.md` — executive summary, severity counts.
- `.ai/analysis/whatsapp/discrepancies.md` — D1–D12.
- `.ai/analysis/whatsapp/doc-gaps.md` — DG1–DG7.
- `.ai/analysis/whatsapp/plan-gaps.md` — PG1–PG8.
- `.ai/analysis/whatsapp/internal-consistency.md` — IC1–IC11.
- `.ai/finished_plans/whatsapp/` — the plan set being corrected.
- `docs/services/whatsapp-cloud-api.md` — canonical backend doc.
- `docs/frontend/whatsapp-ui-patterns.md` — canonical UI doc.
- `backend/enum/permissions/permission.enum.ts` — actual permissions enum.
- `shared/constants/whatsapp-templates.enum.ts` — actual tier/quality enums.
- `backend/lib/messages/whatsapp.documents.ts` (or wherever the GraphQL
  document stubs live) — confirms `whatsappTemplates`/`whatsappOptInAudit`
  are commented-out stubs.

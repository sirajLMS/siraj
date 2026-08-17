# WhatsApp Plan-Fixes — Trackable Tasks (trackable-tasks.md)

**Date:** 2026-08-17
**Plan name:** `whatsapp-plan-fixes`
**Skill:** spec-driven-development
**Counterparts:** `specs.md` (requirements) + `implementation.md` (design).
**Mandatory pre-execution rule:** Before any task, read ALL files in
`.ai/plans/whatsapp-plan-fixes/outcome/` AND ALL files in
`.ai/analysis/whatsapp/`.
**Mandatory post-execution rule:** After any task, write
`.ai/plans/whatsapp-plan-fixes/outcome/<task-id>-outcome.md` and update
`[ ]` → `[x]` here.

---

## Pre-Execution Baseline (Phase 0) — MANDATORY

- [x] 0. **Establish edit baseline**
  - Read all 5 analysis files: `.ai/analysis/whatsapp/{summary,discrepancies,doc-gaps,plan-gaps,internal-consistency}.md`
  - Confirm `.ai/plans/whatsapp-plan-fixes/outcome/` is empty (no prior runs)
  - Capture `git status --short` to a temp log so post-plan diff can be validated against "no source touched"
  - Re-grep each forbidden symbol across the plan set to capture pre-fix counts:
    `grep -rcE 'WHATSAPP_MANAGE|TIER_250K|TIER_1M|qualityOrange|lint-queue-client|\bQ10\b|\bQ11\b' .ai/finished_plans/whatsapp/`
  - _Requirements: AC-24, AC-27_

---

## Phase A — ui-spec CRITICAL fixes (D1, D2, D3)

- [x] 1. **Replace `WHATSAPP_MANAGE` with the real permission enums (D1, AC-1)**
  - Files: `.ai/finished_plans/whatsapp/ui-spec/specs.md`, `implementation.md`, `trackable-tasks.md`
  - Re-grep each `WHATSAPP_MANAGE` occurrence (analysis lists ~9 occurrences in `discrepancies.md:14-22`)
  - **Decision per occurrence:**
    - Numbers tab + create/edit/delete account + edit credentials + admin consolidated opt-in view → `AppPermission.WHATSAPP_CONFIG_MANAGE`
    - Templates tab → `AppPermission.WHATSAPP_TEMPLATES_MANAGE`
    - Read-only display → `AppPermission.WHATSAPP_VIEW`
  - **Source-of-truth:** `backend/enum/permissions/permission.enum.ts` (only 3 `WHATSAPP_*` enums)
  - Verify post-edit: `grep -rc WHATSAPP_MANAGE .ai/finished_plans/whatsapp/ui-spec/` returns 0
  - **Quality check (markdown):** verify any inline `RequirePermission` JSX snippets still parse visually; run `bunx markdownlint-cli2 '**/*.md'` if available (skip if not on PATH)
  - _Requirements: AC-1_

- [x] 2. **Drop phantom enum i18n keys `tier250K` / `tier1M` / `qualityOrange` (D2, AC-2)**
  - Files: `ui-spec/trackable-tasks.md:81`, `ui-spec/implementation.md:593-595,607-616`, `ui-spec/specs.md:102-103`
  - Re-grep anchors: `tier250K`, `tier1M`, `qualityOrange`, `TIER_250K`, `TIER_1M`, `WhatsappQualityRating.ORANGE`
  - Replace occururrences:
    - Remove switch arms on `TIER_250K` / `TIER_1M` / `ORANGE`
    - Replace instruction to "add" these keys with: "Do NOT add — these enum values do not exist; see `whatsapp-ui-patterns.md:180-182`"
    - Where helper switches are illustrated, enumerate ONLY the actual values from `shared/constants/whatsapp-templates.enum.ts`: tiers `UNTIERED, TIER_50, TIER_250, TIER_1K, TIER_10K, TIER_100K, TIER_UNLIMITED, TIER_NOT_SET` and qualities `GREEN, YELLOW, RED, UNKNOWN`
  - Verify post-edit: `grep -rcE 'tier250K|tier1M|qualityOrange|TIER_250K|TIER_1M|ORANGE' .ai/finished_plans/whatsapp/ui-spec/` returns 0
  - _Requirements: AC-2_

- [x] 3. **Add the "Assumptions / Non-Assumptions" block to `ui-spec/specs.md` (D3, AC-3 part 1)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/specs.md` (top of the Scope section, before "Out of Scope")
  - Add a new "## Assumptions / Non-Assumptions" block listing:
    - (a) `whatsappTemplates` query does **NOT** exist in v1 (stub in `whatsapp.documents.ts`)
    - (b) `whatsappOptInAudit` query does **NOT** exist in v1 (same stub pattern)
    - (c) Templates render from `syncWhatsappAccountsFromMeta` mutation result snapshots only (BL3)
    - (d) `body` and `buttonStructure` do NOT exist on `WhatsappTemplateSnapshot`
    - (e) UI-REQ-2 "persisted templates query" is **deferred** to backend plan
    - (f) UI-REQ-6 "opt-in audit history" is **deferred** to backend plan (parent 26.3-26.6)
    - Per `whatsapp-ui-patterns.md:169-202`
  - Reference: analysis discrepancies.md:88-134 + plan-gaps.md:8-41
  - _Requirements: AC-3_

- [x] 4. **Remove "All backend resolvers already exist" claims (D3, AC-3 part 2)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/{specs.md:381-388, trackable-tasks.md:70,429}`
  - Re-grep anchors: "Backend resolvers already exist", "All backend resolvers already exist", "No backend changes needed", "All changes are frontend-only"
  - Replace every such claim with: "**Backend resolvers for `whatsappTemplates` and `whatsappOptInAudit` DO NOT exist in v1** — templates render from `syncWhatsappAccountsFromMeta` mutation snapshots; opt-in history is a future backend plan (parent 26.3-26.6)"
  - Verify post-edit: `grep -rE 'already exist|frontend-only' .ai/finished_plans/whatsapp/ui-spec/` returns 0
  - _Requirements: AC-3_

---

## Phase B — ui-spec MAJOR fixes (D4, D9, PG1-PG3, PG7, IC1, IC2, IC6, IC8)

- [x] 5. **Remove phantom spec codes Q10 / Q11 (D4, AC-4 part 1)**
  - Files: `ui-spec/{specs.md:171,285,383, implementation.md:27,39,40, trackable-tasks.md:276, outcome/research-specs-gaps.md:27,77}`
  - Re-grep `\bQ10\b` and `\bQ11\b` across `ui-spec/`
  - For each occurrence:
    - If "Q10 mobile read-only decision" — replace with descriptive sentence: "Mobile Numbers tab was originally read-only (v1 intent); this task reverses that to full CRUD"
    - If "parent plan (Q10)" → delete the parenthetical
    - If "Q11 explicitly called for these features" → replace with: "the parent plan (tasks 26.3-26.6) explicitly deferred these opt-in audit features"
  - **Do NOT edit the historical `outcome/research-specs-gaps.md` body** — Decision D-B applies; only add a top-of-file pointer (see task 14)
  - Verify post-edit: `grep -rE '\bQ1[01]\b' .ai/finished_plans/whatsapp/ui-spec/{specs,implementation,trackable-tasks}.md` returns 0
  - _Requirements: AC-4_

- [x] 6. **Add `whatsappThroughputLabel.ts` to ui-spec task 11 (PG3, AC-18)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/trackable-tasks.md` (task 11 description, around the i18n helper creation list — analysis cites `ui-spec/trackable-tasks.md:244-352`)
  - Re-grep `whatsappQualityLabel`, `whatsappTierLabel`, `whatsappTemplateStatusLabels` in the task 11 area
  - Add the 4th helper: `whatsappThroughputLabel.ts` (mapping `WhatsappThroughputLevel` enum values to i18n keys), per actual outcome `11-i18n-localization-outcome.md:22-27` and canonical UI doc `whatsapp-ui-patterns.md:107-115`
  - _Requirements: AC-18_

- [x] 7. **Remove fabricated `whatsappAccountStatusConfig` CONNECTED/PENDING/... strings (PG2, AC-19)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/implementation.md:564-578` (re-grep `CONNECTED.*PENDING.*DISCONNECTED.*ERROR` and `whatsappAccountStatusConfig`)
  - Replace any `Record<string, StatusBadgeCategory>` config that invents `CONNECTED/PENDING/DISCONNECTED/ERROR` strings with: account status derives from the **boolean** `isActive` field via `getWhatsappAccountStatusBadgeConfig(isActive)` (per `whatsapp-ui-patterns.md:87-89`)
  - Remove `body` and `buttonStructure` field references from any `whatsappTemplates` GraphQL fragment samples in the same area
  - _Requirements: AC-19, AC-3(d)_

- [x] 8. **Add MobileCardList Suspense + `toggleOptInAction` source gotchas to task 19 (PG7, PG4, AC-20, AC-21)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/trackable-tasks.md` (task 19 description, around lines 353-361)
  - Re-grep `renderWithWrapper` and `MockLink` in task 19
  - Append to task 19:
    - "⚠️ **MobileCardList** uses `next/dynamic` → tests need `findByText` / `waitFor`, not synchronous `getByText` (`whatsapp-ui-patterns.md:165-167`). Mock `next/navigation` via `mockNextNavigation` at module scope."
    - "⚠️ `toggleOptInAction` mock MUST use `source: \"graphql\"` (NOT `\"settings\"` / `\"manual\"`) per `whatsapp-ui-patterns.md:210`"
  - _Requirements: AC-20, AC-21_

- [x] 9. **Add "Parent-Plan Deferred Items (26.3-26.6)" row to ui-spec tasks (PG8, IC6, AC-23)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/trackable-tasks.md` (add near top, after the task-list table)
  - Add a small table:
    ```
    ### Parent-Plan Deferred Items (backend, 26.3–26.6)
    | Item | Status | Reference |
    |------|--------|-----------|
    | 26.3 Numbers opt-in table | Deferred | parent trackable-tasks.md:325-328 |
    | 26.4 Bulk opt-in actions | Deferred | parent trackable-tasks.md:326 |
    | 26.5 Opt-in audit trail | Deferred | parent trackable-tasks.md:327 |
    | 26.6 Backend `whatsappOptInAudit` resolver | Deferred | parent trackable-tasks.md:328 |
    
    These are **out of scope** for the ui-spec; see `docs/frontend/whatsapp-ui-patterns.md` "Plan Debt" section.
    ```
  - _Requirements: AC-23_

- [x] 10. **Fix ui-spec progress summary "Completed: 0 / Remaining: 20" contradiction (IC8, AC-3 area)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/trackable-tasks.md:423-428`
  - Re-grep "Completed: \*\*0\*\*" and "Remaining: 20"
  - Replace with accurate counts (count `[x]` markers in the task list); note that outcomes confirm execution in `20-knowledge-propagation-outcome.md`
  - _Requirements: AC-3 Narrative hygiene_

- [x] 11. **Remove "WhatsAppTabPanels" fabricated type (IC2)**
  - File: `.ai/finished_plans/whatsapp/ui-spec/implementation.md` (re-grep `WhatsAppTabPanels`)
  - If the type is referenced but not defined in the canonical UI doc, replace with the canonical structure from `whatsapp-ui-patterns.md:24-27` (the `WhatsappConfigTab` type re-exported from `whatsappConfig.constants.ts`)
  - Verify post-edit: `grep -r WhatsAppTabPanels .ai/finished_plans/whatsapp/ui-spec/` returns 0
  - _Requirements: IC2_

---

## Phase C — Parent plan MAJOR/MINOR fixes (D5, D7, D8, D11, IC3, IC4, IC5, IC9, IC11)

- [x] 12. **Reconcile "Q1-Q5" vs "Q1-Q6" in parent `specs.md` (D5, AC-4 part 2)**
  - File: `.ai/finished_plans/whatsapp/specs.md:406` (re-grep "Q1–Q5" or "Q1-Q5" near the review-findings list)
  - Decision: change to `Q1–Q5` and add a one-line gloss: "(Q6 was reserved in the canonical doc prefix table but never populated; documented as unused — see `docs/services/whatsapp-cloud-api.md`)"
  - Reason: no source can retrieve what Q6 was meant to be; better to record it explicitly than silently drop or silently claim
  - _Requirements: AC-4, AC-11_

- [x] 13. **Fix duplicate item numbering 11/12/13 in parent `specs.md` (IC3, AC-7)**
  - File: `.ai/finished_plans/whatsapp/specs.md:56-61` (re-grep the duplicated item numbers; analysis cites "duplicate numbering for items 11-13")
  - Renumber to a unique sequence; if the duplicates are partial-overlap content, merge into one canonical item and remove the rest
  - Re-grep the document post-edit for any orphan internal references to the old numbers; fix them
  - _Requirements: AC-7_

- [x] 14. **Fix webhook POST body-size cap semantics (D7, AC-5)**
  - File: `.ai/finished_plans/whatsapp/implementation.md:369` and `trackable-tasks.md:186` (re-grep "1_000_000" and "rawBody.length" and "body-size cap")
  - Replace "rawBody.length > 1_000_000 → 413" with: "413 returned only when **BOTH** Content-Length header AND actual body length exceed 1 MB (conjunction), per `docs/services/whatsapp-cloud-api.md:160`"
  - Add to `specs.md` REQ-5.4 a short note: "Webhook POST body-size cap: conjunction of Content-Length + actual length both > 1MB"
  - _Requirements: AC-5_

- [x] 15. **Replace fictional `lint-queue-client` quality-loop command (IC9, AC-9)**
  - File: `.ai/finished_plans/whatsapp/trackable-tasks.md` (re-grep `lint-queue-client`; analysis cites lines 55, 65, 75, ...)
  - Replace all occurrences with the canonical command:
    `bun run scripts/health/sub-loop.ts <the-file> --lifecycle codescene`
  - Reason: AGENTS.md "Parallel Subagent Quality Gate Workflow" documents the real script; `lint-queue-client` is a fictional/stale name
  - Verify post-edit: `grep -r lint-queue-client .ai/finished_plans/whatsapp/` returns 0
  - _Requirements: AC-9_

- [x] 16. **Surface r3 HIGH findings in parent plan + canonical doc (IC4, IC5, D5, AC-8 part 1)**
  - Files to edit:
    - `.ai/finished_plans/whatsapp/trackable-tasks.md` (Phase 4 / Knowledge Propagation task) — add a bullet: "⚠️ Two HIGH findings from `r3-comprehensive-review.md` (TOCTOU race in `notification.repository.ts:346-394`; `handleMessagesStatus` dead upsert) remain unfixed (Fixed: 0 / 23). See `docs/services/whatsapp-cloud-api.md` 'Known Open Issues' section."
    - `docs/services/whatsapp-cloud-api.md` — add a new `## Known Open Issues` section (see task 17) — DON'T do it here
  - Re-grep "r3-comprehensive-review" in the parent plan to find the right task
  - _Requirements: AC-8_

- [x] 17. **Add the "defensive strip" belt-and-suspenders note (D11)**
  - File: `.ai/finished_plans/whatsapp/implementation.md` (webhook task section)
  - Re-grep `messages[]` in the parent `implementation.md`
  - Add a one-line note: "Route-level strip (S3) reinforced by belt-and-suspenders handler re-check per `docs/services/whatsapp-cloud-api.md:218-220`."
  - _Requirements: AC-16_

- [x] 18. **Add date-context note to `r3-comprehensive-review.md` (IC11)**
  - File: `.ai/finished_plans/whatsapp/r3-comprehensive-review.md:5` (re-grep the "Date:" header — analysis cites 2025-01-17)
  - Add one-line below the existing Date: "(Date field retained from original draft; subsequent plan re-versioned 2026-07-30 — see parent `specs.md:5`.)"
  - _Requirements: AC-10_

---

## Phase D — Canonical backend doc fixes (DG1, DG2, DG3, DG5, DG7, PG6)

- [x] 19. **Add "Known Open Issues" section to canonical backend doc (DG5, IC5, AC-8 part 2)**
  - File: `docs/services/whatsapp-cloud-api.md`
  - Append a new top-level section near the end (before "Cross-Cutting Gotchas" or at the very end):
    ```markdown
    ## Known Open Issues
    
    The r3-comprehensive-review (`/.ai/finished_plans/whatsapp/r3-comprehensive-review.md`)
    recorded 23 findings of which **0 have been fixed** (status as of 2026-08-17).
    The two HIGH findings are:
    
    1. **TOCTOU race** in `notification.repository.ts:346-394` — read-then-write without
       atomic guard (SELECT FOR UPDATE / advisory lock missing).
    2. **`handleMessagesStatus` dead upsert** — never passes `userId`/`channel`/`eventType`,
       making the INSERT…ON CONFLICT upsert unreachable.
    
    These are tracked in `.ai/finished_plans/whatsapp/r3-comprehensive-review.md`.
    A future backend plan MUST address them.
    ```
  - Re-grep "Known Open Issues" to confirm addition
  - _Requirements: AC-8_

- [x] 20. **Add the deprecated-field gotcha for `phone_number_quality_update` (DG2, AC-12)**
  - File: `docs/services/whatsapp-cloud-api.md` §9 (Webhook Handler)
  - Re-grep `phone_number_quality_update`
  - Add a one-line note after the existing handler reference:
    "`phone_number_quality_update`: read `max_daily_conversations_per_business` (deprecated: `old_limit` / `current_limit`) and update `portfolioMessagingLimitTier` (Q5)."
  - _Requirements: AC-12_

- [x] 21. **Add webhook HTTP status-code table (DG3, D8, AC-6)**
  - File: `docs/services/whatsapp-cloud-api.md` §9
  - Add (after the GET verification description):
    ```markdown
    ### Webhook HTTP Status Codes
    
    | Branch | Status | Trigger |
    |--------|--------|---------|
    | GET (verify) | `200` | `hub.mode=subscribe` + matching `hub.verify_token` |
    | GET (verify) | `403` | verify-token mismatch (logged with ip, userAgent, contentLength only) |
    | GET (verify) | `429` | per-IP rate limit exceeded (S1) |
    | POST | `200` | accepted (deferred via `after()`) |
    | POST | `401` | HMAC-SHA256 mismatch |
    | POST | `400` | invalid JSON body |
    | POST | `404` | `body.object !== "whatsapp_business_account"` |
    | POST | `413` | Content-Length AND actual body both > 1 MB |
    ```
  - _Requirements: AC-6, AC-5_

- [x] 22. **Reconcile Q1–Q6 in the doc prefix table (DG1, AC-11)**
  - File: `docs/services/whatsapp-cloud-api.md:28`
  - Re-grep "| **Q1–Q6** |"
  - Decision: change to `Q1–Q5` OR add a "Q6 (reserved, unused)" entry. Pick based on one-line requested:
    "Parent plan `specs.md:406` applied only Q1–Q5; Q6 was reserved in this table but never populated."
    - Preferred: change to `Q1–Q5` and add a footnote: "(Q6 was reserved but never populated; see parent plan `specs.md:406`.)"
  - _Requirements: AC-11_

- [x] 23. **Add Task-30 scope note to canonical doc header (DG7, AC-15)**
  - File: `docs/services/whatsapp-cloud-api.md` line 3 (subtitle)
  - Re-grep "Tasks 1–29"
  - Change to: "consolidates patterns, rules, and gotchas from the WhatsApp Cloud API integration (Tasks 1–29; knowledge propagation is Task 30)."
  - _Requirements: AC-15_

- [x] 24. **Verify / fix four template lifecycle events in canonical doc (PG6, AC-22)**
  - File: `docs/services/whatsapp-cloud-api.md:164`
  - Re-grep `message_template_status_update` and cross-reference parent `specs.md:155` (REQ-5.5 lists four events)
  - If the doc collapses to a single event name, restore the four-event list:
    `message_template_status_update`, `template_category_update`, `message_template_quality_update`, `message_template_components_update` — all audit-only (R6).
  - _Requirements: AC-22_

---

## Phase E — Canonical UI doc + hygiene files (DG4, D12)

- [x] 25. **Add "Plan Debt / Deferred parent-plan items" section to canonical UI doc (DG4, AC-13)**
  - File: `docs/frontend/whatsapp-ui-patterns.md`
  - Add a new top-level section (before the existing "Gotchas" or near end):
    ```markdown
    ## Plan Debt — Deferred Parent-Plan Items (26.3–26.6)
    
    The parent WhatsApp plan (`/.ai/finished_plans/whatsapp/trackable-tasks.md:325-328`)
    marked these items `[~]` (deferred):
    
    - **26.3** Numbers opt-in table (per-account opt-in counts)
    - **26.4** Bulk opt-in actions (select-all-and-toggle)
    - **26.5** Opt-in audit trail (user-visible)
    - **26.6** Backend `whatsappOptInAudit` GraphQL resolver
    
    The ui-spec renders placeholder empty arrays with TODO comments for these
    (see `whatsapp-ui-patterns.md` "Missing Backend Resolvers"). A future
    backend plan must ship the resolvers before the UI can show real data.
    ```
  - _Requirements: AC-13_

- [x] 26. **Replace `.ai/todo/whatsapp.md` contents (D12, AC-17)**
  - File: `.ai/todo/whatsapp.md` (currently a single `wwebjs/whatsapp-web.js` URL)
  - Re-grep to confirm current content is only the URL
  - Replace the entire file contents with:
    ```markdown
    # WhatsApp — Deferred Investigation (v2 / BL4)
    
    Cloud API is the **only** supported WhatsApp path in v1 (per
    `.ai/finished_plans/whatsapp/specs.md:17`). Inbound chat / supervisor
    reply UI is explicitly **out of scope** for v1
    (`.ai/finished_plans/whatsapp/specs.md:30-32`) and deferred to v2 / BL4.
    
    The previous URL `https://github.com/wwebjs/whatsapp-web.js` (WhatsApp
    Web automation, unofficial) is **not** the intended integration path
    and contradicts the plan's Cloud-API-only stance. Kept only as a record
    of the investigated alternative.
    
    If/when inbound-chat becomes v2 scope, start a new plan under
    `.ai/plans/whatsapp-inbound-chat/`.
    ```
  - _Requirements: AC-17_

- [x] 27. **Add one-line pointer to top of 3-4 affected outcome files (Decision D-B)**
  - Files (top of each):
    - `.ai/finished_plans/whatsapp/ui-spec/outcome/1-i18n-foundations-outcome.md`
    - `.ai/finished_plans/whatsapp/ui-spec/outcome/20-knowledge-propagation-outcome.md`
    - `.ai/finished_plans/whatsapp/ui-spec/outcome/research-specs-gaps.md`
    - `.ai/finished_plans/whatsapp/outcome/30.1-knowledge-propagation-outcome.md`
  - For each: at the very top, insert exactly ONE line (after any title):
    `> **Plan-Correction Note (2026-08-17):** The plan source this outcome executed has since been corrected in `.ai/plans/whatsapp-plan-fixes/`. Contradictions recorded below are historical; do not re-apply them.`
  - **Do NOT edit any body content** (preserves audit history)
  - _Requirements: Decision D-B, AC-25_

---

## Phase F — Plan-Wide Verification

- [x] 28. **Run forbidden-symbol sweep across the corrected plan set**
  - Command:
    ```
    grep -rcE 'WHATSAPP_MANAGE|TIER_250K|TIER_1M|qualityOrange|lint-queue-client|\bQ10\b|\bQ11\b|already exist|frontend-only' \
      .ai/finished_plans/whatsapp/
    ```
  - Expected: every count is 0 in `.ai/finished_plans/whatsapp/{ui-spec,}/{specs,implementation,trackable-tasks}.md`
    (bodies of outcome/research files MAY still contain historical occurrences — that's by design per Decision D-B)
  - If any non-outcome file reports > 0, return to the relevant Phase A/B/C task and fix
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-9_

- [x] 29. **Markdown link-integrity check across edited files**
  - For each file edited in Phases A–E, grep for all relative path references (`` `[^`]+\.(md|ts|tsx)` ``), extract the path portion, and `view` / `test -e` to confirm the target exists
  - Any broken reference → fix in-place (mis-pasted path)
  - _Requirements: Design §6.2_

- [x] 30. **Plan-wide diff verification: no source code touched (AC-27)**
  - Command: `git diff --stat -- 'backend/**' 'frontend/**' 'app/**' 'shared/**' 'test/**' 'scripts/**'`
  - Expected: **empty output**. If any source file appears in the diff, abort and write a "BLOCKED — source code unexpectedly touched" entry in `outcome/` and stop.
  - Command: `git diff --stat` — confirm the only modified paths are:
    - `.ai/finished_plans/whatsapp/**`
    - `.ai/todo/whatsapp.md`
    - `docs/services/whatsapp-cloud-api.md`
    - `docs/frontend/whatsapp-ui-patterns.md`
    - `.ai/plans/whatsapp-plan-fixes/**` (this plan + outcomes)
  - _Requirements: AC-27_

- [x] 31. **Invoke `@plan-review` skill on the complete plan (Phase 1.5 gate)**
  - Run the plan-review skill on `.ai/plans/whatsapp-plan-fixes/{specs,implementation,trackable-tasks}.md`
  - Fix any violations reported
  - Re-run until exit message is "Plan passes all AGENTS.md rules"
  - Notes for the skill: this is a **documentation plan** — UX/Navigation spec is N/A per `implementation.md §4`. Acknowledge this context up front in any back-and-forth with the skill.
  - Write outcome: `.ai/plans/whatsapp-plan-fixes/outcome/plan-review-R1.md`
  - _Requirements: specs §1.5, AC-26_

---

## Phase G — Knowledge Propagation (final task)

- [x] 32. **Create canonical doc `docs/workflows/plan-doc-reconciliation.md` (Phase 7)**
  - Read all outcome files in `.ai/plans/whatsapp-plan-fixes/outcome/` (per skill pre-execution rule)
  - Extract recurring patterns from this plan: anchor-on-text-not-line-numbers, don't-rewrite-outcomes-add-pointers, surface-deferred-review-findings, phantom-spec-code-handling, markdown-link-integrity-as-quality-loop
  - Create `docs/workflows/plan-doc-reconciliation.md` with sections per `implementation.md §8`
  - Update root `AGENTS.md` "Important References" section with a one-line reference:
    `- docs/workflows/plan-doc-reconciliation.md - Plan-vs-canonical-doc reconciliation pattern`
  - **Do NOT update layer AGENTS.md / instructions / skills** — this is a one-off process, not a recurring pattern. (Per `implementation.md §8`.)
  - Write outcome: `.ai/plans/whatsapp-plan-fixes/outcome/32-knowledge-propagation-outcome.md`
  - Update this task checkbox to `[x]`
  - _Requirements: spec-driven-development Knowledge Propagation task template, AC-26_

---

## Progress Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 0 (Baseline) | 0 | Pending |
| Phase A (ui-spec CRITICAL) | 1-4 | Pending |
| Phase B (ui-spec MAJOR) | 5-11 | Pending |
| Phase C (Parent plan) | 12-18 | Pending |
| Phase D (Backend doc) | 19-24 | Pending |
| Phase E (UI doc + hygiene) | 25-27 | Pending |
| Phase F (Verification) | 28-31 | Pending |
| Phase G (Knowledge propagation) | 32 | Pending |
| **Total** | **33** | **0% complete** |

---

## Requirement Traceability Matrix

| AC | Task(s) | Severity |
|----|---------|----------|
| AC-1 (D1 WHATSAPP_MANAGE) | 1 | CRITICAL |
| AC-2 (D2 phantom enum keys) | 2 | CRITICAL |
| AC-3 (D3 + PG1 backend resolvers) | 3, 4 | CRITICAL |
| AC-4 (D4 + D5 Q10/Q11 + Q1-Q5) | 5, 12 | MAJOR |
| AC-5 (D7 body-size conjunction) | 14 | MAJOR |
| AC-6 (DG3 HTTP status table) | 21 | MAJOR |
| AC-7 (IC3 duplicate numbering) | 13 | MAJOR |
| AC-8 (IC4 + IC5 r3 findings in doc) | 16, 19 | MAJOR |
| AC-9 (IC9 lint-queue-client) | 15 | MAJOR |
| AC-10 (IC11 r3 date note) | 18 | INFO |
| AC-11 (DG1 Q6 reconciliation) | 22 | MAJOR |
| AC-12 (DG2 deprecated fields) | 20 | MAJOR |
| AC-13 (DG4 UI doc Plan Debt) | 25 | MAJOR |
| AC-14 (DG5) | 19 | MAJOR (dup AC-8) |
| AC-15 (DG7 Task-30 note) | 23 | MINOR |
| AC-16 (D11 defensive strip) | 17 | MINOR |
| AC-17 (D12 .ai/todo cleanup) | 26 | INFO |
| AC-18 (PG3 throughputLabel) | 6 | MAJOR |
| AC-19 (PG2 fabricated status strings) | 7 | MAJOR |
| AC-20 (PG7 MobileCardList Suspense) | 8 | MAJOR |
| AC-21 (PG4 toggleOptInAction source) | 8 | MAJOR |
| AC-22 (PG6 four template events) | 24 | INFO |
| AC-23 (PG8 deferred-row tracker) | 9 | INFO |
| AC-24 (Outcome read-before) | all | Process |
| AC-25 (Outcome write-after) | all | Process |
| AC-26 (Checkbox tracking) | all | Process |
| AC-27 (No source touched) | 30, 32 | Process / Safety |
| IC2 (WhatsAppTabPanels fabricated) | 11 | MAJOR |

---

## Standard Task Enhancement Notes (per spec-driven-development skill)

### Quality loop per file
Because every modified file is **Markdown** (`.md`), `bun run scripts/health/sub-loop.ts`
is a no-op (script designed for `.ts`/`.tsx`). Substitute the **markdown
link-integrity check** described in `implementation.md §6.2` + task 29 above.

### Instruction verification per file
N/A — no `.ts`/`.tsx` files are modified; the auto-discovery built into
`sub-loop.ts` doesn't apply to markdown files. Instead, the executing agent
re-greps each anchor before edit.

### Drizzle schema
N/A — no schema changes.

### Layer AGENTS.md compliance
N/A — no source files in any layer are touched.

---

## References

- `.ai/plans/whatsapp-plan-fixes/specs.md` — requirements
- `.ai/plans/whatsapp-plan-fixes/implementation.md` — design decisions
- `.ai/analysis/whatsapp/*.md` — ground-truth findings (D, DG, PG, IC)
- `.agents/skills/spec-driven-development/SKILL.md` — methodology

# Internal Consistency Issues — Within/Between Plan Files

Issues within the plan files themselves; specs vs implementation vs tasks
vs outcomes. Severity tags as before.

---

## IC1 — [CRITICAL] ui-spec/specs.md declares GraphQL resolver changes
"Out of Scope"; ui-spec implementation.md and specs.md assumptions
contradict

**ui-spec specs.md says:**
- Line 38-43 — Scope: "Out of Scope: … GraphQL resolvers (Pothos) changes".

**ui-spec specs.md ALSO says (lines 381-388 — "Business Constraints" +
"Assumptions"):**
- Line 387 — "The `WhatsappTemplatesQueryDocument` … backend resolver
  **already exists or can be trivially added** (backend stores templates)".
- Line 388 — "The `WhatsappOptInAuditQueryDocument` … backend resolver
  **may need to be added** for audit trail".

**ui-spec/implementation.md says:**
- Line 156 — "Use persisted templates query (⚠️ **backend resolver does
  not exist — create first** or use sync mutation snapshot)".
- Line 199 (trackable-tasks task 9) — "Backend resolver for a standalone
  templates query does not exist yet — either create it first (backend
  task) or use template snapshots".

**ui-spec/trackable-tasks.md says:**
- Line 429 — "**No backend changes needed**: All backend resolvers
  already exist".

**Why it matters:**
Three sub-documents take three positions on the same question:
1. specs.md Out-of-Scope → "no backend resolver changes"
2. specs.md Assumptions / trackable-tasks → "all already exist"
3. implementation.md / line 387 caveat → "may need to be added"

The actual implementation outcome
(ui-spec/outcome/1-i18n-foundations-outcome.md and ui-spec/outcome/20)
affirms position 3 (resolver does NOT exist — see
`docs/frontend/whatsapp-ui-patterns.md:171-176`). The plan is internally
self-contradictory in a way that gives any executing agent license to
either implement or skip backend work, with no clear ruling.

---

## IC2 — [MAJOR] ui-spec/implementation.md "WhatsAppTabPanels" sample
uses `WHATSAPP_MANAGE` for Numbers tab; trackable-tasks.md task 21.1 +
parent plan use `WHATSAPP_VIEW` for page gate and `WHATSAPP_CONFIG_MANAGE`

Cross-reference IC1 with D1. ui-spec/implementation.md line 99, 535
uses `AppPermission.WHATSAPP_MANAGE` for the Numbers tab guard. The
parent plan `specs.md:253` (REQ-11.5) reserves the Numbers tab View:
`WHATSAPP_VIEW`, Mutate: `WHATSAPP_CONFIG_MANAGE`. The ui-spec's
`WHATSAPP_MANAGE` is a non-existent permission symbol; had it been a
real alias for `WHATSAPP_CONFIG_MANAGE` the inconsistency would still
create a permission-gate mismatch (View permission would be required to
see the tab, but the plan gates the entire tab behind mutate-only).

---

## IC3 — [MAJOR] Parent plan specs.md v1.2 has duplicate numbering for
items 8-14

**Plan says (`specs.md:46-62`):**
- Item 8 — Navigation decision
- Item 9 — Audience decision
- Item 10 — Tab-level permissions
- Item 11 (first at line 56) — Tab-level permissions (partial)
- Item 11 (second at line 58) — Audience decision (**duplicate**)
- Item 12 — Tab-level permissions (**replaces the broken item 10**)
- Item 13 — Secret rotation (**replaces the broken item 11**)
- Item 14 — Opt-in default OFF

Concretely, lines 56-61 show:
```
56. 10. **Tab-level permissions**: Numbers tab (view: ...
57. 11. **Secret rotation**: `setAccessToken` ...
58. 11. **Audience**: `SUPER_ADMIN`, ...
59. 12. **Tab-level permissions**: Numbers tab (view: ...
60. 13. **Secret rotation**: `setAccessToken` ...
61. 14. **Opt-in default OFF**: ...
```

Numeral "11" appears twice, and items 10/11 at the top appear
duplicated again as 12/13 a few lines later. This implies a sloppy
post-review merge where the old items 11/12 weren't deleted before the
new items 10-14 were appended.

**Why it matters:** A reader following numbering will be confused.
The duplicated "Tab-level permissions" content is otherwise identical.

---

## IC4 — [MAJOR] Parent plan's "Phase 4: Admin WhatsApp Configuration
(Frontend)" was "REPLACED BY PHASE 7" but tasks 14-16 are marked `[x]`
(completed) while task 17 is marked `[ ]` REMOVED

**Plan says (`trackable-tasks.md:210-244`):**
- Line 210-218 — "Phase 4: Admin WhatsApp Configuration (Frontend) —
  REPLACED BY PHASE 7 … Tasks 14-17 below are kept for i18n and GraphQL
  documents which are still needed, but the view tasks (16-17) are
  replaced by Phase 7 tasks 24-26."
- Tasks 14, 15, 16 marked `[x]` complete.
- Task 17 marked `[ ] REMOVED`.

Internally inconsistent: if 16 (Numbers ViewModel) was "kept and
completed" but the modern target architecture differs from the
WhatsappConfigView/WhatsappConfigMobileView pattern Phase 7 introduced,
then task 16's product is at best **stale**. Either Phase 7's
introduction retroactively invalidates task 16, or task 16 ought to be
marked "amended by Phase 7". The plan doesn't audit this.

The ui-spec implementation.md:74-84 confirms the WhatsApp integration
*started* with Pattern B (Pattern B = useState) THEN was migrated by
the ui-spec — `WhatsappConfigView.tsx → ResponsiveViewSwitch`. The
parent plan's Task 16 thus shipped Pattern B; ui-spec then migrated.
This pipeline implication is not surfaced in the parent plan.

---

## IC5 — [MAJOR] r3-comprehensive-review shows 23 unfixed findings (0/23
fixed, no commits), but tasks 18/19 (tests) and parent plan task 20
(Final verification) all marked `[x]`

**r3-comprehensive-review.md:48-51** — "Total findings: 23, Fixed: 0 /
23, Remaining: 23, Commits: NONE (per user request)".

But `trackable-tasks.md:355-363` (Task 20 Final Verification) — all
subtasks marked `[x]`, including "20.1 All REQ acceptance criteria
checked", "20.3 Run quality loop on all modified files: bun tsgo && bun
biome:check && lint-queue-client (no codescene/sonar)", "20.4 Fix tsgo /
biome / lint failures", "20.5 Re-run quality loop until all stages pass".

**Why it matters:** Quality gate ✅ claims in Task 20 directly contradict
the r3 review's open finding list. The skill-improvement outcome itself
flagged this
(`whatsapp-implementation-skill-improvement-outcome.md:74-94`) — "All
9 implementation tasks reported 'quality gate ✅' while harboring bugs".
Two HIGH findings (TOCTOU race in `notification.repository.ts:346-394`;
handleMessagesStatus never passes userId/channel/eventType) are
recorded as live in code by r3 but Quality Gate Task 20 says everything
passes. Internal contradiction in the plan outcome record.

---

## IC6 — [MAJOR] ui-spec/specs.md declares "Out of Scope: Backend
Services, repositories, schema changes" yet task 26.3 backend item is
referenced in Dependencies of UI-REQ-6

**ui-spec/specs.md:38-42** — explicitly out of scope: "Backend services,
repositories, schema changes; GraphQL resolvers (Pothos) changes; Webhook
handler logic; Notification dispatch logic".

**ui-spec/specs.md:170** — UI-REQ-6 Dependencies — "Tasks 26.3-26.6 from
the parent plan (defined but never implemented). May need a new
`WhatsappOptInAuditQueryDocument` GraphQL document … The new query
document MUST include `id` field …"

Tasks 26.3-26.6 of the parent plan (`trackable-tasks.md:325-328`) require
backend opt-in schema extension (Task 29, marked complete). But Task 29
does **not** ship a `WhatsappOptInAuditQuery` resolver — Task 29.2 only
adds the audit action (`STATUS_CHANGE`); no GraphQL query.

The ui-spec UI-REQ-6 acceptance criteria #1-6 (`specs.md:160-165`) all
rely on `whatsappOptInAuditQueryDocument`. The plan declares backend
work out-of-scope yet links to non-existent backend resources. The
"resolved" mechanism used by the actual implementation outcome is the
UI-doc-noted "placeholder empty array with TODO comment"
(`whatsapp-ui-patterns.md:175`) — i.e., the UI renders empty history
pending a backend implementation the plan refuses to do. So the
acceptance criteria #1 (history table), #3 (date range filter), #4 (CSV
export) are **unachievable** in the plan's scope. **MAJOR** contradiction.

---

## IC7 — [MINOR] ui-spec/specs.md review checklist reveals plans
applied Q1-Q5; ui-spec claims Q1-Q5 in detailed RAQ with no review
checklist copy

**ui-spec/specs.md** doesn't have a review checklist analogous to parent
`specs.md:399-406`.

**Why it matters:** The ui-spec never confirms which post-review findings
(if any) were even considered. Minor — the ui-spec is a self-contained
"Round 1" plan that didn't go through C/B/S/P/BL/Q findings; it borrows
the parent's alphabet arbitrarily.

---

## IC8 — [MINOR] ui-spec/trackable-tasks.md tail summary reports
"Completed: 0, Remaining: 20" while every task checkbox is `[x]`

**ui-spec/trackable-tasks.md:423-428** — "Total Tasks: 20, Completed:
**0**, Remaining: 20, Estimated Effort ~60-80 hours".

But every task in `trackable-tasks.md:76-396` is marked `[x]`.

**Why it matters:** Someone never updated the progress summary table -
the message "completed 0" is technically contradictory to the
`[100%]` reporting in outcomes. Outcome `20-knowledge-propagation-outcome.md`
confirms the UI tasks did execute (Task 20 marked `[x]`). The Progress
Summary table just wasn't updated. **MINOR** inaccuracies but worth
flagging - it impairs ability to use trackable-tasks.md as a quick
status reader without comparing to outcome files.

---

## IC9 — [MAJOR] Parent plan trackable-tasks.md "Quality loop" using
"lint-queue-client" — but `lint-queue-client` is not the tool used by
the actual implementation outcomes

**Parent plan `trackable-tasks.md` (lines 55, 65, 75, etc.)** — Quality
loop instruction: "run `bun tsgo && bun biome:check && lint-queue-client`
on each modified file".

**Actual implementation outcomes** — use `bun run scripts/health/sub-loop.ts
<file> --lifecycle codescene` (see
`ui-spec/trackable-tasks.md:28-32` sub-loop script that runs tsgo → biome →
oxlint → lint:type-aware → check:duplicates → codescene in progressive
order).

**Why it matters:** The parent plan's `lint-queue-client` reference is a
fictional/stale command name. The actual `sub-loop.ts` script is the
correct invocation (and adds codescene stage the parent plan never
mentioned). Re-execution of the parent plan would fail at the quality
loop step.

---

## IC10 — [INFO] Parent plan specs.md REQ-11.1 says path "/settings/whatsapp"
(or `/integrations/whatsapp`); implementation.md decision picks
"/settings/whatsapp"; ui-spec doc and codebase use "/settings/whatsapp"
— minor plan ambiguity vs final consistency

**specs.md:247-248 (REQ-11.1)** — "new Integrations NavGroup … WhatsApp
NavItem linking to `/settings/whatsapp` (or `/integrations/whatsapp`)"
— leaves path ambiguous.

**implementation.md:415** — "Decision: **dedicated `/settings/whatsapp`
route**".

**docs/frontend/whatsapp-ui-patterns.md:7** — page lives at
`app/(dashboard)/settings/whatsapp/` — confirms `/settings/whatsapp`.

INFO only — the docs/resolved.resolve the ambiguity, but the specs.md
"or" wording is unnecessarily wishy-washy. Minor.

---

## IC11 — [MAJOR] r3-comprehensive-review header date mismatches skill
improvement outcome commit dates

**r3-comprehensive-review.md:5** — "**Date**: 2025-01-17".

**whatsapp-implementation-skill-improvement-outcome.md:1-3** — describes
this as "30-task, 12-review-round" integration committed (`62c4ac915`)
to a `whatsapp` branch.

**Parent plan `specs.md:5`** — "Date: 2026-07-30".

**ui-spec/specs.md:9** — "Date: 2025-01-20".

The r3 review (2025-01-17) is older than the parent plan specs (2026-07-30)
but references the same files (99 uncommitted) — temporal confusion.

**Why it matters:** Date conflict suggests either the r3 file was
backdated inconsistently, or the parent plan was reversioned (1.2 dated
2026-07-30) long after the actual implementation/review passed. Minor
 inconsistency in document metadata — but **uncanny because the r3 review
predates the plan specs**. Likely the Date fields in the plans are
post-fact and the r3 review's "Date" was retained from original.

Severity: INFO because it's purely metadata inconsistency and doesn't
impact functionality.

# WhatsApp Plan-Fixes — Design / Implementation (implementation.md)

**Date:** 2026-08-17
**Plan name:** `whatsapp-plan-fixes`
**Skill:** spec-driven-development
**Counterpart:** `specs.md` (requirements) and `trackable-tasks.md` (tasks) in
this directory.

---

## 1. Overview

This is a **documentation-only fix plan**. The fixes target four artifact
classes, all *not* source code:

1. **Stale ui-spec plan source** (3 files + selected outcome annotations) —
   the biggest fix cluster, addressing all 3 CRITICAL + 6 of 7 ui-spec MAJORs.
2. **Stale parent-plan source** (3 files) — 4 MAJORs + 2 MINORs in the
   backend plan set.
3. **Canonical backend doc** (`docs/services/whatsapp-cloud-api.md`) — 3
   MAJOR doc-gaps + 1 MINOR + 1 INFO.
4. **Hygiene files** — `.ai/todo/whatsapp.md` (delete or restructure) and
   `r3-comprehensive-review.md` (date note).

The design's central principle is **canonical-doc-as-source-of-truth**: where
the plan and the docs disagree, the docs win (the analysis already verified
the docs match the codebase). The plan source is massaged back into
conformance with the docs, plus three narrow **doc additions** (deprecated
field names, HTTP status table, Known Open Issues) that the docs themselves
were missing.

No `backend/`, `frontend/`, `app/`, `shared/`, `test/`, or `scripts/` source
file is touched.

---

## 2. Design Goals

- **G1 — Re-executable plans:** a fresh agent reading only the corrected plan
  source must not be led to write `WHATSAPP_MANAGE`, `TIER_250K`, or call a
  `whatsappTemplates` GraphQL query.
- **G2 — Self-consistent docs:** canonical backend doc + UI doc both
  acknowledge the deferred items the plans reference, so neither gives a
  misleading "done" impression.
- **G3 — Outcome-preserving:** existing outcome files are *appended* (e.g.
  short "Author's note" pointing to the corrected plan), never rewritten, so
  the historical record stays intact.
- **G4 — Surgical edits:** every edit is anchored on unique text quoted from
  the analysis files, not on line numbers (which may have drifted since
  2026-08-17). The agent re-verifies each anchor with `grep`/`view` first.
- **G5 — Minimal churn:** the parent plan's Review-Finding Traceability
  matrix and the ui-spec outcome files are *references*, not edit targets —
  edits go to `specs.md` / `implementation.md` / `trackable-tasks.md`
  narrative only, preserving audit history.

---

## 3. Key Design Decisions

### Decision D-A: Canonical doc is the source of truth (not the plans)
**Context:** Every CRITICAL finding is a plan that contradicts a canonical
doc that already matches the codebase.
**Options Considered:**
1. Update the docs to match the plans — *Cons: re-introduces bugs that were
   explicitly fixed in the actual implementation; would be misleading.*
2. Update the plans to match the docs — *Pros: re-executable; preserves the
   implementation's correctness; future agents inherit truth.*
3. Update both to a new agreed truth — *Cons: no third source exists; both
   already disagree only where the plan is wrong.*
**Decision:** Option 2 — update plans to match canonical docs, plus three
narrow doc additions the docs were themselves missing (DG2, DG3, DG5).
**Rationale:** the analysis verified `backend/enum`,
`shared/constants`, and `whatsapp.documents.ts` all match the docs.

### Decision D-B: Don't touch outcome files except minimal annotations
**Context:** The outcome files (`ui-spec/outcome/*.md`, parent
`outcome/*.md`) *already* note many of the contradictions — and they're the
historical record. Editing them would falsify history.
**Options Considered:**
1. Rewrite outcome files to remove the contradictions' "we refused" notes —
   *Cons: destroys the audit trail of what was actually done.*
2. Leave outcome files untouched — *Pros: history intact. Cons: a reader of
   outcomes+plans still sees contradictions.*
3. Add a short "Plan-Correction Note" header at the top of each affected
   outcome file pointing to `.ai/plans/whatsapp-plan-fixes/` so readers see
   the plan has since been corrected — *Pros: preserves history + flags the
   fix.
**Decision:** Option 3 — top-of-file **one-line pointer** in each affected
outcome file (3 ui-spec outcomes + parent `30.1` outcome), no body edits.
**Rationale:** preserves audit history while breaking the contradiction
trap for future readers.

### Decision D-C: Delete `.ai/todo/whatsapp.md` (Option 2b)
**Context:** The file contains only a single GitHub URL to
`wwebjs/whatsapp-web.js` — an unofficial WhatsApp Web automation library that
contradicts the parent plan's Cloud-API-only stance.
**Options Considered:**
1. Replace contents with a structured v2 inbound-chat backlog — *Pros:
   preserves investigation. Cons: the file is in `.ai/todo/` (active todo
   list) not `.ai/finished_plans/backlog/`; an inbound-chat backlog belongs
   in a v2 plan dir, not in the v1 todo dir.*
2. Delete the file — *Pros: removes the contradiction at source; the parent
   plan `specs.md:30-32` already records inbound-chat as out-of-scope v2/BL4
   so no information is lost; the v2 investigation can be re-opened fresh.*
3. Replace contents with "see `specs.md:30-32` for v2 deferral" — *Pros:
   still points the reader to rationale; minimal effort.*
**Decision:** Option 3 — replace the file's contents with a 2-line pointer,
preserving the breadcrumb without keeping the misleading library URL. (If the
maintainer prefers deletion, that's also acceptable; the outcome file records
the choice.)
**Rationale:** defers to the principle "don't silently delete files the user
may rely on" while removing the contradiction. The chosen action is
documented in the task outcome so it's reversible.

### Decision D-D: Surface r3 HIGH findings in the canonical doc, not bury them
**Context:** `r3-comprehensive-review.md:48-51` records "Fixed: 0 / 23" —
zero of 23 review findings were ever resolved, including 2 HIGH (TOCTOU race
in `notification.repository.ts`; `handleMessagesStatus` dead upsert). The
canonical backend doc gives no hint these exist.
**Options Considered:**
1. Add a "Known Open Issues" section to the canonical backend doc listing
   the 2 HIGH findings — *Pros: visible to every doc reader; aligns with
   DG5 recommendation.*
2. Fix the 2 HIGH findings in source code as part of this plan — *Cons:
   out of scope (this is a documentation plan); would explode scope and
   require database tests.*
3. Leave them only in `r3-comprehensive-review.md` — *Cons: the analysis
   flagged this as DG5 / INFO; leaving it leaves the doc misleading.*
**Decision:** Option 1 — add "Known Open Issues" section to
`docs/services/whatsapp-cloud-api.md` and a one-line "see also" cross-link
in the parent plan's `trackable-tasks.md` Phase 4 area.
**Rationale:** in-scope (doc edit), zero source risk, surfaces the
deferred-but-known issues. The actual HIGH-finding fix belongs in a future
backend plan (deferred to `.ai/todo/`).

### Decision D-E: Quality loop is not run on source code (this plan's scope)
**Context:** The spec-driven-development skill mandates per-file
`sub-loop.ts --lifecycle codescene` on every modified file. But the files
modified here are **Markdown** (`.md`) — tsgo, oxlint, biome, and codescene
do not type-check or lint markdown.
**Options Considered:**
1. Run `sub-loop.ts` on every edited `.md` file — *Cons: script is designed
   for `.ts`/`.tsx`; running it on `.md` is a no-op/waste.*
2. Skip quality loop entirely — *Cons: violates the skill's standard.*
3. Run a *markdown linter* / link-checker instead — *Pros: actually
   validates the docs.*
**Decision:** Option 3 — substitute the standard quality loop with a
**markdown link-integrity check**: after editing each doc/plan file, the
agent runs `grep` for every relative path the file references and confirms
the target exists. If the project has a markdown linter available
(`bunx markdownlint-cli2 '**/*.md'`), use it; otherwise skip mechanical
checks and rely on the agent's self-review + the plan-review skill.
**Rationale:** honours the spirit of the skill (verify each file before
moving on) while respecting that the standard toolchain doesn't apply to
markdown.

---

## 4. UX / Navigation Specification

This is a **documentation plan**, not a feature plan, so the standard
UX/Navigation spec (routes, sidebar, role matrix) does not apply. The
artifacts touched are developer-facing documentation only.

The closest analogue for this section:

### 4.1 Files Touched (per audience)

| File | Audience | Change Summary |
|------|----------|----------------|
| `.ai/finished_plans/whatsapp/ui-spec/specs.md` | Future plan executors | Add Assumptions/Non-Assumptions block; remove phantom references; fix scope contradictions |
| `.ai/finished_plans/whatsapp/ui-spec/implementation.md` | Future plan executors | Replace `WHATSAPP_MANAGE` → `WHATSAPP_CONFIG_MANAGE`/`WHATSAPP_TEMPLATES_MANAGE`/`WHATSAPP_VIEW`; drop `TIER_250K`/`TIER_1M`/`ORANGE` keys; note missing backend resolvers inline |
| `.ai/finished_plans/whatsapp/ui-spec/trackable-tasks.md` | Future plan executors | Add `whatsappThroughputLabel.ts` to task 11; add parent-plan deferred-items row (26.3-26.6); correct progress summary; add MobileCardList Suspense + `toggleOptInAction source:"graphql"` notes to task 19 |
| `.ai/finished_plans/whatsapp/specs.md` | Future plan executors | Renumber duplicate items 11-13; align `Q1-Q5` → `Q1-Q6` (or note Q6 reserved); add defensive-strip note (D11) |
| `.ai/finished_plans/whatsapp/implementation.md` | Future plan executors | Fix webhook body-size cap conjunction (D7); add r3 "Known Open Issues" cross-link (IC4 + IC5) |
| `.ai/finished_plans/whatsapp/trackable-tasks.md` | Future plan executors | Replace fictional `lint-queue-client` with `sub-loop.ts` (IC9); add r3 cross-link in Phase 4 task |
| `.ai/finished_plans/whatsapp/r3-comprehensive-review.md` | Maintainers | Add date-context note (IC11) |
| `docs/services/whatsapp-cloud-api.md` | Backend developers | Add deprecated-field gotcha (DG2); HTTP status-code table (DG3); Q1-Q5 reconciliation (DG1); Task-30 note (DG7); "Known Open Issues" section (DG5) |
| `docs/frontend/whatsapp-ui-patterns.md` | Frontend developers | Add "Plan Debt / Deferred parent-plan items 26.3-26.6" section (DG4) |
| `.ai/todo/whatsapp.md` | Maintainers | Replace misleading `wwebjs` URL with a 2-line v2-deferral pointer (D12) |
| 3-4 ui-spec outcome files + parent `outcome/30.1` | Maintainers | Add a top-of-file one-line pointer to `.ai/plans/whatsapp-plan-fixes/` (Decision D-B) |

### 4.2 No New Routes / Sidebar / Permissions
N/A — no UI changes. **No router, sidebar, or permission matrix is
altered.** This is a critical safeguard: the analysis found the ui-spec
*plan* invented `AppPermission.WHATSAPP_MANAGE`, but the **actual permission
enum** is unchanged. The plan's edit must update only the plan text's
*references* to the permission, never the enum itself.

### 4.3 Per-Audience Rendering
N/A — the artifacts are technical documentation accessible only to
developers reading the repo, not rendered in the application UI.

---

## 5. Component Interactions

```
.ai/analysis/whatsapp/*.md   ──┐
                                ├──► specs.md (this plan) ──► trackable-tasks.md
.ai/finished_plans/whatsapp/    │                              │
   ├─ ui-spec/{specs,impl,...}   │                              ▼
   ├─ {specs,impl,...}.md        │                  ┌─ Edits to canonical docs ──► docs/services/whatsapp-cloud-api.md
   ├─ r3-comprehensive-review.md ─►│                │                            docs/frontend/whatsapp-ui-patterns.md
   └─ outcome/*.md               │                ──► Edits to plan files ──► .ai/finished_plans/whatsapp/ui-spec/*.md + parent *.md
                                ┤                                                + .ai/todo/whatsapp.md
                                │                                                + r3-comprehensive-review.md
                                ▼                                                + 3-4 outcome *.md (1-line pointers)
                          Plan-review skill gate (Phase 1.5)
```

The flow: analysis → this plan's specs → design → tasks → plan-review gate
(Phase 1.5) → executing agent reads outcomes first → applies edits anchored
on analysis quotes → writes task outcome → updates checkbox → next task.

---

## 6. Error Handling & Verification Strategy

### 6.1 Pre-edit verification (per edit)
- Each task MUST re-grep the unique anchor string from the analysis file
  before editing. If the anchor is missing, the task is **blocked** and the
  agent writes a "CROSS-FILE DEPENDENCY" report to the outcome (per Fix-Or-
  Report rule).
- Edits use the `edit` tool with `old_str` containing enough surrounding
  context to be unique.

### 6.2 Post-edit verification (per file)
- `grep -c` for each forbidden symbol (`WHATSAPP_MANAGE`, `TIER_250K`,
  `TIER_1M`, `qualityOrange`, `lint-queue-client`, `Q10`, `Q11`) — MUST
  return 0 in the corrected files.
- For each canonical doc edit, re-grep the new anchor content to confirm
  presence.
- **Markdown link integrity check**: for every relative path the edited
  file references (e.g. `` `trackable-tasks.md:325-328` ``), verify the
  target exists with `view`.

### 6.3 Plan-wide verification (after all tasks)
- Run the **plan-review skill** (Phase 1.5). Required exit: "Plan passes all
  AGENTS.md rules". Fix and re-run until pass. Write
  `.ai/plans/whatsapp-plan-fixes/outcome/plan-review-R1.md`.
- `git diff --stat` to confirm: zero changes to `backend/`, `frontend/`,
  `app/`, `shared/`, `test/`, `scripts/`. If any source path appears in the
  diff, **abort and investigate** (this plan must not touch source).

### 6.4 Risk register
- **R1 (low)**: line numbers in `.ai/analysis/whatsapp/*.md` may have
  drifted since 2026-08-17. **Mitigation:** anchor edits on unique text,
  not line numbers; re-grep first.
- **R2 (low)**: the ui-spec outcome files contain rich context the agent
  might mis-edit. **Mitigation:** Decision D-B — only add a top-of-file
  one-line pointer; never edit outcome file body.
- **R3 (low)**: deleting `.ai/todo/whatsapp.md` could surprise the user.
  **Mitigation:** Decision D-C — replace contents, don't delete (user can
  delete later if preferred).
- **R4 (low)**: the plan-review skill might flag the plan as missing a
  UX/Navigation spec (it's a docs-only plan). **Mitigation:** §4 above
  explicitly states N/A with rationale; plan-review notes should be
  addressed contextually, not by inventing fake routes.

---

## 7. Testing Strategy

### 7.1 No automated tests
This plan does not change executable code, so unit/integration/E2E tests
do not apply. The `bun run test:*` suites are NOT run as part of this plan.

### 7.2 Manual verification checklist (per task)
- [ ] Anchor string re-grepped and matched exactly once before edit.
- [ ] `edit` succeeded (`old_str` matched exactly one occurrence).
- [ ] Post-edit `grep -c` for forbidden symbol = 0 in corrected file.
- [ ] Any relative path referenced by the edited file exists.
- [ ] Outcome file written to `.ai/plans/whatsapp-plan-fixes/outcome/`.
- [ ] Checkbox updated in `trackable-tasks.md`.

### 7.3 Plan-review gate (mandatory)
Phase 1.5 invokes the `@plan-review` skill on the complete plan (specs.md
+ this implementation.md + trackable-tasks.md). Required exit: clean.
Write outcome `plan-review-R1.md`.

---

## 8. Knowledge Propagation (Phase 7 — final task)

After all fixes are applied and the plan-review gate is clean, the final
task creates a **canonical knowledge file** documenting the
"plan-vs-doc reconciliation pattern" for future use:

- **Doc file:** `docs/workflows/plan-doc-reconciliation.md` (NEW)
  - Section: "Why reconcile finished plans against canonical docs"
  - Section: "Anchor edits on quoted text, not line numbers"
  - Section: "Don't rewrite outcome files — append pointers"
  - Section: "Surface deferred review findings in canonical docs"
- No AGENTS.md / instructions / skill updates needed — this is a
  one-off documentation process, not a recurring pattern that warrants a
  skill section. (If the pattern recurs a 2nd+ time, escalate to a skill
  update at that point.)
- Update root `AGENTS.md` Important References with a one-line reference
  to the new doc.

---

## 9. Out-of-Scope Deferred Items

The following were considered and **explicitly deferred** (recorded in
`.ai/plans/whatsapp-plan-fixes/outcome/deferred-items.md` if any task hits
them):

| Deferred Item | Why Deferred | Owner of Future Fix |
|---------------|--------------|---------------------|
| Source-code fixes for r3 HIGH findings (TOCTOU race, dead upsert) | Out of scope (docs-only plan); requires db tests | Future backend plan |
| Backend `whatsappTemplates` / `whatsappOptInAudit` GraphQL resolvers (parent 26.3-26.6) | Parent plan deferred to v2/BL1/BL4; this plan only documents the deferral | Future backend plan |
| Q6 spec code population (if anyone remembers what Q6 meant) | No source can retrieve the original intent; doc adopts Q1-Q5 | N/A |
| Making `whatsapp-implementation-skill-improvement-outcome.md` quality check non-Pending (D10) | Historical file; can't be retroactively updated without falsifying | N/A |
| Removing the `outcome/research-*.md` temporary research files | They're historical artefacts; removing destroys the research trail | N/A |

---

## 10. References

- `.ai/plans/whatsapp-plan-fixes/specs.md` — requirements (Phase 1, this plan).
- `.ai/plans/whatsapp-plan-fixes/trackable-tasks.md` — tasks (Phase 3).
- `.ai/analysis/whatsapp/*.md` — ground-truth findings (D1-D12, DG1-DG7,
  PG1-PG8, IC1-IC11).
- `.agents/skills/spec-driven-development/SKILL.md` — the methodology driving
  this plan's structure.
- `AGENTS.md` — project conventions (no console, barrel rules, i18n rules —
  applicable to any source edits this plan will NOT make).

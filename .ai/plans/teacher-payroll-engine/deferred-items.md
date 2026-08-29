# Deferred Items Ledger

**Feature:** `<feature-name>`  
**Plan:** `.ai/plans/<feature-name>/`  
**Created:** `<YYYY-MM-DD>`

---

## Purpose

This ledger tracks all work deferred from one task to another to ensure no deferred item is forgotten. Every deferred item must be explicitly logged here and resolved before the plan is marked complete.

---

## Ledger Table

| ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes |
|---|---|---|---|---|---|---|
| D1 | Example: `createManyDeliveries` bulk write | 6 | 13 | ✅ Done | R5 outcome | Implemented in Task 13.2 |
| D2 | Example: Env-config key registration | 5 | 7 | ❌ Blocked | — | Never registered; breaks cache invalidation |
| D3 | Example: `resetWhatsappChannel` cache completeness | 3 | 7 | ⚠️ Partial | R7 | Missing 3 keys until R7 fix |
| D4 | GraphQL codegen refresh for new `AppPermission` values (`accounting.payroll_view` / `accounting.payroll_manage`) | 0.2 | 2.1–2.7 | ✅ Done | 2.7 outcome | Both values present in the freshly regenerated artifacts: SDL `schema.graphql` lines 195-196 (`ACCOUNTING_PAYROLL_MANAGE` / `ACCOUNTING_PAYROLL_VIEW`) and `gql/graphql.ts` enum members lines 91-92 (`AccountingPayrollManage` / `AccountingPayrollView`) after the Phase-2-closing `bun run generate:gqlSchema && bun codegen` run (both exit 0) |
| D5 | PG enum value propagation: `ALTER TYPE system_setting_category ADD VALUE 'payroll'` must ship in the Task 0.6 migration (drizzle diff should emit it from the TS enum change — verify before applying) | 0.3 | 0.6 | ✅ Done | 0.6 outcome | Shipped in `backend/drizzle/20260829031638_payroll_calculation_types/migration.sql` (types unit); applied to dev + test DBs via `bun run db migrate`; the `payroll` label verified present on `system_setting_category` by the payroll-columns migration test |
| D6 | `CalculationStatusPothosEnum` must be IMPORTED (not re-registered) by Phase 2/4 Pothos tasks — `implementation.md` §4.1 snippet re-registers it in `payroll.pothos.ts`, which triggers the Pothos "already declared" runtime error | 0.1 | 2.1 / 4.1 | ✅ Done | 2.1-2.2 outcome | 2.1 honored: `payroll.pothos.ts` imports the enum from `@/backend/graphql/pothos/shared/enum.pothos` (zero `enumType` calls, grep-verified); 2.2 imports it likewise; `generate:gqlSchema` exit 0 + runtime schema spot-check prove no duplicate registration. The enum stays registered once in `shared/enum.pothos.ts` (line 250) |
| D7 | Green run of the payroll grace-settings test (`backend/db/test/repo/shared/system-settings.repository.test.ts`) — currently 22/23 pass, 1 fail with PG 22P02 `invalid input value for enum system_setting_category: "payroll"` | 0.5 | 0.6 | ✅ Done | 0.6 outcome | Re-run after 0.6 applied: 23 pass / 0 fail / 41 expect() calls, exit 0 — the payroll grace-settings test passes unedited (D5 enum value + migration 37 settings rows in place) |
| D8 | `system_settings` CHECK constraint rejecting negative payroll grace values (risk-table mitigation + AC-8.4 "new CHECK") — never implemented; migration 37 is INSERT-only | 1.4 | Final hardening gate (pre-TB.3 pentest) | 🔄 In Progress | 1.4 outcome | `resolveGraceSettings`' runtime fallback (warn + wholesale defaults) fully protects the calculation path; the settings write path can still persist negatives — add a dialect-aware CHECK scoped to the three `payroll.grace_*` rows or validate in the settings upsert path before plan completion |
| D9 | Payroll-reports UI strings referenced by AC-1.3 and the page-composition section but absent from the authoritative §7.1 label inventory: Subject column header, per-row Override action label, Export CSV button label | 3.3 | 4.4–4.6 (filter bar / data grid / toolbar) | 🔄 In Progress | 3.3–3.5 outcome | dashboard.billing.payroll implements §7.1 verbatim (37 keys, EN/AR parity compile-enforced); Phase 4 must either reuse existing shared labels (filters.teacher/filters.student double as column headers; check commonTranslations for generic Export/Override strings) or extend the namespace with the three missing keys (additive: types + en + ar + snapshot regen) |
| D10 | Spec contradiction on `outcome = ABSENT` + `actualStartAt IS NULL` pay semantics: AC-4.4 says teacher-absence (zero pay) while AC-3.2 and implementation.md §3.3 pay the full scheduled window (the row falls to the on-time branch) and the task-1.2 report flags label it as NEITHER absence | 1.6 | Mid-point review gate | ✅ Done | midpoint-fix-1-calculation-cluster-outcome | Gate verdict: OVERRIDE to AC-4.4 zero-pay (landed before TB.1). `classifyPayrollBranch` teacher-absence branch is now bare `actualStartAt == null` whatever the outcome; report SQL flags mirror it (`isTeacherAbsence` = `actualStartAt IS NULL`, `isStudentAbsence` = ABSENT + telemetry present); the 1.9 full-pay test flipped to zero-pay and joined by ABSENT-null / LEAVE-null / on-demand joined-vs-unjoined companions. Verified: 43/43 calculation tests, 23/23 report repo tests, 8/8 sub-loop gates exit 0
| D11 | Dedicated errors-locale key for the note-required override validation (Refund/Partially without note) — server currently throws the generic `tErrors.invalidInput`; the UI namespace has `validation.noteRequired` but `ErrorsLabels.payroll` does not | 1.7 | 5.x (override dialog) or 7.1 (i18n polish) | 🔄 In Progress | 1.6–1.8 outcome | Additive `payroll.noteRequired` key = types + en + ar + errors snapshot regen; until then the localized generic message is user-safe |
| D12 | Settlement-flip race hardening in `TeacherDueService.markAsPaid`: the linked-instance batch read is unlocked and `SchedulingRepository.updatePayrollCalculation` updates by id with no status precondition — sequential duplicate settlements are guarded (only `WAITING_PAID` rows flip; test-proven) and concurrent duplicates serialize on the `teacher_dues` UPDATE row locks, but a forced override on a `WAITING_PAID` row racing a payment can be stomped to `PAID` with a stale event `fromState` | 1.13 | Phase-2 hardening / TB test pass | 🔄 In Progress | 1.12–1.13 outcome | Fix needs a repo change (locked batch read `getByIds(ids, tx, {forUpdate})` or a status-preconditioned update) — out of the wiring task's file scope; see outcome's semantic review for the full race analysis |
| D13 | `TeacherDueRepository.markAsPaid` applies no `PENDING` status filter (pre-existing): re-submitting already-settled due ids re-links their `teacherPaymentId` to the newer payment — the instance flip is guarded but the due row is not | 1.13 | Phase 2 (markTeacherDuesPaid mutation hardening) or repo follow-up | 🔄 In Progress | 1.12–1.13 outcome | Either filter `status = PENDING` in the repo UPDATE (RETURNING then reports skipped rows) or guard in the mutation layer; coordinate with D12 if the repo file is touched |
| D14 | Actor-less system flows and non-payroll-manage actors never produce an auto payroll snapshot: (a) `ClassInstanceExpiryService` (missed-by-system cron → COMPLETED+ABSENT) calls `SchedulingRepository.markClassMissedBySystem` directly with no actor and no trigger wired; (b) the on-demand no-credits resolver cron calls `markNoCreditsBatch` without `actorUserId`, so the auto-trigger defers with a warning; (c) transitions driven by actors lacking `ACCOUNTING_PAYROLL_MANAGE` (e.g. a teacher marking their own session absent) invoke the calculator but its internal `requirePermission` gate rejects — caught + logged, row stays `NOT_CALCULATED` | 1.11 | Review-gate policy decision (system actor vs. permission bypass for the internal auto-trigger), then Phase-2 hardening / TB.1 | 🔄 In Progress | 1.11 outcome | No system-actor precedent exists in the repo and the calculator is permission-gated, so the wiring task used the transitioning user and deferred actor-less flows; deferred rows keep the `calculation_status` default `NOT_CALCULATED` and are reconcilable via the US-6 override dialog (Calculated mode re-runs the calculator) |
| D15 | Task 2.7 codegen acceptance (typed `PayrollReportQuery` + `ApplyPayrollOverrideMutation` hooks) is document-driven: `gql/graphql.ts` runs `typescript-operations` + `typed-document-node` and only emits types reachable from `sharedDocuments/**` + `frontend/views/**/*.documents.ts`, so no payroll content appears until task 4.1 documents exist. SDL side is DONE: the 2.1-2.2 regen (`generate:gqlSchema`, exit 0) wrote all six payroll type definitions + the 7 ClassInstanceDetail payroll fields into `schema.graphql` (+93/-0); the 2.3-2.4 regen added both root fields (`payrollReport` query + `applyPayrollOverride` mutation, +16 lines, +109 total vs HEAD) | 2.1–2.2 | 2.7 (verify SDL) + 4.1 (regen emits operation types) | ✅ Done | 4.1 + 2.7 outcome | 4.1 landed `frontend/common/graphql/sharedDocuments/teachers/payroll.documents.ts` (payrollReportQueryDocument + applyPayrollOverrideMutationDocument; id/instanceId/auditEventId selected for Apollo cache normalization); `bun run generate:gqlSchema && bun codegen` both exit 0 and emitted `PayrollReportQuery` + `PayrollReportQueryVariables` + `ApplyPayrollOverrideMutation` + `ApplyPayrollOverrideMutationVariables` + the `PayrollReportFilter`/`PayrollOverrideInput` input types into `gql/graphql.ts` (grep lines 1440/1450/5264/5267/5275/5278) — Phase-2 acceptance GRANTED |
| D16 | Payroll-override attribution while impersonating: `applyPayrollOverride` uses permission-only authScopes (no `notImpersonating`), so a superadmin impersonating an accounting operator can trigger overrides attributed to the impersonated operator (`ctx.user.id` on the PAYROLL_OVERRIDE audit event; `ctx.realUserId` is not recorded) | 2.4 | Review-gate policy decision (adopt billing-management-style `notImpersonating: true`, or ratify the teachers-domain convention) | 🔄 In Progress | 2.3-2.4 outcome | Follows the implementation.md §4.3 snippet and the closest teachers-domain financial sibling (`markTeacherDuesPaid`, permission-only); every teachers-domain mutation attributes impersonated actions to the impersonated user, so this is repo-wide behavior, not payroll-specific — flipping to `notImpersonating: true` in `payroll.mutation.ts` is a one-line change if the gate ratifies the stricter policy |
| D17 | CSV export ergonomics are machine-first by design: column headers are raw `PayrollReportRow` field names (not localized labels) and the file carries no UTF-8 BOM (matches every existing CSV export in the repo; charset is declared via `Content-Type: text/csv; charset=utf-8`) | 2.6 | Phase 4+ / i18n polish (only if operators report Excel mojibake or ask for localized headers) | 🔄 In Progress | 2.6 outcome | Deliberate decision documented in the 2.6 outcome file §Deliberate decisions; changing headers or adding a BOM later is additive and does not affect the `X-Export-Truncated` contract or the query-param names |
| D18 | `isOnDemand` input-field removal: MP-fix-1 re-documented it as a provenance marker with no branch weight (absence semantics key on outcome + attendance telemetry alone), but the field is still computed and passed by the scheduling trigger wiring | Mid-point review gate (MP-fix-1, F2) | class-session.service.ts owner (delete the wiring at :428 + the scheduling-payroll-trigger.test.ts pass-through assertion) | 🔄 In Progress | midpoint-fix-1-calculation-cluster-outcome | Removal blocked in MP-fix-1 by file ownership; one-line wiring deletion + trigger-test assertion update, cheap while the schema/UI is unshipped. Sibling finding F3 (`clientRequestId` idempotency) was completed outright in the same fix: a provided token keys the hash on (instanceId, token) under a distinct prefix, absent/blank falls back to the content-derived key — no deferral

---

## Status Values

- ✅ **Done** — Item completed and verified (with reference to outcome file or commit)
- ⚠️ **Partial** — Partially completed, needs follow-up work
- ❌ **Blocked** — Not resolved, plan cannot complete until addressed
- 🔄 **In Progress** — Currently being worked on

---

## Usage Guidelines

### When to Add a Deferred Item

Add a row to this table when:
1. A task discovers work that belongs to a different task/phase
2. A technical constraint requires splitting work across tasks
3. A dependency is discovered that blocks immediate completion
4. A TODO comment is added to code with "deferred to Task X"

**Format:**
```markdown
| D<next-id> | <Brief description> | <source-task-id> | <target-task-id> | ❌ Blocked | — | <Context/rationale> |
```

### When to Update Status

Update the status when:
- **To 🔄 In Progress:** Target task begins working on the item
- **To ⚠️ Partial:** Item partially resolved but needs follow-up
- **To ✅ Done:** Item fully resolved and verified
  - Add verification reference (outcome file, commit hash, review round)
  - Example: `R5 outcome` or `commit abc123f` or `Task 13.2 complete`

### When to Reference in Outcome Files

In task outcome files, reference this ledger when:
- Adding a deferred item: "Deferred X to Task Y (see deferred-items.md D3)"
- Completing a deferred item: "Resolved deferred item D3 (see deferred-items.md)"

---

## Enforcement

The **final quality gate task** (last task before Phase 7: Knowledge Propagation) MUST verify all deferred items are resolved:

```bash
# Count unresolved items
grep -c "❌\|⚠️" .ai/plans/<feature-name>/deferred-items.md

# Expected: 0
# If >0: Task is blocked — resolve all ❌/⚠️ items before plan completion
```

**Exit criteria:** Plan cannot be marked complete if any ❌ or ⚠️ status remains.

---

## Common Deferred Item Patterns

### Env-Config Registration
```markdown
| DX | Env-config: `NEW_CONFIG_KEY` registration | <task> | 7 (schema) | ❌ Blocked | — | Key resolved via `resolveEnvConfig` but never added to `env-config-keys.ts` |
```

### Cache Invalidation Completeness
```markdown
| DX | `resetX()` function missing keys | <task> | <task> | ❌ Blocked | — | Function invalidates some but not all keys resolved via `resolveEnvConfig` |
```

### Bulk Write Operations
```markdown
| DX | `createManyX()` bulk write optimization | <task> | <task> | 🔄 In Progress | — | Single-row insert works; bulk optimization deferred for performance phase |
```

### Test Coverage Gaps
```markdown
| DX | Integration test for edge case Y | <task> | <task> | ⚠️ Partial | — | Happy path tested; error path deferred pending mock setup |
```

### Migration/Seed Data
```markdown
| DX | Seed data for new enum values | <task> | 10 (seeds) | ✅ Done | Task 10.3 | Added to `6b-permissions-data.sql` |
```

---

## Anti-Patterns (What NOT to Do)

❌ **Don't defer without logging:** "I'll handle this later" without adding to ledger  
❌ **Don't use vague descriptions:** "Fix the thing" → use specific item names  
❌ **Don't mark ✅ without verification:** Status changes must reference outcome file or commit  
❌ **Don't leave ⚠️ unresolved:** Partial items must have a plan for completion  
❌ **Don't defer critical bugs:** Security, data corruption, or blocking bugs must be fixed immediately

---

## Example: Complete Lifecycle

### Task 5: Implementation discovers missing env-config registration
**Outcome file excerpt:**
> "Added `WHATSAPP_ACCESS_TOKEN` resolution via `resolveEnvConfig` in adapter. Registration in `env-config-keys.ts` deferred to Task 7 schema setup (see deferred-items.md D2)."

**Ledger entry:**
```markdown
| D2 | Env-config: `WHATSAPP_ACCESS_TOKEN` | 5 | 7 | ❌ Blocked | — | Key used in adapter but not registered |
```

### Task 7: Schema task resolves the deferred item
**Outcome file excerpt:**
> "Registered `WHATSAPP_ACCESS_TOKEN` in `env-config-keys.ts` line 42. Resolves deferred item D2 from Task 5 (see deferred-items.md)."

**Ledger update:**
```markdown
| D2 | Env-config: `WHATSAPP_ACCESS_TOKEN` | 5 | 7 | ✅ Done | Task 7.2 outcome | Registered in env-config-keys.ts:42 |
```

### Final Quality Gate: Enforcement check passes
```bash
$ grep -c "❌\|⚠️" .ai/plans/whatsapp/deferred-items.md
0
# ✅ All deferred items resolved — plan can proceed to Knowledge Propagation
```

---

## Related Documents

- Task template: `.agents/spec-process-guide/templates/tasks-template.md` — Phase 1 setup, Final quality gate
- Execution guide: `.agents/spec-process-guide/execution/implementation-guide.md` — Deferred item workflow
- SKILL.md: `.agents/skills/spec-driven-development/SKILL.md` — Deferred-items ledger enforcement

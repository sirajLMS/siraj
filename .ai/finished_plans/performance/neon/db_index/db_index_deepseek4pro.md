# Plan: Task 4.1 — Schema Indexing Audit

**Target Directory:** `.ai/plans/neon`
**Outcome Directory:** `.ai/plans/neon/outcome`
**Related Tasks:** [tasks.md](file://.ai/plans/neon/tasks.md)
**Related Spec:** [spec.md](file://.ai/plans/neon/spec.md)
**Related Design:** [design.md](file://.ai/plans/neon/design.md)

---

## 1. Scope (Confirmed)

- **High-priority missing indexes only** (15 indexes across 6 schema files)
- **Standard `CREATE INDEX`** via `drizzle-kit generate`
- **Schema + Migration** — modify schema files AND generate migration SQL

---

## 2. Audit Methodology

Cross-referenced every `where(eq(...))`, `where(and(...))`, `where(isNull(...))`, and `orderBy(...)` call in `backend/db/repo/**/*.ts` against the indexes declared in `backend/db/schema/**/*.ts`. Columns that appear in WHERE/ORDER BY clauses but lack a corresponding index are flagged as missing.

### Index Types to Add

| Type | Pattern | Example |
|---|---|---|
| Single-column FK | `index("table_fk_idx").on(table.fkCol)` | `index("complaints_student_id_idx").on(table.studentId)` |
| Single-column soft-delete | `index("table_deleted_at_idx").on(table.deletedAt)` | `index("invoices_deleted_at_idx").on(table.deletedAt)` |
| Single-column sort | `index("table_col_idx").on(table.col)` | `index("invoices_issue_date_idx").on(table.issueDate)` |

### Why NOT Partial Indexes for `deletedAt`

Partial indexes (`WHERE deleted_at IS NULL`) are NOT used for soft-delete columns because:
- PostgreSQL handles NULL efficiently in standard B-tree indexes
- Partial indexes can confuse the query planner when the query doesn't exactly match the partial predicate
- Standard indexes also serve queries that filter on `deleted_at IS NOT NULL` (admin views)

---

## 3. Files to Edit (6 total)

### 3.1 `backend/db/schema/billing/billing.ts` — 2 indexes

**Table: `invoices`**

| # | Index Name | Column(s) | Reason |
|---|-----------|-----------|--------|
| 1 | `invoices_deleted_at_idx` | `deletedAt` | Soft-delete filter in nearly every invoice query (`isNull(invoices.deletedAt)`) |
| 2 | `invoices_issue_date_idx` | `issueDate` | Used in `ORDER BY desc(invoices.issueDate)` for paginated listings |

**Edit location:** Append to the existing `table => [...]` callback (currently has `invoices_parent_id_idx`, `invoices_student_id_idx`, `invoices_status_idx`, `invoices_invoice_type_idx`, `invoices_currency_idx`).

### 3.2 `backend/db/schema/communications/communications.ts` — 5 indexes

**Table: `complaints`** — 3 indexes

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 3 | `complaints_student_id_idx` | `studentId` | FK column, joined in queries but no index |
| 4 | `complaints_deleted_at_idx` | `deletedAt` | Soft-delete filter in every complaint query |
| 5 | `complaints_created_at_idx` | `createdAt` | Used in `ORDER BY desc(complaints.createdAt)` |

**Table: `complaint_responses`** — 1 index

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 6 | `complaint_responses_created_at_idx` | `createdAt` | Used in `ORDER BY desc(complaintResponses.createdAt)` |

**Table: `suggestions`** — 1 index

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 7 | `suggestions_created_at_idx` | `createdAt` | Used in `ORDER BY desc(suggestions.createdAt)` |

**Existing indexes on `complaints`:** `complaints_parent_id_idx`, `complaints_category_idx`, `complaints_status_idx`
**Existing indexes on `complaint_responses`:** `complaint_responses_complaint_id_idx`, `complaint_responses_responder_id_idx`
**Existing indexes on `suggestions`:** `suggestions_submitted_by_user_id_idx`, `suggestions_status_idx`

### 3.3 `backend/db/schema/classes/scheduling.ts` — 3 indexes

**Table: `class_instances`** — 2 indexes

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 8 | `class_instances_deleted_at_idx` | `deletedAt` | Soft-delete filter in every class instance query |
| 9 | `class_instances_recurring_schedule_id_idx` | `recurringScheduleId` | FK column, filtered in queries but no dedicated index |

**Table: `recurring_schedules`** — 1 index

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 10 | `recurring_schedules_deleted_at_idx` | `deletedAt` | Soft-delete filter |

**Existing indexes on `class_instances`:** `class_instances_teacher_id_idx`, `class_instances_student_id_idx`, `class_instances_execution_state_idx`, `class_instances_outcome_idx`, `class_instances_scheduled_start_at_idx`, `class_instances_teacher_state_start_idx` (composite), `class_instances_teacher_state_outcome_idx` (composite), `class_instances_teacher_state_start_outcome_idx` (composite)
**Existing indexes on `recurring_schedules`:** `recurring_schedules_teacher_id_idx`, `recurring_schedules_student_id_idx`, `recurring_schedules_class_subject_id_idx`, `recurring_schedules_timezone_id_idx`, `recurring_schedules_meeting_provider_id_idx`, `recurring_schedules_user_meeting_config_id_idx`, `recurring_schedules_teacher_meeting_config_id_idx`, `recurring_schedules_teacher_id_student_id_idx` (composite)

### 3.4 `backend/db/schema/classes/class-category.ts` — 1 index

**Table: `class_categories`**

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 11 | `class_categories_deleted_at_idx` | `deletedAt` | Soft-delete filter |

**Existing indexes:** `class_categories_slug_idx`

### 3.5 `backend/db/schema/classes/class-subject.ts` — 1 index

**Table: `class_subjects`**

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 12 | `class_subjects_deleted_at_idx` | `deletedAt` | Soft-delete filter |

**Existing indexes:** `class_subjects_category_id_idx`, `class_subjects_slug_idx` (unique)

### 3.6 `backend/db/schema/teachers/teacher-dues.ts` — 2 indexes

**Table: `teacher_dues`**

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 13 | `teacher_dues_student_id_idx` | `studentId` | FK column, no index |
| 14 | `teacher_dues_teacher_payment_id_idx` | `teacherPaymentId` | FK column, no index |

**Existing indexes:** `teacher_dues_teacher_id_idx`, `teacher_dues_class_instance_id_idx` (unique), `teacher_dues_status_idx`, `teacher_dues_approved_at_idx`

### 3.7 `backend/db/schema/billing/credit-transactions.ts` — 1 index

**Table: `credit_transactions`**

| # | Index | Column(s) | Reason |
|---|-----------|-----------|--------|
| 15 | `credit_transactions_created_at_idx` | `createdAt` | Used in `ORDER BY desc(creditTransactions.createdAt)` |

**Existing indexes:** `credit_transactions_idempotency_key_unique_idx` (unique), `credit_transactions_student_id_idx`, `credit_transactions_reason_idx`, `credit_transactions_class_instance_id_idx`

---

## 4. Implementation Steps

### Step 1: Edit Schema Files
Edit each of the 6 schema files to add the new `index(...)` calls to the existing `table => [...]` arrays.

### Step 2: Per-File Quality Verification
After each file edit, run:
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"4.1-index","files":["<file-path>"]}'
```

### Step 3: Generate Migration
```bash
bun drizzle-kit generate
```
This will create a new migration SQL file under `backend/drizzle/` with all 15 `CREATE INDEX` statements.

### Step 4: Global Health Check
```bash
bun tsgo
bun biome:check
bun run lint
```
All MUST exit with zero errors and zero warnings.

### Step 5: Write Outcome File
Create `.ai/plans/neon/outcome/4.1-schema-indexing-audit-outcome.md` documenting:
- Audit methodology
- All 15 indexes added with their rationale
- Migration file generated
- Quality gate results

### Step 6: Update Progress
Mark task 4.1 as `[x]` in `.ai/plans/neon/tasks.md`.

---

## 5. Index Naming Convention

All indexes follow the existing project convention: `{table_name}_{column_name(s)}_idx`

- Single column: `{table}_{col}_idx`
- Composite: `{table}_{col1}_{col2}_idx`

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Migration may fail on existing data | All indexes are on nullable or existing columns; no data migration needed |
| Index bloat on write-heavy tables | `deletedAt` and `createdAt` are append-only; write overhead is minimal |
| Query planner may not use new indexes | Standard B-tree indexes on filtered columns are reliably used by PostgreSQL |
| `drizzle-kit generate` may produce unexpected SQL | Review generated migration SQL before applying |

---

## 7. Verification Criteria

- [ ] All 15 indexes added to schema files
- [ ] `bun tsgo` passes with 0 errors
- [ ] `bun biome:check` passes with 0 errors
- [ ] `bun run lint` passes with 0 errors and 0 warnings
- [ ] `drizzle-kit generate` produces a valid migration SQL file
- [ ] Migration SQL contains exactly 15 `CREATE INDEX` statements
- [ ] Outcome file written to `.ai/plans/neon/outcome/4.1-schema-indexing-audit-outcome.md`
- [ ] Task 4.1 marked `[x]` in `tasks.md`
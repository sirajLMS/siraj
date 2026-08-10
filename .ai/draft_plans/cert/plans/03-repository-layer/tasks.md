# Plan 03 — Repository Layer: Tasks

> **Feature**: Certificate Module — Repository Layer (Data Access)
> **Plan #**: 03
> **Dependencies**: Plan 1 (DB Schema & Enums), Plan 2 (Types & Permissions)
> **Execution Model**: Sequential per task (each task produces files the next task imports)
> **Quality Model**: Per-file progressive verification via `scripts/health/sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene in one command, short-circuiting on first failure)
> **Time Budget**: 2-4 hours per task

---

## Task Dependency Graph

```
T01 (i18n schema) ─────────┐
                           ├─→ T02 (barrel)  ─→ T03 (CertificateRepo)
                           │                   ├─→ T04 (TemplateRepo)
                           │                   ├─→ T05 (TemplateElementRepo)
                           │                   ├─→ T06 (TemplateVariableRepo)
                           │                   ├─→ T07 (RecipientGroupRepo)
                           │                   ├─→ T08 (VerificationRepo)
                           │                   └─→ T09 (CategoryRepo)
                           │                         │
                           │                         ├─→ T10 (soft-delete registry)
                           │                         ├─→ T11 (top-level barrel)
                           │                         └─→ T12 (repo index)
                           │                                │
                           │                                └─→ T13 (knowledge propagation)
                           └──────────────────────────────────┘
```

**Execution order**: T01 → T02 → (T03, T04, T05, T06, T07, T08, T09 in parallel after T02) → T10 → T11 → T12 → T13

---

## T01 — Create i18n Error Translation Schema and Implementations

**Estimated time**: 2 hours
**Depends on**: Plan 2 (Types) complete
**Requirements**: REQ-KNOW-002, §3.2, §3.3, AC-18, AC-19, AC-20, AC-21

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — i18n system rules (compile-time TypeScript, function-per-key)
   - `AGENTS.md` root — path alias conventions

2. **Read applicable instruction files**:
   - `.github/instructions/backend.instructions.md`

3. **Modify the `ErrorsLabels` aggregate type at `shared/locale/types/errors/index.ts`** — verified single backend error-translation registry (~308 lines, with sub-interfaces per domain `BillingErrors`, `StudentErrors`, etc., plus a flattened backward-compat section for legacy keys like `studentCreateFailed`). DO NOT create a flat per-domain file — verified reality: the backend errors layer uses the single aggregate `shared/locale/types/errors/index.ts` (no flat-file per-domain scheme exists in `shared/locale/`). Instead:
   - Append a new `CertificateRepoErrors` interface (or `CertificateErrors` to match existing siblings) with one function-signature per key listed in `requirements.md` §3.2.
   - Add `certificate: CertificateRepoErrors;` to the `ErrorsLabels` aggregate (mirroring how `student: StudentErrors`, `billing: BillingErrors` are composed — verified in `shared/locale/types/errors/index.ts`).
   - Keys with no params: `() => string`; keys with params: `(id: string) => string`, `(slug: string, version: number) => string`, etc.; pluralized keys: `(id: string, count: number) => string` — the locale impl dispatches on count.
   - Optionally also add a few flattened backward-compat legacy keys (e.g. `certificateCreateFailed: (input) => string`) to the `ErrorsLabels` flattened section — verified pattern: `student.repository.ts:132` calls `tErrors.studentCreateFailed` (a flattened legacy key on `ErrorsLabels`), so flatten paths for any cross-domain call sites for ergonomics.

4. **Modify the English implementation at `shared/locale/en/errors/index.ts`** — verified single English errors file (one nested domain object per domain — `student: { ... }`, `billing: { ... }`, etc.). DO NOT create a flat per-domain file. Instead:
   - Add a nested `certificate: { <key>: (...args) => string }` object with one const function per key, matching the type schema signatures defined in step 3.
   - Pluralization: `one` / `other` CLDR forms for `categoryHasTemplates` (English).

5. **Modify the Arabic implementation at `shared/locale/ar/errors/index.ts`** — verified single Arabic errors file matching the English shape. DO NOT create a flat per-domain file. Instead:
   - Add a nested `certificate: { ... }` object mirroring the English impl (same key set, same signatures).
   - Pluralization: six CLDR forms for `categoryHasTemplates` (`zero`/`one`/`two`/`few`/`many`/`other`) for Arabic.

### Quality Loop

For each file created:
```bash
bun tsgo
bun biome:check -- <file>
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"t01","files":["<file>"]}'
```

Or equivalently:
```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle lint
```

### Verification
- `bun tsgo` passes with zero new type errors
- Arabic pluralization covers all six forms
- No hardcoded English or Arabic strings in repository files (they will use `tErrors`)

---

## T02 — Create Certificate Sub-Directory Barrel

**Estimated time**: 30 minutes
**Depends on**: T01 (i18n schema exists for type imports)
**Requirements**: AC-22

### Subtasks

1. **Read** `backend/db/repo/AGENTS.md` — barrel structure rules
2. **Read** one existing sub-barrel for reference (e.g., `backend/db/repo/storage/index.ts`)
3. **Create** `backend/db/repo/certificates/index.ts`:
   - Re-export each repository namespace: `CertificateRepository`, `TemplateRepository`,
     `TemplateElementRepository`, `TemplateVariableRepository`,
     `RecipientGroupRepository`, `VerificationRepository`, `CertificateCategoryRepository`
   - Type-only re-exports for filter types if needed from `@/backend/types/certificates/*`

> **Note**: This barrel will initially fail tsgo because the repository files don't exist yet.
> Create it after T03-T09 are done. Alternatively, create it stubbed with only the
> repos that exist and grow it as each repo is added.

### Execution Strategy

Create `backend/db/repo/certificates/index.ts` **incrementally** — add each
re-export line as the corresponding repository file is created in T03-T09.
The barrel is the aggregation point; it's only "complete" after T09.

### Quality Loop

Run only after all T03-T09 repos are added:
```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/index.ts --lifecycle lint
```

---

## T03 — Create CertificateRepository

**Estimated time**: 4 hours
**Depends on**: T01 (i18n), Plan 1 (schema), Plan 2 (types)
**Requirements**: REQ-CERT-001 through REQ-CERT-012, AC-1 through AC-13

### Subtasks

1. **Read applicable AGENTS.md**:
   - `AGENTS.md` (root) — logging, path aliases
   - `backend/db/repo/AGENTS.md` — repo rules, namespace pattern, prepared statement rules, error handling
   - `backend/types/AGENTS.md` — type usage

2. **Read applicable instruction files**:
   - `.github/instructions/backend.instructions.md`

3. **Read reference files**:
   - `siraj_analysis/03-repository-patterns.md` §1.4 (prepared statements), §5 (pagination), §7 (FTS)
   - `backend/db/repo/students/student.repository.ts` — namespace, findById, loadByIds, fetchWithFilters patterns
   - `backend/db/repo/shared/signedUrl.repository.ts` — prepared statement + tx fallback
   - `backend/db/query.extensions.ts` — `fullTextSearch`, `queryWithPagination`
   - `docs/drizzle/prepared-statements.md` — prepared statement rules

4. **Create** `backend/db/repo/certificates/certificate.repository.ts`:
   - Module-level prepared statements: `findCertificateByIdPrepared`, `findCertificateByCodePrepared`
   - Private helpers inside namespace: `acquireCertificateLock`, `mapCertificateToDto`, `buildCertificateFilters`
   - Public methods (per design.md §3.1):
     - `findById` — prepared with tx fallback
     - `findByVerificationCode` — prepared with tx fallback
     - `findMany` — cursor pagination, FTS, window count
     - `create` — catch `23505` on verification code + idempotency key
     - `update` — reject soft-deleted
     - `updateStatus` — optimistic concurrency
     - `softDelete` — delegate to `SoftDeleteRepository.softDelete`
     - `exists` — `$count()`
     - `count` — reuse filter builder
     - `loadByIds` — `inArray`, order-preserving, `Error` for misses

5. **Update** `backend/db/repo/certificates/index.ts` barrel (add `CertificateRepository` export).

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/certificate.repository.ts --lifecycle lint
```

### Verification
- Prepared statements exist at module level with snake_case registration names
- `tx` fallback branch exists in `findById` and `findByVerificationCode`
- `loadByIds` guards `ids.length === 0` and returns `(Entity | Error)[]` in request order
- `findMany` cursor decodes base64 `{ createdAt, id }` and builds composite predicate
- `create` catches `23505` and throws `tErrors.` translated messages
- No hardcoded user-facing strings

---

## T04 — Create TemplateRepository

**Estimated time**: 3.5 hours
**Depends on**: T01, Plan 1, Plan 2
**Requirements**: REQ-TPL-001 through REQ-TPL-009

### Subtasks

1. **Read** same AGENTS.md and instruction files as T03
2. **Read reference**:
   - `backend/db/repo/billing/billing.repository.ts` — `acquireInvoiceLock` + advisory lock pattern
   - `backend/db/repo/shared/soft-delete.repository.ts` — `SoftDeleteRepository.softDelete` delegation
   - `backend/db/repo/audit/audit.repository.ts` — `AuditRepository.createAuditLog` call shape
3. **Create** `backend/db/repo/certificates/template.repository.ts`:
   - Module-level: `findTemplateByIdPrepared`
   - Private helpers: `acquireTemplateLock` (`'cert_template_'` prefix), `mapTemplateToDto` (resolve localized name/description)
   - Public methods (per design.md §3.2):
     - `findById` — prepared with tx fallback
     - `findMany` — cursor pagination, FTS on `name`
     - `create` — catch `23505` on `(slug, version)`
     - `update` — reject soft-deleted
     - `softDelete` — delegate to `SoftDeleteRepository.softDelete`
     - `publishVersion` — advisory lock → load draft → mutate status/version → audit log
     - `getVersionChain` — `where(eq(slug, ...))` ordered `version DESC` (NOT prepared — returns list)
     - `cloneForVersioning` — load source, insert new row with bumped version + status `draft`
4. **Update** barrel.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/template.repository.ts --lifecycle lint
```

### Verification
- `publishVersion` acquires advisory lock inside `tx` before mutation
- `publishVersion` writes audit log entry with `action: 'PUBLISH'` (or similar)
- `cloneForVersioning` does NOT cascade-copy elements/variables (service layer responsibility)
- `getVersionChain` uses dynamic query — NOT a prepared statement

---

## T05 — Create TemplateElementRepository

**Estimated time**: 1.5 hours
**Depends on**: T01, Plan 1, Plan 2
**Requirements**: REQ-ELEM-001 through REQ-ELEM-006

### Subtasks

1. **Read** same AGENTS.md and instruction files
2. **Create** `backend/db/repo/certificates/template-element.repository.ts`:
   - No prepared statements (all queries are list-by-template or list-by-type — dynamic WHERE)
   - Public methods (per design.md §3.3):
     - `findByTemplate` — ordered `zIndex ASC, createdAt ASC`
     - `create` — no unique-index catch needed
     - `update` — throw `tErrors.elementNotFound(id)` on missing
     - `delete` — hard delete, throw on missing
     - `reorder` — bulk `zIndex` update within `tx ?? db.transaction`
     - `findByType` — filter by `elementType` enum
3. **Update** barrel.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/template-element.repository.ts --lifecycle lint
```

### Verification
- No prepared statements declared
- `reorder` wraps all updates in a single transaction
- `delete` is hard delete (no `deletedAt` mutation)
- `findByTemplate` and `findByType` use dynamic `where`

---

## T06 — Create TemplateVariableRepository

**Estimated time**: 1.5 hours
**Depends on**: T01, Plan 1, Plan 2
**Requirements**: REQ-VAR-001 through REQ-VAR-005

### Subtasks

1. **Read** same AGENTS.md and instruction files
2. **Create** `backend/db/repo/certificates/template-variable.repository.ts`:
   - No prepared statements
   - Public methods (per design.md §3.4):
     - `findByTemplate`
     - `create` — catch `23505` on `(key, templateId)` → `tErrors.variableKeyConflict(key)`
     - `update` — throw `tErrors.variableNotFound(id)` on missing
     - `delete` — hard delete, throw on missing
     - `findByType` — filter by `variableType` enum
3. **Update** barrel.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/template-variable.repository.ts --lifecycle lint
```

### Verification
- `create` catches `23505` with appropriate `tErrors` key
- No prepared statements
- All "not found" cases throw translated `tErrors.variableNotFound(id)`

---

## T07 — Create RecipientGroupRepository

**Estimated time**: 4 hours
**Depends on**: T01, Plan 1, Plan 2
**Requirements**: REQ-GRP-001 through REQ-GRP-006

### Subtasks

1. **Read** same AGENTS.md and instruction files
2. **Read reference**:
   - `backend/db/repo/shared/soft-delete.repository.ts` — `SoftDeleteRepository.softDelete` delegation
   - `backend/db/repo/shared/bulk-upsert.ts` — `bulkInsertOnConflictDoNothing` if needed for bulk item additions
   - `backend/db/schema/` — relational definitions for `certificate_recipient_groups` → items → variable values
3. **Create** `backend/db/repo/certificates/recipient-group.repository.ts`:
   - No prepared statements (all methods use dynamic WHERE or relational queries)
   - Private helpers: `mapRecipientGroupToDto`, `mapRecipientGroupItemToDto` (joins `students.name`), `buildRecipientGroupFilters`
   - Public methods (per design.md §3.5):
     - Group CRUD: `create`, `findById`, `findMany` (cursor pagination, FTS on group name), `update`, `softDelete`, `findByTemplate`
     - Item operations: `findItems` (joins `students`, cursor pagination), `addItem` (catch `23505` on `(group_id, student_id)`), `removeItem` (hard delete)
     - `updateVariableValue` — `onConflictDoUpdate` on `(item_id, variable_id)` unique key
     - `findByTemplateForGeneration` — relational query builder `q.query.certificateRecipientGroups.findMany({ with: { items: { with: { variableValues: true } } } })`
4. **Update** barrel.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/recipient-group.repository.ts --lifecycle lint
```

### Verification
- `addItem` catches `23505` with `tErrors.studentAlreadyInGroup(studentId, groupId)`
- `updateVariableValue` uses `onConflictDoUpdate` (upsert semantics)
- `findByTemplateForGeneration` uses relational query with nested `with`
- `softDelete` only soft-deletes the group row; items and variable values are NOT cascade-deleted
- `findItems` joins to `students` for name resolution

---

## T08 — Create VerificationRepository

**Estimated time**: 1.5 hours
**Depends on**: T01, Plan 1, Plan 2
**Requirements**: REQ-VER-001 through REQ-VER-004

### Subtasks

1. **Read** same AGENTS.md and instruction files
2. **Create** `backend/db/repo/certificates/verification.repository.ts`:
   - Module-level prepared statement: `findVerificationByCodePrepared`
   - Public methods (per design.md §3.6):
     - `create` — append-only, no `tErrors` param (no business errors thrown)
     - `findByCertificate` — cursor pagination, ordered `createdAt DESC`
     - `findByCode` — prepared with tx fallback
     - `countVerifications` — `Number(row?.count ?? 0)`
3. **Update** barrel.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/verification.repository.ts --lifecycle lint
```

### Verification
- `findByCode` has prepared statement with tx fallback branch
- `create` has no `tErrors` parameter
- `findByCertificate` orders by `createdAt DESC`
- No `update` or `delete` method (append-only)

---

## T09 — Create CertificateCategoryRepository

**Estimated time**: 3 hours
**Depends on**: T01, Plan 1, Plan 2
**Requirements**: REQ-CAT-001 through REQ-CAT-007

### Subtasks

1. **Read** same AGENTS.md and instruction files
2. **Read reference**:
   - `docs/drizzle/prepared-statements.md` — prepared statement pattern
   - `backend/db/repo/shared/soft-delete.repository.ts` — `SoftDeleteRepository.softDelete` + pre-check pattern
   - `backend/db/repo/students/student.repository.ts` — conditional aggregation `sql<number>\`...\`` pattern
3. **Create** `backend/db/repo/certificates/category.repository.ts`:
   - Module-level prepared statement: `findCategoryByIdPrepared`
   - Private helpers: `mapCategoryToDto`, `buildCategoryTreeQuery` (recursive CTE via `sql` template)
   - Public methods (per design.md §3.7):
     - `findById` — prepared with tx fallback, filter `isNull(deletedAt)`
     - `create`
     - `update` — reject soft-deleted
     - `softDelete` — pre-check for children + templates, then delegate to `SoftDeleteRepository.softDelete`
     - `findTree` — recursive CTE via raw `sql` template (Drizzle relational API doesn't support arbitrary-depth trees)
     - `reorder` — bulk `sortOrder` updates within `tx ?? db.transaction`
     - `findWithTemplateCount` — `leftJoin(certificate_templates)` + conditional aggregation `COALESCE(COUNT(...), 0)::int`
4. **Update** barrel — now complete with all 7 repos.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/certificates/category.repository.ts --lifecycle lint
```

### Verification
- `softDelete` pre-checks for children and templates **after** acquiring advisory lock, within same `tx`
- `softDelete` throws `tErrors.categoryHasChildren(id)` and `tErrors.categoryHasTemplates(id, count)` appropriately
- `findTree` uses raw `sql` recursive CTE — not relational query builder
- `findWithTemplateCount` uses conditional aggregation via `sql<number>\`...\``
- `findById` has prepared statement with tx fallback

---

## T10 — Extend Soft Delete Registry

**Estimated time**: 30 minutes
**Depends on**: T03, T04, T09 (repos that call `SoftDeleteRepository.softDelete` must exist)
**Requirements**: REQ-SD-001, REQ-SD-002, AC-16, AC-17

### Subtasks

1. **Read** `backend/db/repo/shared/soft-delete.repository.ts` — the `SOFT_DELETE_TABLES` map
2. **Read** `backend/db/repo/AGENTS.md` — soft delete rules
3. **Modify** `backend/db/repo/shared/soft-delete.repository.ts`:
   - Add `certificates` → `{ table: certificates, entityType: 'CERTIFICATE' }`
   - Add `certificate_templates` → `{ table: certificateTemplates, entityType: 'TEMPLATE' }`
   - Add `certificate_categories` → `{ table: certificateCategories, entityType: 'CATEGORY' }`
4. Import the table instances from `@/backend/db/schema` (following the existing import convention in the file).

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/shared/soft-delete.repository.ts --lifecycle lint
```

### Verification
- All three new entries present in `SOFT_DELETE_TABLES`
- `CertificateRepository.softDelete`, `TemplateRepository.softDelete`,
  `CertificateCategoryRepository.softDelete` all call `SoftDeleteRepository.softDelete` with
  matching table names
- Each soft delete writes audit log with correct `entityType`

---

## T11 — Extend Top-Level Repo Barrel

**Estimated time**: 30 minutes
**Depends on**: T02 (sub-barrel complete), T09 (all repos)
**Requirements**: AC-23

### Subtasks

1. **Read** `backend/db/repo/index.ts` — existing top-level barrel
2. **Modify** `backend/db/repo/index.ts`:
   - Add `export * from "@/backend/db/repo/certificates"` line in the appropriate alphabetical/domain-grouped position
3. **Verify** that `import { CertificateRepository, TemplateRepository } from "@/backend/db/repo"` works.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts backend/db/repo/index.ts --lifecycle lint
```

### Verification
- All 7 cert repositories are importable from `@/backend/db/repo`
- `bun tsgo` passes — no circular imports

---

## T12 — Full Repo Integration Verification

**Estimated time**: 1 hour
**Depends on**: T03-T11 all complete
**Requirements**: All acceptance criteria

### Subtasks

1. **Run full type check**:
   ```bash
   bun tsgo
   ```

2. **Run biome across all cert repo files**:
   ```bash
   bun biome:check -- backend/db/repo/certificates/
   ```

3. **Run lint via queue client on all cert repo files**:
   ```bash
   # Ensure lint queue server is running
   ~/.bun/bin/bun run scripts/lint-queue-server.ts &

   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"t12","files":["backend/db/repo/certificates/certificate.repository.ts","backend/db/repo/certificates/template.repository.ts","backend/db/repo/certificates/template-element.repository.ts","backend/db/repo/certificates/template-variable.repository.ts","backend/db/repo/certificates/recipient-group.repository.ts","backend/db/repo/certificates/verification.repository.ts","backend/db/repo/certificates/category.repository.ts","backend/db/repo/certificates/index.ts","backend/db/repo/shared/soft-delete.repository.ts","backend/db/repo/index.ts","shared/locale/types/errors/index.ts","shared/locale/en/errors/index.ts","shared/locale/ar/errors/index.ts"]}'
   ```

4. **Review acceptance criteria** — manually verify each AC from `requirements.md` §4:
   - AC-1: Each file exports one namespace — grep `export namespace` per file
   - AC-5: Prepared statement names match design.md §4.1
   - AC-6: Each prepared method branches on `tx`
   - AC-7: No `inArray` method uses prepared statement
   - AC-11: `loadByIds` guards empty + preserves order + `Error` for misses
   - AC-12: Cursor decode/encode in every `findMany`
   - AC-21: No hardcoded strings — `grep` for `throw new Error("` in cert repos (should only find `Error(tErrors.`)

### Quality Loop

No per-file loop — this is integration verification. Run tsgo + biome + lint on
all files together.

### Verification
- All AC items pass
- `bun tsgo` clean
- `bun biome:check` clean on all cert files
- Lint queue returns exitCode 0

---

## T13 — Knowledge Propagation

**Estimated time**: 1 hour
**Depends on**: T12 complete
**Requirements**: REQ-KNOW-001, REQ-KNOW-002

### Subtasks

1. **Document deviations**: If any pattern deviation from
   `siraj_analysis/03-repository-patterns.md` was necessary (e.g., recursive CTE
   for category tree, `findByTemplateForGeneration` relational query), add a
   comment in the relevant file and note it for Plan 21 to incorporate into
   `docs/certificates/repository-patterns.md`.

2. **Update session todos**: Ensure every task in this plan is marked `done`
   in the session SQLite `todos` table. Any blocked tasks should have a
   description of the blocker.

3. **Prepare handoff notes for Plan 4 (Services)**:
   - List all repository public methods with their signatures (already in `design.md`)
   - Note which methods require `tErrors` and the translation namespace
   - Note which methods use `db.transaction(runner)` composite patterns
   - List the prepared statement registration names (for the `prepared-statements.md`
     inventory)
   - List the `SOFT_DELETE_TABLES` entries added

4. **Verify barrel re-exports**: Confirm `backend/db/repo/index.ts` and
   `backend/db/repo/certificates/index.ts` are consistent — every namespace
   exported by the sub-barrel is re-exported by the top-level barrel.

5. **Do NOT create summary markdown files** — per `AGENTS.md` "AI Agent
   Communication Rules". Knowledge transfer happens through inline comments,
   the session todos table, and the design.md/tasks.md files already created.

### Verification
- All session todos for Plan 03 are `done`
- No `.md` summary files created in the repo
- `design.md` interface contracts match the implemented method signatures
- Plan 4 has sufficient information to consume the repositories without re-reading
  the implementation files

---

## Instruction File & AGENTS.md Discovery Summary

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| T01 | `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts` | `shared/AGENTS.md`, `AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T02 | `backend/db/repo/certificates/index.ts` | `backend/db/repo/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T03 | `backend/db/repo/certificates/certificate.repository.ts` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T04 | `backend/db/repo/certificates/template.repository.ts` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T05 | `backend/db/repo/certificates/template-element.repository.ts` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T06 | `backend/db/repo/certificates/template-variable.repository.ts` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T07 | `backend/db/repo/certificates/recipient-group.repository.ts` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T08 | `backend/db/repo/certificates/verification.repository.ts` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T09 | `backend/db/repo/certificates/category.repository.ts` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/types/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T10 | `backend/db/repo/shared/soft-delete.repository.ts` (modify) | `backend/db/repo/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T11 | `backend/db/repo/index.ts` (modify) | `backend/db/repo/AGENTS.md` | `.github/instructions/backend.instructions.md` |
| T12 | (verification only — no file changes) | — | — |
| T13 | (knowledge propagation — no file changes except inline comments) | `AGENTS.md` | — |

---

## Execution Order

```
Phase A (sequential):  T01
Phase B (sequential):  T02 (stub barrel)
Phase C (parallel):    T03, T04, T05, T06, T07, T08, T09
Phase D (sequential):  T02 completion (finalize barrel), T10, T11
Phase E (sequential):  T12 (integration verification)
Phase F (sequential):  T13 (knowledge propagation)
```

**Total estimated time**: 23 hours (parallelizable to ~8 wall-clock hours with 4-way parallelism in Phase C)

---

## Quality Gate Reference

Per-file verification loop for every file created/modified:

```bash
# Progressive: tsgo → biome → lint (short-circuits at first failure)
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
```

Full plan verification (after T12):

```bash
bun tsgo                          # Type check (safe to run concurrently)
bun biome:check                   # Biome (safe to run concurrently)
bun run lint                      # Full-repo lint via queue client (serialized behind queue server)
```

> The lint queue server must be running before any lint call. Start it with:
> `~/.bun/bin/bun run scripts/lint-queue-server.ts` (background process).
> See `AGENTS.md` §"Lint Queue Server" for details.

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Corrections applied to tasks.md
1. **T01 steps 3-5 (i18n file creation)** — original "Create type schema `shared/locale/certificates.errors.repo.ts`", "Create English implementation `shared/locale/en/certificates.errors.repo.ts`", "Create Arabic implementation `shared/locale/ar/certificates.errors.repo.ts`" were changed to "Modify the existing `ErrorsLabels` aggregate at `shared/locale/types/errors/index.ts`", "Modify English impl at `shared/locale/en/errors/index.ts`", "Modify Arabic impl at `shared/locale/ar/errors/index.ts`" — verified single aggregate backend errors layer. New certificate error keys are APPENDED to existing files, NOT placed in new flat per-domain files.
2. **All `softDelete.generic` references** → `SoftDeleteRepository.softDelete` (verified `backend/db/repo/shared/soft-delete.repository.ts:69: export const softDelete = async <T>(input, tx?, locale?) => {...}`).
3. **Quality-loop file lists and T12 lint-queue `curl -d '...'` file arrays** — verified the file paths reference real files: `backend/db/repo/certificates/*.repository.ts`, `backend/db/repo/shared/soft-delete.repository.ts`, `backend/db/repo/index.ts`, `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`.

### Verified wiring
- Sub-directory barrel `backend/db/repo/certificates/index.ts` re-exports all 7 cert repo namespaces (verified pattern against `backend/db/repo/students/index.ts`).
- Top-level barrel addition `export * from "@/backend/db/repo/certificates"` to `backend/db/repo/index.ts` (verified existing per-domain exports in that file).
- T09 `SoftDeletableTableName` union extension step — verified `Types.SoftDeletableTableName` is the gate for `SoftDeleteRepository.softDelete`'s generic constraint (`soft-delete.repository.ts:57,69`); the union lives in `backend/types` (Plan 02).

### Concurrent-dependency caveat
- `backend/types/SoftDeletableTableName` union extension should be landed in Plan 02 (alongside the `Types.SoftDeleteInput` shape extension) BEFORE T09's `SOFT_DELETE_TABLES` registration compiles cleanly. The plan already lists T09 as depending on T03/T04; just ensure that dependency layer is honored.

# Plan 03 — Repository Layer: Implementation Tasks

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 03 — Repository (Data Access) Layer
> **Depends on**: Plan 01 (DB Schema — certificate tables in `backend/db/schema/`), Plan 02 (Types & Permissions — `backend/types/certificates/`)
> **Reference specs**: `requirements.md`, `design.md` (same directory)
> **Estimated total effort**: ~25–30 hours (10 tasks × 2–4 hours each)

---

## Pre-Task Instructions (Read Before Starting Any Task)

Before writing repository code, every task MUST:

1. **Read these instruction files:**
   - `backend/db/repo/AGENTS.md` — Canonical repository layer rules (Neon HTTP, prepared statements, inArray prohibition, batch loaders, type definitions, error strings)
   - `backend/AGENTS.md` — Backend-wide rules (logging, imports, type patterns)
   - Root `AGENTS.md` — Project-wide rules (path aliases, lint queue, quality gate)

2. **Read these reference implementations:**
   - `backend/db/repo/billing/billing.repository.ts` — `runInTransaction`, `acquireInvoiceLock`, idempotency handling
   - `backend/db/repo/students/student.repository.ts` — `findById` with `queryDb()`, `loadByIds` DataLoader, `fetchWithFilters` cursor pagination, `mapEntityToDto`
   - `backend/db/repo/shared/soft-delete.repository.ts` — `SOFT_DELETE_TABLES` registry, `acquireSoftDeleteLock`, `softDelete<T>` generic
   - `backend/db/query.extensions.ts` — `queryWithPagination`, `fullTextSearch`

3. **Confirm dependencies exist:**
   - Plan 01 schema files in `backend/db/schema/` (certificate tables)
   - Plan 02 type files in `backend/types/certificates/` (`CertificateSelectType`, `CertificateInsertType`, `CertificateReturnType`, `CertificateSubmitInput`, etc.)

4. **Per-file quality loop (after implementation, before marking task done):**
   ```bash
   # tsgo — type check (safe to run concurrently)
   ~/.bun/bin/bun run tsgo

   # biome — format + lint fix
   ~/.bun/bin/bun biome:check --write

   # lint via queue client (file-scoped, not full repo)
   export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"verify-task-<TASK_ID>","files":["backend/db/repo/certificates/<file>.ts"]}'
   ```

5. **Instruction verification checklist (per file):**
   - [ ] Uses `export namespace {Entity}Repository { ... }` with arrow functions (NOT classes)
   - [ ] Reads use `queryDb(tx)` resolver from `@/backend/db`
   - [ ] Writes use `const executor = tx ?? db`
   - [ ] Prepared statements only for simple `findById` with `sql.placeholder("id")`; branches tx vs no-tx
   - [ ] NO `inArray` + prepared statements (prohibited — causes protocol desync)
   - [ ] Soft delete uses `isNull(deletedAt)` filter and `SOFT_DELETE_TABLES` registry
   - [ ] Error handling uses `tErrors: ErrorsLabels` parameter — NO hardcoded error strings
   - [ ] Types imported from `@/backend/types/certificates/` — NO local type definitions
   - [ ] Uses `logger` from `@/backend/lib/logger` — NO `console.*`
   - [ ] `NotFoundError` from `@/backend/lib` for not-found cases
   - [ ] Entity mapping via `mapEntityToDto` omitting forbidden fields

---

## Task 1: Create `certificate.repository.ts`

> **Estimated effort**: 3–4 hours
> **Repository namespace**: `CertificateRepository`
> **Schema table**: `certificates`
> **Requirements**: REQ-CERT-001 through REQ-CERT-013, REQ-F6-001 through REQ-F6-003
> **Cross-cutting**: REQ-X-001 (tx), REQ-X-002 (prepared), REQ-X-003 (soft delete), REQ-X-004 (mapping), REQ-X-005 (idempotency), REQ-X-006 (pagination), REQ-X-007 (FTS), REQ-X-008 (errors), REQ-X-009 (no business logic)

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Create** `backend/db/repo/certificates/certificate.repository.ts`.

3. **Implement module-level prepared statement** for `findById`:
   ```typescript
   const findByIdPreparedStatement = db
     .select()
     .from(certificates)
     .where(and(eq(certificates.id, sql.placeholder("id")), isNull(certificates.deletedAt)))
     .prepare("certificate_findById");
   ```
   Branch: prepared for no-tx path, `tx.select()` fallback when tx is provided.

4. **Implement** these namespace methods:
   - `findById(id, tx?)` → `queryDb(tx)` → prepared fallback → `mapCertificateToDto` → return `CertificateReturnType | null`
   - `findByIdNoTx(id)` — direct prepared statement (no tx)
   - `findMany(filters?, paginationArgs?, orderBy?, tx?)` — cursor pagination on `(createdAt, id)`, filters: `status`, `templateId`, `studentId`, `dateRange`, total via `cast(count(*) over() as int)`
   - `findCertificatesByStudent(studentId, tx?)` — `eq(certificates.studentId, studentId)` + `isNull(deletedAt)`
   - `findCertificatesByTemplate(templateId, tx?)` — `eq(certificates.templateId, templateId)` + `isNull(deletedAt)`
   - `findCertificatesByStatus(status, tx?)` — `eq(certificates.status, status)` + `isNull(deletedAt)`
   - `create(input, tErrors, tx?)` — `const executor = tx ?? db`, `.returning()`, catch unique constraint (23505) on `idempotencyKey` → return existing
   - `update(id, input, tErrors, tx?)` — `const executor = tx ?? db`, `.returning()`, throw `NotFoundError` if not found
   - `softDelete(id, tErrors, tx?)` — `acquireSoftDeleteLock`, `enableSoftDeleteSession`, set `deletedAt = now()`, write audit log
   - `searchCertificates(query, paginationArgs?, tx?)` — `fullTextSearch` on recipient name, cursor pagination

5. **Implement Feature 6 methods:**
   - `findOutcomesByCertificateId(certificateId, tx?)` — join `certificate_outcomes` + `certificates`
   - `findProgressByStudentId(studentId, tx?)` — join `student_progress` + `certificates`
   - `updateProgress(studentId, certificateId, progressData, tErrors, tx?)` — upsert into `student_progress`

6. **Implement** `mapCertificateToDto(row)` — omit `idempotencyKey`, `internalVersion`; re-apply TS enum types for `status`.

7. **Export** the `CertificateRepository` namespace.

### Quality Loop

```bash
# Ensure lint queue server is running
~/.bun/bin/bun run scripts/lint-queue-server.ts &

# Type check
~/.bun/bin/bun run tsgo

# Biome
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/certificate.repository.ts

# Lint (file-scoped)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-1","files":["backend/db/repo/certificates/certificate.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed (Neon HTTP reads, `queryDb(tx)`, `tx ?? db` writes)
- [ ] Prepared statements: only `findById`, branches tx vs no-tx, NO `inArray` + prepared
- [ ] Soft delete: `isNull(deletedAt)` filter, `SOFT_DELETE_TABLES` registry updated (Task 8)
- [ ] Idempotency: catches PG error 23505 on `idempotencyKey`, returns existing
- [ ] Error handling: `tErrors` parameter used, `NotFoundError` for not-found, no `console.*`
- [ ] Types from `@/backend/types/certificates/`, no local type definitions
- [ ] `mapCertificateToDto` omits `idempotencyKey`, `internalVersion`

### _Requirements_

- REQ-CERT-001 through REQ-CERT-013
- REQ-F6-001, REQ-F6-002, REQ-F6-003
- REQ-X-001, REQ-X-002, REQ-X-003, REQ-X-004, REQ-X-005, REQ-X-006, REQ-X-007, REQ-X-008, REQ-X-009

---

## Task 2: Create `certificate-template.repository.ts` (with Version Management)

> **Estimated effort**: 3–4 hours
> **Repository namespace**: `TemplateRepository`
> **Schema table**: `certificate_templates`
> **Requirements**: REQ-TPL-001 through REQ-TPL-012, REQ-F6-004 through REQ-F6-006
> **Cross-cutting**: REQ-X-001, REQ-X-002, REQ-X-003, REQ-X-004, REQ-X-006, REQ-X-007, REQ-X-008, REQ-X-009

### Steps

1. **Read instruction files** (see Pre-Task Instructions).

2. **Create** `backend/db/repo/certificates/certificate-template.repository.ts`.

3. **Implement module-level prepared statement** for `findById`.

4. **Implement these namespace methods:**
   - `findById(id, tx?)` — prepared + `queryDb(tx)` fallback, `isNull(deletedAt)`
   - `findMany(filters?, paginationArgs?, orderBy?, tx?)` — cursor pagination, filters: `categoryId`, `status`, `dateRange`
   - `findTemplatesByCategory(categoryId, tx?)` — `eq(categoryId, categoryId)` + `isNull(deletedAt)`
   - `findActiveTemplates(tx?)` — `eq(status, "ACTIVE")` + `isNull(deletedAt)`
   - `create(input, tErrors, tx?)` — `tx ?? db`, `.returning()`
   - `update(id, input, tErrors, tx?)` — `tx ?? db`, `.returning()`, throw `NotFoundError`
   - `softDelete(id, tErrors, tx?)` — soft delete via `deletedAt`
   - `searchTemplates(query, paginationArgs?, tx?)` — `fullTextSearch` on `name`

5. **Implement template version management methods:**
   - `createVersion(templateId, input, tErrors, tx?)` — copy template row, set `parentTemplateId = templateId`, increment `version`, insert new row with `.returning()`
   - `findLatestVersion(templateId, tx?)` — query by `or(eq(id, templateId), eq(parentTemplateId, templateId))`, order by `version DESC`, limit 1
   - `findVersionHistory(templateId, tx?)` — query all versions by `or(eq(id, templateId), eq(parentTemplateId, templateId))`, order by `version DESC`
   - `findLatestVersionPrepared` — prepared statement variant for no-tx path (simple by `id`)

6. **Implement Feature 6 methods (Outcome Knowledge Base):**
   - `findOutcomesByTemplateId(templateId, tx?)` — query `template_outcomes` by `templateId`
   - `createOutcome(input, tErrors, tx?)` — insert into `template_outcomes`, `tx ?? db`, `.returning()`
   - `updateOutcome(id, input, tErrors, tx?)` — update `template_outcomes`, throw `NotFoundError`
   - `deleteOutcome(id, tErrors, tx?)` — hard delete from `template_outcomes` (no soft delete for outcomes)

7. **Implement** `mapTemplateToDto(row)` — omit `internalVersion`, re-apply TS enum for `status`.

8. **Export** the `TemplateRepository` namespace.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/certificate-template.repository.ts
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-2","files":["backend/db/repo/certificates/certificate-template.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed
- [ ] Prepared statements: only `findById`, branches tx vs no-tx
- [ ] Version management: `parentTemplateId` chain, `version` increment, `findLatestVersion` query
- [ ] Soft delete: `isNull(deletedAt)` filter
- [ ] Error handling: `tErrors` parameter, `NotFoundError`, no `console.*`
- [ ] Types from `@/backend/types/certificates/`
- [ ] `mapTemplateToDto` omits `internalVersion`

### _Requirements_

- REQ-TPL-001 through REQ-TPL-012
- REQ-F6-004, REQ-F6-005, REQ-F6-006
- REQ-X-001, REQ-X-002, REQ-X-003, REQ-X-004, REQ-X-006, REQ-X-007, REQ-X-008, REQ-X-009

---

## Task 3: Create `template-element.repository.ts`

> **Estimated effort**: 2–3 hours
> **Repository namespace**: `TemplateElementRepository`
> **Schema tables**: `template_elements` + polymorphic sub-tables (`template_text_elements`, `template_image_elements`, `template_qr_elements`, `template_barcode_elements`)
> **Requirements**: REQ-ELT-001 through REQ-ELT-009
> **Cross-cutting**: REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-008, REQ-X-009

### Steps

1. **Read instruction files** (see Pre-Task Instructions).

2. **Create** `backend/db/repo/certificates/template-element.repository.ts`.

3. **Implement module-level prepared statement** for `findById`.

4. **Implement these namespace methods:**
   - `findById(id, tx?)` — prepared + `queryDb(tx)` fallback. No soft delete filter (elements are not soft-deletable).
   - `findByTemplateId(templateId, tx?)` — `eq(templateId, templateId)`, order by `orderIndex ASC`
   - `findByTemplateIdAndType(templateId, elementType, tx?)` — filter by `type` column + `templateId`
   - `create(input, tErrors, tx?)` — `tx ?? db`, `.returning()`. Insert into base `template_elements` table. Polymorphic sub-table insert is handled by the service layer or via a transaction callback.
   - `update(id, input, tErrors, tx?)` — `tx ?? db`, `.returning()`, throw `NotFoundError`
   - `delete(id, tErrors, tx?)` — hard delete (no soft delete for elements)
   - `reorder(templateId, elementIds, tErrors, tx?)` — batch update `orderIndex` for multiple elements within a transaction
   - `deleteByTemplateId(templateId, tx?)` — cascade hard delete all elements for a template

5. **Implement** `mapTemplateElementToDto(row)` — re-apply TS enum for `elementType`.

6. **Export** the `TemplateElementRepository` namespace.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/template-element.repository.ts
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-3","files":["backend/db/repo/certificates/template-element.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed
- [ ] Prepared statements: only `findById`, branches tx vs no-tx
- [ ] NO soft delete (elements are not in `SOFT_DELETE_TABLES`)
- [ ] NO `inArray` + prepared statements (reorder uses explicit tx)
- [ ] Error handling: `tErrors` parameter, `NotFoundError`, no `console.*`
- [ ] Types from `@/backend/types/certificates/`
- [ ] Polymorphic sub-tables: repo only manages base table; sub-table inserts are transactional

### _Requirements_

- REQ-ELT-001 through REQ-ELT-009
- REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-008, REQ-X-009

---

## Task 4: Create `template-variable.repository.ts`

> **Estimated effort**: 2–3 hours
> **Repository namespace**: `TemplateVariableRepository`
> **Schema tables**: `template_variables` + polymorphic sub-tables (`template_text_variables`, `template_date_variables`, `template_image_variables`)
> **Requirements**: REQ-VAR-001 through REQ-VAR-009
> **Cross-cutting**: REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-008, REQ-X-009

### Steps

1. **Read instruction files** (see Pre-Task Instructions).

2. **Create** `backend/db/repo/certificates/template-variable.repository.ts`.

3. **Implement module-level prepared statement** for `findById`.

4. **Implement these namespace methods:**
   - `findById(id, tx?)` — prepared + `queryDb(tx)` fallback
   - `findByTemplateId(templateId, tx?)` — `eq(templateId, templateId)`, order by `name ASC`
   - `findByTemplateIdAndType(templateId, variableType, tx?)` — filter by `type` + `templateId`
   - `create(input, tErrors, tx?)` — `tx ?? db`, `.returning()`
   - `update(id, input, tErrors, tx?)` — `tx ?? db`, `.returning()`, throw `NotFoundError`
   - `delete(id, tErrors, tx?)` — hard delete
   - `deleteByTemplateId(templateId, tx?)` — cascade hard delete all variables for a template

5. **Implement** `mapTemplateVariableToDto(row)` — re-apply TS enum for `variableType`.

6. **Export** the `TemplateVariableRepository` namespace.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/template-variable.repository.ts
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-4","files":["backend/db/repo/certificates/template-variable.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed
- [ ] Prepared statements: only `findById`, branches tx vs no-tx
- [ ] NO soft delete (variables are not in `SOFT_DELETE_TABLES`)
- [ ] Error handling: `tErrors` parameter, `NotFoundError`, no `console.*`
- [ ] Types from `@/backend/types/certificates/`
- [ ] `mapTemplateVariableToDto` re-applies TS enum

### _Requirements_

- REQ-VAR-001 through REQ-VAR-009
- REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-008, REQ-X-009

---

## Task 5: Create `certificate-recipient-group.repository.ts`

> **Estimated effort**: 3 hours
> **Repository namespace**: `RecipientGroupRepository`
> **Schema tables**: `certificate_recipient_groups` + `recipient_group_items` + `recipient_group_item_variable_values`
> **Requirements**: REQ-RG-001 through REQ-RG-012
> **Cross-cutting**: REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-006, REQ-X-007, REQ-X-008, REQ-X-009

### Steps

1. **Read instruction files** (see Pre-Task Instructions).

2. **Create** `backend/db/repo/certificates/certificate-recipient-group.repository.ts`.

3. **Implement module-level prepared statement** for `findById`.

4. **Implement these namespace methods:**
   - `findById(id, tx?)` — prepared + `queryDb(tx)` fallback
   - `findMany(filters?, paginationArgs?, orderBy?, tx?)` — cursor pagination on `(createdAt, id)`, FTS on `name`
   - `findByCertificateId(certificateId, tx?)` — `eq(certificateId, certificateId)`
   - `create(input, tErrors, tx?)` — `tx ?? db`, `.returning()`. Inserts into `certificate_recipient_groups`.
   - `update(id, input, tErrors, tx?)` — `tx ?? db`, `.returning()`, throw `NotFoundError`
   - `delete(id, tErrors, tx?)` — hard delete
   - `searchRecipientGroups(query, paginationArgs?, tx?)` — `fullTextSearch` on `name`

5. **Implement recipient group item methods:**
   - `findItemsByGroupId(groupId, tx?)` — query `recipient_group_items` by `groupId`
   - `addItem(groupId, input, tErrors, tx?)` — insert into `recipient_group_items`, `tx ?? db`, `.returning()`
   - `updateItem(itemId, input, tErrors, tx?)` — update `recipient_group_items`, `.returning()`, throw `NotFoundError`
   - `removeItem(itemId, tx?)` — hard delete from `recipient_group_items`
   - `findItemVariableValues(itemId, tx?)` — query `recipient_group_item_variable_values` by `itemId`

6. **Implement** `mapRecipientGroupToDto(row)` and `mapRecipientGroupItemToDto(row)`.

7. **Export** the `RecipientGroupRepository` namespace.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/certificate-recipient-group.repository.ts
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-5","files":["backend/db/repo/certificates/certificate-recipient-group.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed
- [ ] Prepared statements: only `findById`, branches tx vs no-tx
- [ ] NO soft delete for recipient groups
- [ ] Cursor pagination on `certificate_recipient_groups`
- [ ] FTS on `name` column using `fullTextSearch` helper
- [ ] Error handling: `tErrors` parameter, `NotFoundError`, no `console.*`
- [ ] Types from `@/backend/types/certificates/`
- [ ] Multi-table operations: items and variable values use `tx ?? db`

### _Requirements_

- REQ-RG-001 through REQ-RG-012
- REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-006, REQ-X-007, REQ-X-008, REQ-X-009

---

## Task 6: Create `certificate-verification.repository.ts`

> **Estimated effort**: 2–3 hours
> **Repository namespace**: `VerificationRepository`
> **Schema table**: `certificate_verifications`
> **Requirements**: REQ-VER-001 through REQ-VER-012
> **Cross-cutting**: REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-008, REQ-X-009

### Steps

1. **Read instruction files** (see Pre-Task Instructions).

2. **Create** `backend/db/repo/certificates/certificate-verification.repository.ts`.

3. **Implement module-level prepared statements:**
   - `findByIdPrepared` — by `id` with `sql.placeholder("id")`
   - `findByVerificationCodePrepared` — by `verificationCode` with `sql.placeholder("code")` (simple indexed lookup)

4. **Implement these namespace methods:**
   - `findById(id, tx?)` — prepared + `queryDb(tx)` fallback
   - `findVerificationByCode(verificationCode, tx?)` — prepared (simple indexed lookup on `verificationCode`), `queryDb(tx)` fallback
   - `findByCertificateId(certificateId, tx?)` — `eq(certificateId, certificateId)`
   - `findMany(filters?, paginationArgs?, orderBy?, tx?)` — cursor pagination, filters: `verificationStatus`, `certificateId`, `dateRange`
   - `create(input, tErrors, tx?)` — `tx ?? db`, `.returning()`
   - `update(id, input, tErrors, tx?)` — `tx ?? db`, `.returning()`, throw `NotFoundError`
   - `updateVerificationStatus(id, status, tErrors, tx?)` — targeted update of `verificationStatus` + `verifiedAt`
   - `updateVerificationCount(id, tx?)` — atomic increment of `verificationCount` using `sql<number>\`verification_count + 1\``
   - `delete(id, tErrors, tx?)` — hard delete

5. **Implement** `mapVerificationToDto(row)` — re-apply TS enum for `verificationStatus`.

6. **Export** the `VerificationRepository` namespace.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/certificate-verification.repository.ts
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-6","files":["backend/db/repo/certificates/certificate-verification.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed
- [ ] Two prepared statements: `findById` + `findByVerificationCode` (both simple indexed lookups)
- [ ] Prepared statements branch tx vs no-tx
- [ ] NO soft delete for verifications
- [ ] Atomic increment: `sql<number>\`verification_count + 1\`` for `updateVerificationCount`
- [ ] Error handling: `tErrors` parameter, `NotFoundError`, no `console.*`
- [ ] Types from `@/backend/types/certificates/`
- [ ] `mapVerificationToDto` re-applies TS enum

### _Requirements_

- REQ-VER-001 through REQ-VER-012
- REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-008, REQ-X-009

---

## Task 7: Create `certificate-category.repository.ts`

> **Estimated effort**: 2–3 hours
> **Repository namespace**: `CertificateCategoryRepository`
> **Schema table**: `certificate_categories`
> **Requirements**: REQ-CAT-001 through REQ-CAT-010
> **Cross-cutting**: REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-007, REQ-X-008, REQ-X-009

### Steps

1. **Read instruction files** (see Pre-Task Instructions).

2. **Create** `backend/db/repo/certificates/certificate-category.repository.ts`.

3. **Implement module-level prepared statement** for `findById`.

4. **Implement these namespace methods:**
   - `findById(id, tx?)` — prepared + `queryDb(tx)` fallback
   - `findMany(filters?, paginationArgs?, orderBy?, tx?)` — cursor pagination, FTS on `name`
   - `findByParentId(parentId, tx?)` — `eq(parentId, parentId)` for tree traversal
   - `findRootCategories(tx?)` — `isNull(parentId)` for top-level categories
   - `findCategoryTree(parentId?, tx?)` — recursive CTE or iterative fetch for category tree (depth-limited)
   - `create(input, tErrors, tx?)` — `tx ?? db`, `.returning()`
   - `update(id, input, tErrors, tx?)` — `tx ?? db`, `.returning()`, throw `NotFoundError`
   - `delete(id, tErrors, tx?)` — hard delete. Should validate no child categories exist first (via `findByParentId` check, but validation logic is in service layer — repo just throws if FK constraint fails).
   - `searchCategories(query, paginationArgs?, tx?)` — `fullTextSearch` on `name`

5. **Implement** `mapCategoryToDto(row)`.

6. **Export** the `CertificateCategoryRepository` namespace.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/certificate-category.repository.ts
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-7","files":["backend/db/repo/certificates/certificate-category.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed
- [ ] Prepared statements: only `findById`, branches tx vs no-tx
- [ ] NO soft delete for categories
- [ ] Tree traversal: `findByParentId` for children, `findRootCategories` for roots
- [ ] FTS on `name` column using `fullTextSearch` helper
- [ ] Error handling: `tErrors` parameter, `NotFoundError`, no `console.*`
- [ ] Types from `@/backend/types/certificates/`
- [ ] No business logic — category tree assembly is service-layer concern; repo provides primitives

### _Requirements_

- REQ-CAT-001 through REQ-CAT-010
- REQ-X-001, REQ-X-002, REQ-X-004, REQ-X-007, REQ-X-008, REQ-X-009

---

## Task 8: Create Barrel `index.ts` + Register in `repo/index.ts` + Update `SOFT_DELETE_TABLES`

> **Estimated effort**: 2–3 hours
> **Repository namespace**: N/A (barrel export)
> **Requirements**: REQ-X-010 (barrel registration), REQ-X-003 (soft delete registry)
> **Cross-cutting**: REQ-X-001, NFR-002, NFR-003

### Steps

1. **Read** `backend/db/repo/index.ts` to understand the existing barrel pattern.

2. **Create** `backend/db/repo/certificates/index.ts`:
   ```typescript
   export * from "./certificate.repository";
   export * from "./certificate-template.repository";
   export * from "./template-element.repository";
   export * from "./template-variable.repository";
   export * from "./certificate-recipient-group.repository";
   export * from "./certificate-verification.repository";
   export * from "./certificate-category.repository";
   ```

3. **Update** `backend/db/repo/index.ts` — add certificate barrel registration:
   ```typescript
   export {
     CertificateRepository,
     TemplateRepository,
     TemplateElementRepository,
     TemplateVariableRepository,
     RecipientGroupRepository,
     VerificationRepository,
     CertificateCategoryRepository,
   } from "@/backend/db/repo/certificates";
   ```
   Place the export in alphabetical order or grouped with other domain exports, matching the existing style.

4. **Update** `backend/db/repo/shared/soft-delete.repository.ts` — add certificate tables to `SOFT_DELETE_TABLES`:
   ```typescript
   // Add to SOFT_DELETE_TABLES registry
   certificates: { table: certificates, deletedAtColumn: certificates.deletedAt },
   certificate_templates: { table: certificateTemplates, deletedAtColumn: certificateTemplates.deletedAt },
   ```
   Import the schema tables at the top of the file. This enables `acquireSoftDeleteLock` and `softDelete<T>` to work with certificate entities.

5. **Verify** that all 7 namespaces are re-exported correctly and resolvable via `@/backend/db/repo` imports.

### Quality Loop

```bash
# Run tsgo after barrel + registry changes — catches import resolution issues
~/.bun/bin/bun run tsgo

# Biome on both changed files
~/.bun/bin/bun biome:check --write backend/db/repo/certificates/index.ts backend/db/repo/index.ts backend/db/repo/shared/soft-delete.repository.ts

# Lint all three files
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-8","files":["backend/db/repo/certificates/index.ts","backend/db/repo/index.ts","backend/db/repo/shared/soft-delete.repository.ts"]}'
```

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` rules followed — barrel pattern matches existing structure
- [ ] All 7 namespaces exported from `backend/db/repo/certificates/index.ts`
- [ ] Top-level `backend/db/repo/index.ts` re-exports from `@/backend/db/repo/certificates`
- [ ] `SOFT_DELETE_TABLES` registry updated with `certificates` and `certificate_templates`
- [ ] Import paths use `@/` alias, not relative paths
- [ ] Alphabetical or grouped ordering matches existing code style
- [ ] tsgo passes — no circular imports, no unresolved types

### _Requirements_

- REQ-X-010 (barrel registration)
- REQ-X-003 (soft delete registry)
- NFR-002 (import conventions)
- NFR-003 (naming conventions)

---

## Task 9: Quality Loop Per File (tsgo + biome + lint) + Instruction Verification

> **Estimated effort**: 3–4 hours (covers all 8 files from Tasks 1–8)
> **Requirements**: All cross-cutting REQs, NFR-001 through NFR-005
> **Cross-cutting**: Every requirement in Section 4 of requirements.md

### Steps

1. **Start the lint queue server** (if not already running):
   ```bash
   ~/.bun/bin/bun run scripts/lint-queue-server.ts &
   ```

2. **Run full `tsgo`** across the entire repository to catch any cross-file type resolution issues:
   ```bash
   ~/.bun/bin/bun run tsgo
   ```
   If tsgo fails, read the error output, fix the type issues in the offending file(s), and re-run. Common issues:
   - Missing type in `backend/types/certificates/` (Plan 02 dependency not met)
   - Schema table import path incorrect
   - `queryDb` or `db` import path wrong

3. **Run `biome:check --write`** on all certificate repository files:
   ```bash
   ~/.bun/bin/bun biome:check --write \
     backend/db/repo/certificates/certificate.repository.ts \
     backend/db/repo/certificates/certificate-template.repository.ts \
     backend/db/repo/certificates/template-element.repository.ts \
     backend/db/repo/certificates/template-variable.repository.ts \
     backend/db/repo/certificates/certificate-recipient-group.repository.ts \
     backend/db/repo/certificates/certificate-verification.repository.ts \
     backend/db/repo/certificates/certificate-category.repository.ts \
     backend/db/repo/certificates/index.ts \
     backend/db/repo/index.ts \
     backend/db/repo/shared/soft-delete.repository.ts
   ```
   Fix any formatting or linting issues biome reports.

4. **Run file-scoped lint** on every certificate repository file through the lint queue:
   ```bash
   LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"verify-task-9","files":[
       "backend/db/repo/certificates/certificate.repository.ts",
       "backend/db/repo/certificates/certificate-template.repository.ts",
       "backend/db/repo/certificates/template-element.repository.ts",
       "backend/db/repo/certificates/template-variable.repository.ts",
       "backend/db/repo/certificates/certificate-recipient-group.repository.ts",
       "backend/db/repo/certificates/certificate-verification.repository.ts",
       "backend/db/repo/certificates/certificate-category.repository.ts",
       "backend/db/repo/certificates/index.ts",
       "backend/db/repo/index.ts",
       "backend/db/repo/shared/soft-delete.repository.ts"
     ]}'
   ```
   Fix any ESLint errors. Common issues:
   - `console.*` usage → replace with `logger`
   - Hardcoded error strings → use `tErrors` parameter
   - Relative imports → replace with `@/` alias
   - Missing return type annotations on arrow functions

5. **Per-file instruction verification audit** — for each of the 8 files, manually verify against the checklist:
   - All items from the Pre-Task Instructions checklist
   - No `inArray` + prepared statements anywhere
   - Every `softDelete` method uses `acquireSoftDeleteLock` + `enableSoftDeleteSession` + audit log
   - Every `create` with `idempotencyKey` catches PG error 23505
   - Every `findMany` uses `queryWithPagination` or equivalent cursor pattern from `query.extensions.ts`
   - Every FTS method uses `fullTextSearch` from `@/backend/db/query.extensions`
   - Every namespace matches `export namespace {Entity}Repository { ... }` pattern (NOT classes)
   - `mapEntityToDto` functions omit forbidden fields (idempotencyKey, internalVersion)
   - `queryDb(tx)` for reads, `tx ?? db` for writes

6. **Run full repo lint** as final check:
   ```bash
   ~/.bun/bin/bun run lint
   ```

### Instruction Verification

- [ ] `tsgo` passes with zero errors across all files
- [ ] `biome:check` passes on all 10 files (8 new + 2 modified)
- [ ] Lint queue client returns `exitCode: 0` for all files
- [ ] Full repo `bun run lint` passes
- [ ] Manual checklist audit passes for every file
- [ ] No `console.*` anywhere in certificate repository files
- [ ] No hardcoded error strings — all use `tErrors`
- [ ] No relative imports — all use `@/` alias
- [ ] No `inArray` + prepared statement combinations
- [ ] All types imported from `@/backend/types/certificates/`

### _Requirements_

- All cross-cutting: REQ-X-001 through REQ-X-010
- NFR-001 (type safety), NFR-002 (imports), NFR-003 (naming), NFR-004 (performance), NFR-005 (separation of concerns)
- REQ-CERT-* through REQ-CAT-* (all entity-specific requirements validated via type checking)
- REQ-F6-* (Feature 6 methods type-check correctly)

---

## Task 10: Knowledge Propagation (Update AGENTS.md, Docs)

> **Estimated effort**: 2–3 hours
> **Requirements**: Knowledge transfer section of design.md
> **Cross-cutting**: Long-term maintainability

### Steps

1. **Update `backend/db/repo/AGENTS.md`** — Add certificate repositories to the "Existing Repositories" table or reference list:
   ```markdown
   | `certificates/` | CertificateRepository, TemplateRepository, TemplateElementRepository, TemplateVariableRepository, RecipientGroupRepository, VerificationRepository, CertificateCategoryRepository |
   ```
   Add notes about:
   - Template version management pattern (`parentTemplateId` chain)
   - Idempotency handling for certificate generation (catch PG 23505)
   - `SOFT_DELETE_TABLES` now includes `certificates` and `certificate_templates`
   - Feature 6 (Outcome Knowledge Base) methods on `CertificateRepository` and `TemplateRepository`

2. **Create or update documentation** — Add a section to `docs/` if the certificate domain has a docs directory:
   - `docs/repositories/certificate-repositories.md` — overview of all 7 namespaces, method reference, usage examples from services
   - Document the `mapEntityToDto` pattern for certificate entities
   - Document the template version chain pattern
   - Document the idempotency catch-and-return pattern

3. **Update `backend/db/schema/AGENTS.md`** (if exists) or relevant schema documentation — note that `certificates` and `certificate_templates` are now in the soft-delete registry with audit logging.

4. **Create follow-up note for Plan 04 (Services)** — Document the repository API surface that services will consume:
   - All method signatures and their `tx?` parameters
   - The `tErrors` parameter pattern (services must pass translations)
   - The idempotency catch-and-return behavior (services should not retry on 23505)
   - The template version chain (services orchestrate `createVersion`)
   - The Feature 6 methods (services compose outcome + progress queries)

5. **Update any barrel or index documentation** — Ensure `backend/db/repo/index.ts` is referenced in any onboarding or architecture docs.

6. **Run quality gate** on any documentation files that are TypeScript/Markdown checked:
   ```bash
   # If docs have markdown linting
   ~/.bun/bin/bun biome:check --write docs/repositories/ 2>/dev/null || true
   ```
   Note: Markdown documentation files do not need tsgo/lint unless specific tests exist for them.

7. **Commit checklist** — Before committing, verify:
   - All 8 repository files + 2 modified files pass `tsgo`
   - All files pass `biome:check`
   - All files pass lint queue client
   - Documentation is accurate and cross-references correct file paths

### Instruction Verification

- [ ] `backend/db/repo/AGENTS.md` updated with certificate repositories in the registry table
- [ ] Template version chain pattern documented
- [ ] Idempotency catch-and-return pattern documented
- [ ] `SOFT_DELETE_TABLES` additions documented
- [ ] Feature 6 methods documented in repository context
- [ ] Follow-up note for Plan 04 (Services) documents repository API surface
- [ ] No markdown files created inside the repository source tree (only in `docs/`)

### _Requirements_

- Knowledge Transfer Protocol section of design.md
- Maintainability across all cross-cutting concerns
- REQ-X-010 (barrel registration documented)
- REQ-X-003 (soft delete registry additions documented)

---

## Task Dependency Graph

```
Task 1 (certificate.repository.ts) ─────────────────────────┐
Task 2 (certificate-template.repository.ts) ──────────────── ┤
Task 3 (template-element.repository.ts) ──────────────────── ┤
Task 4 (template-variable.repository.ts) ─────────────────── ┤── Task 8 (barrel + registry)
Task 5 (certificate-recipient-group.repository.ts) ──────── ┤      │
Task 6 (certificate-verification.repository.ts) ─────────── ┤      ▼
Task 7 (certificate-category.repository.ts) ──────────────── ┘  Task 9 (quality loop)
                                                                   │
                                                                   ▼
                                                             Task 10 (knowledge propagation)
```

- **Tasks 1–7** can be parallelized (independent repository files)
- **Task 8** depends on Tasks 1–7 (all files must exist before barrel + registry)
- **Task 9** depends on Task 8 (all files + barrel must be in place for full quality loop)
- **Task 10** depends on Task 9 (quality must pass before documenting the final API surface)

---

## Acceptance Criteria (Task-Level)

Each task is considered complete when:

1. ✅ All steps in the task are implemented
2. ✅ Per-file quality loop passes (tsgo + biome + lint)
3. ✅ Instruction verification checklist is fully checked
4. ✅ All referenced `_Requirements_` are satisfied by the implementation
5. ✅ No `console.*`, no hardcoded error strings, no relative imports, no local type definitions
6. ✅ `mapEntityToDto` functions omit all forbidden fields
7. ✅ Repository namespace uses arrow functions (not classes)
8. ✅ `queryDb(tx)` for reads, `tx ?? db` for writes
9. ✅ Prepared statements only for simple `findById` (and `findByVerificationCode` for Task 6)
10. ✅ No `inArray` + prepared statement combinations anywhere

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Plan 01 (schema) not complete | Block Task 1–7 until schema files exist in `backend/db/schema/` |
| Plan 02 (types) not complete | Block Task 1–7 until type files exist in `backend/types/certificates/` |
| `inArray` + prepared protocol desync | Review every file manually in Task 9; grep for `inArray` near `.prepare(` |
| Circular imports via barrel | tsgo will catch in Task 9; fix by splitting shared types into `shared/` |
| Neon HTTP prepared statement caching | Prepared statements are module-level singletons; verify no tx-bound prepared execution |
| Idempotency race condition | Use unique index + catch 23505 (not SELECT-then-INSERT); document in Task 1 |
| `SOFT_DELETE_TABLES` not updated | Task 8 explicitly adds certificate tables; verified in Task 9 |

# Plan 03 — Repository Layer: Requirements Specification

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 03 — Repository (Data Access) Layer
> **Depends on**: Plan 01 (DB Schema — certificate tables), Plan 02 (Types & Permissions — `backend/types/certificates/`)
> **Stack**: PostgreSQL + Drizzle ORM (`drizzle-orm@1.0.0-rc.4`), Neon HTTP / node-postgres pool
> **Scope**: Repository layer only — no business logic, no GraphQL, no permission checks (those live in services).
> **Source patterns**: `backend/db/repo/AGENTS.md`, `siraj_analysis/03-repository-patterns.md`

---

## 1. Overview

This specification covers the data-access repositories for the certificate feature. Seven repository namespaces provide CRUD, specialized queries, full-text search, cursor pagination, soft delete, and idempotency handling for all certificate-domain entities. All repositories follow the Siraj namespace-of-arrow-functions pattern (not classes), use `queryDb(tx)` for reads and `tx ?? db` for writes, and import types from `backend/types/certificates/`.

### Entities Covered

| Repository Namespace | Schema Table(s) | Soft-Delete | FTS | Cursor Pagination |
|---|---|---|---|---|
| `CertificateRepository` | `certificates` | ✅ `deletedAt` | ✅ recipient name | ✅ `(createdAt, id)` |
| `TemplateRepository` | `certificate_templates` | ✅ `deletedAt` | ✅ name | ✅ `(createdAt, id)` |
| `TemplateElementRepository` | `template_elements` + sub-tables | ❌ | ❌ | ❌ (by templateId) |
| `TemplateVariableRepository` | `template_variables` + sub-tables | ❌ | ❌ | ❌ (by templateId) |
| `RecipientGroupRepository` | `certificate_recipient_groups` + `recipient_group_items` + `recipient_group_item_variable_values` | ❌ | ✅ name | ✅ `(createdAt, id)` |
| `VerificationRepository` | `certificate_verifications` | ❌ | ❌ | ❌ (by verificationCode) |
| `CertificateCategoryRepository` | `certificate_categories` | ❌ | ✅ name | ❌ (tree by parentId) |

---

## 2. Functional Requirements (EARS Format)

> EARS = Easy Approach to Requirements Syntax. Keywords: **WHEN** / **WHILE** / **IF** / **WHERE** / **THE SYSTEM SHALL**.

### 2.1 CertificateRepository

#### REQ-CERT-001: findById
**WHEN** a caller invokes `CertificateRepository.findById(id, tx?)`, **THE SYSTEM SHALL** return the certificate row matching the given UUID, filtering out soft-deleted rows (`isNull(deletedAt)`), using `queryDb(tx)` for stateless reads. **IF** no row matches, **THE SYSTEM SHALL** return `null`.

#### REQ-CERT-002: findByIdPrepared
**WHEN** a caller invokes `CertificateRepository.findById` without a `tx` parameter, **THE SYSTEM SHALL** use a module-level prepared statement (`sql.placeholder("id")`) for the TCP path. **WHEN** a `tx` is provided, **THE SYSTEM SHALL** fall back to a regular `tx.select()` query. **THE SYSTEM SHALL NOT** use prepared statements with `inArray` or dynamic WHERE clauses.

#### REQ-CERT-003: findMany
**WHEN** a caller invokes `CertificateRepository.findMany(filters?, paginationArgs?, orderBy?, tx?)`, **THE SYSTEM SHALL** return a paginated list of certificates applying optional filters (`status`, `templateId`, `studentId`, `dateRange`) using cursor-based pagination on the composite `(createdAt, id)` index, including a `total` count via `sql<number>\`cast(count(*) over() as int)\`` window column.

#### REQ-CERT-004: create
**WHEN** a caller invokes `CertificateRepository.create(input, tErrors, tx?)`, **THE SYSTEM SHALL** insert a new certificate row using `const executor = tx ?? db` and `.returning()`. **IF** the `idempotencyKey` already exists (unique constraint violation), **THE SYSTEM SHALL** catch the constraint error and return the existing certificate row instead of throwing.

#### REQ-CERT-005: update
**WHEN** a caller invokes `CertificateRepository.update(id, input, tErrors, tx?)`, **THE SYSTEM SHALL** update the certificate row using `const executor = tx ?? db` and `.returning()`. **IF** the row does not exist or is soft-deleted, **THE SYSTEM SHALL** throw `new Error(tErrors.certificate.certificateNotFound(id))`.

#### REQ-CERT-006: softDelete
**WHEN** a caller invokes `CertificateRepository.softDelete(id, actorUserId, tErrors, tx?)`, **THE SYSTEM SHALL** set `deletedAt = now()` and `updatedAt = now()` on the certificate row, filtering `isNull(deletedAt)`. **THE SYSTEM SHALL** acquire an advisory lock (`pg_advisory_xact_lock(hashtext('certificate_' || id))`) before the update. **IF** the row does not exist, **THE SYSTEM SHALL** throw `NotFoundError`. **THE SYSTEM SHALL** write an audit log entry via `AuditRepository.createAuditLog`.

#### REQ-CERT-007: findCertificatesByStudent
**WHEN** a caller invokes `CertificateRepository.findCertificatesByStudent(studentId, tx?)`, **THE SYSTEM SHALL** return all non-deleted certificates for the given student, ordered by `createdAt DESC`.

#### REQ-CERT-008: findCertificatesByTemplate
**WHEN** a caller invokes `CertificateRepository.findCertificatesByTemplate(templateId, tx?)`, **THE SYSTEM SHALL** return all non-deleted certificates for the given template, ordered by `createdAt DESC`.

#### REQ-CERT-009: findCertificatesByStatus
**WHEN** a caller invokes `CertificateRepository.findCertificatesByStatus(status, tx?)`, **THE SYSTEM SHALL** return all certificates matching the given `CertificateStatus` enum value, filtering `isNull(deletedAt)`.

#### REQ-CERT-010: fullTextSearchByRecipientName
**WHEN** a caller invokes `CertificateRepository.searchByRecipientName(searchText, tx?)`, **THE SYSTEM SHALL** use `fullTextSearch(certificates.recipientName, searchText, 'simple')` from `@/backend/db/query.extensions` to build a `to_tsvector @@ to_tsquery` condition, returning matching non-deleted certificates.

#### REQ-CERT-011: loadByIds (DataLoader batch)
**WHEN** a caller invokes `CertificateRepository.loadByIds(ids[], locale?)`, **THE SYSTEM SHALL** query using `inArray(certificates.id, ids)` (dynamic, NOT prepared), pre-initialize a result array, and map missing ids to `new Error(tErrors.certificate.certificateNotFound(id))`. **IF** `ids.length === 0`, **THE SYSTEM SHALL** return `[]` immediately.

#### REQ-CERT-012: existsById
**WHEN** a caller invokes `CertificateRepository.existsById(id, tx?)`, **THE SYSTEM SHALL** return `boolean` using `q.$count(certificates, eq(certificates.id, id)) > 0`.

---

### 2.2 TemplateRepository

#### REQ-TMPL-001: findById
**WHEN** a caller invokes `TemplateRepository.findById(id, tx?)`, **THE SYSTEM SHALL** return the template row matching the given UUID, filtering `isNull(deletedAt)`, using `queryDb(tx)`. **IF** no row matches, **THE SYSTEM SHALL** return `null`.

#### REQ-TMPL-002: findMany
**WHEN** a caller invokes `TemplateRepository.findMany(filters?, paginationArgs?, orderBy?, tx?)`, **THE SYSTEM SHALL** return a paginated list of templates applying optional filters (`categoryId`, `status`, `searchText`) using cursor-based pagination on `(createdAt, id)`, with a `total` count via `count(*) over()`.

#### REQ-TMPL-003: create
**WHEN** a caller invokes `TemplateRepository.create(input, tErrors, tx?)`, **THE SYSTEM SHALL** insert a new template row using `const executor = tx ?? db` and `.returning()`. **THE SYSTEM SHALL** set `version = 1` on initial creation.

#### REQ-TMPL-004: update
**WHEN** a caller invokes `TemplateRepository.update(id, input, tErrors, tx?)`, **THE SYSTEM SHALL** update the template row and increment `version` via `sql\`${templates.version} + 1\``. **IF** the row is soft-deleted or missing, **THE SYSTEM SHALL** throw `tErrors.certificate.templateNotFound(id)`.

#### REQ-TMPL-005: softDelete
**WHEN** a caller invokes `TemplateRepository.softDelete(id, actorUserId, tErrors, tx?)`, **THE SYSTEM SHALL** set `deletedAt = now()` and `updatedAt = now()` on the template row, acquiring an advisory lock first. **THE SYSTEM SHALL** write an audit log entry.

#### REQ-TMPL-006: findTemplatesByCategory
**WHEN** a caller invokes `TemplateRepository.findTemplatesByCategory(categoryId, tx?)`, **THE SYSTEM SHALL** return all non-deleted templates for the given category, ordered by `order ASC, createdAt DESC`.

#### REQ-TMPL-007: createVersion
**WHEN** a caller invokes `TemplateRepository.createVersion(templateId, input, tErrors, tx?)`, **THE SYSTEM SHALL** create a new version of the template by copying the current template's data, incrementing `version`, and setting `parentTemplateId` to the original template's id. **THE SYSTEM SHALL** perform this within a transaction (either caller-provided `tx` or `db.transaction(runner)`).

#### REQ-TMPL-008: findLatestVersion
**WHEN** a caller invokes `TemplateRepository.findLatestVersion(templateId, tx?)`, **THE SYSTEM SHALL** return the template row with the highest `version` for the given `parentTemplateId` or `id`, ordered by `version DESC`, limiting to 1.

---

### 2.3 TemplateElementRepository

#### REQ-ELEM-001: findById
**WHEN** a caller invokes `TemplateElementRepository.findById(id, tx?)`, **THE SYSTEM SHALL** return the template element row (including its sub-table join) matching the given UUID, using `queryDb(tx)`.

#### REQ-ELEM-002: findByTemplateId
**WHEN** a caller invokes `TemplateElementRepository.findByTemplateId(templateId, tx?)`, **THE SYSTEM SHALL** return all template elements for the given template, ordered by `createdAt ASC`.

#### REQ-ELEM-003: create
**WHEN** a caller invokes `TemplateElementRepository.create(input, tx?)`, **THE SYSTEM SHALL** insert a new template element row into `template_elements` and the type-specific sub-table (static_text, data_text, data_date, image, qr_code) within a single transaction.

#### REQ-ELEM-004: update
**WHEN** a caller invokes `TemplateElementRepository.update(id, input, tx?)`, **THE SYSTEM SHALL** update both the base `template_elements` row and the type-specific sub-table row.

#### REQ-ELEM-005: delete
**WHEN** a caller invokes `TemplateElementRepository.delete(id, tx?)`, **THE SYSTEM SHALL** hard-delete the element from both the sub-table and `template_elements`.

#### REQ-ELEM-006: findByTemplateIdWithSubElements
**WHEN** a caller invokes `TemplateElementRepository.findByTemplateIdWithSubElements(templateId, tx?)`, **THE SYSTEM SHALL** return all elements for the template joined with their respective sub-tables, mapping the polymorphic result into a unified `TemplateElementReturnType[]`.

---

### 2.4 TemplateVariableRepository

#### REQ-VAR-001: findById
**WHEN** a caller invokes `TemplateVariableRepository.findById(id, tx?)`, **THE SYSTEM SHALL** return the template variable row (including its sub-table join) matching the given UUID, using `queryDb(tx)`.

#### REQ-VAR-002: findByTemplateId
**WHEN** a caller invokes `TemplateVariableRepository.findByTemplateId(templateId, tx?)`, **THE SYSTEM SHALL** return all template variables for the given template, ordered by `order ASC`.

#### REQ-VAR-003: create
**WHEN** a caller invokes `TemplateVariableRepository.create(input, tx?)`, **THE SYSTEM SHALL** insert a new `template_variable_base` row and the type-specific sub-table row (text, number, date, select) within a single transaction.

#### REQ-VAR-004: update
**WHEN** a caller invokes `TemplateVariableRepository.update(id, input, tx?)`, **THE SYSTEM SHALL** update both the base row and the type-specific sub-table row.

#### REQ-VAR-005: delete
**WHEN** a caller invokes `TemplateVariableRepository.delete(id, tx?)`, **THE SYSTEM SHALL** hard-delete the variable from both the sub-table and `template_variable_base`.

---

### 2.5 RecipientGroupRepository

#### REQ-RGRP-001: findById
**WHEN** a caller invokes `RecipientGroupRepository.findById(id, tx?)`, **THE SYSTEM SHALL** return the recipient group row matching the given UUID, using `queryDb(tx)`. **IF** no row matches, return `null`.

#### REQ-RGRP-002: findMany
**WHEN** a caller invokes `RecipientGroupRepository.findMany(filters?, paginationArgs?, orderBy?, tx?)`, **THE SYSTEM SHALL** return a paginated list of recipient groups applying optional filters (`templateId`, `searchText`) using cursor-based pagination on `(createdAt, id)`.

#### REQ-RGRP-003: create
**WHEN** a caller invokes `RecipientGroupRepository.create(input, tx?)`, **THE SYSTEM SHALL** insert a new recipient group row using `const executor = tx ?? db` and `.returning()`.

#### REQ-RGRP-004: update
**WHEN** a caller invokes `RecipientGroupRepository.update(id, input, tx?)`, **THE SYSTEM SHALL** update the recipient group row using `const executor = tx ?? db` and `.returning()`.

#### REQ-RGRP-005: delete
**WHEN** a caller invokes `RecipientGroupRepository.delete(id, tx?)`, **THE SYSTEM SHALL** hard-delete the recipient group and cascade-delete its items and item variable values.

#### REQ-RGRP-006: findItemsByGroupId
**WHEN** a caller invokes `RecipientGroupRepository.findItemsByGroupId(groupId, tx?)`, **THE SYSTEM SHALL** return all `recipient_group_items` for the given group, joined with student data.

#### REQ-RGRP-007: addItem
**WHEN** a caller invokes `RecipientGroupRepository.addItem(input, tx?)`, **THE SYSTEM SHALL** insert a new `recipient_group_item` row. **THE SYSTEM SHALL** enforce the unique constraint `(studentId, recipientGroupId)` at the DB level (unique index).

#### REQ-RGRP-008: removeItem
**WHEN** a caller invokes `RecipientGroupRepository.removeItem(groupId, studentId, tx?)`, **THE SYSTEM SHALL** delete the `recipient_group_item` row and its associated variable values.

#### REQ-RGRP-009: setItemVariableValue
**WHEN** a caller invokes `RecipientGroupRepository.setItemVariableValue(input, tx?)`, **THE SYSTEM SHALL** upsert a `recipient_group_item_variable_value` row, using `onConflictDoUpdate` on the `(templateRecipientGroupItemId, templateVariableId)` unique constraint.

---

### 2.6 VerificationRepository

#### REQ-VER-001: findById
**WHEN** a caller invokes `VerificationRepository.findById(id, tx?)`, **THE SYSTEM SHALL** return the verification record matching the given UUID, using `queryDb(tx)`.

#### REQ-VER-002: findByVerificationCode
**WHEN** a caller invokes `VerificationRepository.findByVerificationCode(code, tx?)`, **THE SYSTEM SHALL** return the verification record matching the unique `verificationCode` column, using `queryDb(tx)`. **IF** no row matches, return `null`. **THE SYSTEM SHALL NOT** use a prepared statement for this query because the code column may require dynamic conditions in the future.

#### REQ-VER-003: findByCertificateId
**WHEN** a caller invokes `VerificationRepository.findByCertificateId(certificateId, tx?)`, **THE SYSTEM SHALL** return all verification records for the given certificate, ordered by `verified_at DESC`.

#### REQ-VER-004: create
**WHEN** a caller invokes `VerificationRepository.create(input, tx?)`, **THE SYSTEM SHALL** insert a new verification record using `const executor = tx ?? db` and `.returning()`.

#### REQ-VER-005: update
**WHEN** a caller invokes `VerificationRepository.update(id, input, tx?)`, **THE SYSTEM SHALL** update the verification record using `const executor = tx ?? db` and `.returning()`.

---

### 2.7 CertificateCategoryRepository

#### REQ-CAT-001: findById
**WHEN** a caller invokes `CertificateCategoryRepository.findById(id, tx?)`, **THE SYSTEM SHALL** return the category row matching the given UUID, using `queryDb(tx)`. **IF** no row matches, return `null`.

#### REQ-CAT-002: findMany
**WHEN** a caller invokes `CertificateCategoryRepository.findMany(filters?, tx?)`, **THE SYSTEM SHALL** return all categories, optionally filtered by `parentCategoryId`, ordered by `order ASC`. **THE SYSTEM SHALL NOT** paginate categories (tree structure, returned in full for client-side tree building).

#### REQ-CAT-003: create
**WHEN** a caller invokes `CertificateCategoryRepository.create(input, tx?)`, **THE SYSTEM SHALL** insert a new category row using `const executor = tx ?? db` and `.returning()`.

#### REQ-CAT-004: update
**WHEN** a caller invokes `CertificateCategoryRepository.update(id, input, tx?)`, **THE SYSTEM SHALL** update the category row using `const executor = tx ?? db` and `.returning()`.

#### REQ-CAT-005: delete
**WHEN** a caller invokes `CertificateCategoryRepository.delete(id, tx?)`, **THE SYSTEM SHALL** hard-delete the category. **IF** child categories exist, **THE SYSTEM SHALL** throw an error indicating the category has children.

#### REQ-CAT-006: findRootCategories
**WHEN** a caller invokes `CertificateCategoryRepository.findRootCategories(tx?)`, **THE SYSTEM SHALL** return all categories where `parentCategoryId IS NULL`, ordered by `order ASC`.

---

## 3. Feature 6 — Outcome Knowledge Base & Progress Tracking

> This feature tracks learning outcomes and progress milestones achieved through certificate completion. It provides a knowledge base linking certificates to specific learning outcomes and tracks student progress toward completion milestones.

### 3.1 OutcomeRepository (within certificates domain)

#### REQ-OUT-001: findOutcomesByCertificateId
**WHEN** a caller invokes `CertificateRepository.findOutcomesByCertificateId(certificateId, tx?)`, **THE SYSTEM SHALL** return all outcome records linked to the given certificate, joined with the outcome knowledge base entries.

#### REQ-OUT-002: findOutcomesByTemplateId
**WHEN** a caller invokes `TemplateRepository.findOutcomesByTemplateId(templateId, tx?)`, **THE SYSTEM SHALL** return all learning outcomes defined for the given template, ordered by `order ASC`.

#### REQ-OUT-003: createOutcome
**WHEN** a caller invokes `TemplateRepository.createOutcome(input, tx?)`, **THE SYSTEM SHALL** insert a new learning outcome linked to a template.

#### REQ-OUT-004: updateOutcome
**WHEN** a caller invokes `TemplateRepository.updateOutcome(id, input, tx?)`, **THE SYSTEM SHALL** update the learning outcome record.

#### REQ-OUT-005: deleteOutcome
**WHEN** a caller invokes `TemplateRepository.deleteOutcome(id, tx?)`, **THE SYSTEM SHALL** hard-delete the learning outcome record.

#### REQ-OUT-006: findProgressByStudentId
**WHEN** a caller invokes `CertificateRepository.findProgressByStudentId(studentId, tx?)`, **THE SYSTEM SHALL** return all progress tracking records for the given student, joined with certificates and outcomes, ordered by `createdAt DESC`.

#### REQ-OUT-007: updateProgress
**WHEN** a caller invokes `CertificateRepository.updateProgress(input, tx?)`, **THE SYSTEM SHALL** upsert a progress tracking record, using `onConflictDoUpdate` on `(studentId, outcomeId)`.

---

## 4. Cross-Cutting Requirements

### REQ-X-001: Transaction Propagation (tx)
**THE SYSTEM SHALL** propagate optional `tx?: DBTransaction` on all read and write methods. **WHEN** no `tx` is provided for reads, **THE SYSTEM SHALL** use `queryDb(tx)` which resolves to the Neon HTTP singleton (stateless reads) or the pooled `db` singleton. **WHEN** no `tx` is provided for writes, **THE SYSTEM SHALL** use `const executor = tx ?? db;`.

### REQ-X-002: Prepared Statements
**THE SYSTEM SHALL** define module-level prepared statements (`sql.placeholder(...)`) for simple `findById` read-only queries that accept only a single scalar `id` parameter. **THE SYSTEM SHALL NOT** use prepared statements for queries containing `inArray`, dynamic WHERE clauses, joins, or writes. **WHEN** a `tx` is provided, **THE SYSTEM SHALL** fall back to `tx.select()` (prepared statements cannot run inside transactions).

### REQ-X-003: Soft Delete Registry
**THE SYSTEM SHALL** register `certificates` and `certificate_templates` in the `SOFT_DELETE_TABLES` registry in `backend/db/repo/shared/soft-delete.repository.ts`. **THE SYSTEM SHALL** add typed convenience wrappers `softDeleteCertificate` and `softDeleteCertificateTemplate` to `SoftDeleteRepository`. **WHILE** reading soft-deletable tables, **THE SYSTEM SHALL** always filter with `isNull(table.deletedAt)`.

### REQ-X-004: Entity Mapping (mapEntityToDto)
**THE SYSTEM SHALL** provide a `mapEntityToDto` function for each repository that omits forbidden fields (e.g., `idempotencyKey`, internal `version`) from the returned DTO and re-applies TS enum types to columns that Drizzle infers as `string`. **THE SYSTEM SHALL** use these mappers in all `findMany` and list-returning methods.

### REQ-X-005: Idempotency Key Handling
**WHEN** a certificate is created with an `idempotencyKey`, **THE SYSTEM SHALL** catch unique constraint violations on the `idempotencyKey` unique index and return the existing row instead of throwing. **THE SYSTEM SHALL NOT** generate random idempotency keys — the caller (service layer) is responsible for deterministic key generation.

### REQ-X-006: Cursor-Based Pagination
**WHEN** cursor-based pagination is requested, **THE SYSTEM SHALL** decode the `after` cursor from base64 into `{ createdAt, id }`, build a WHERE clause with `or(lt(createdAt, cursorDate), and(eq(createdAt, cursorDate), lt(id, cursorId)))` for DESC ordering (mirror with `gt` for ASC), and re-encode `startCursor`/`endCursor` from the first/last item timestamps. **THE SYSTEM SHALL** compute `total` via `sql<number>\`cast(count(*) over() as int)\`` as a window column.

### REQ-X-007: Full-Text Search
**WHEN** full-text search is requested on certificate recipient name, **THE SYSTEM SHALL** use `fullTextSearch(column, searchText, 'simple')` from `@/backend/db/query.extensions` which builds a `to_tsvector('simple', column) @@ to_tsquery('simple', query)` SQL fragment. **THE SYSTEM SHALL** ensure a matching GIN index exists on the schema (defined in Plan 01).

### REQ-X-008: No Hardcoded Error Strings
**THE SYSTEM SHALL NOT** contain hardcoded user-facing error strings. **THE SYSTEM SHALL** accept `tErrors: ErrorsLabels` and throw `new Error(tErrors.certificate.<methodName>(...))`. **THE SYSTEM SHALL** use `NotFoundError` from `@/backend/lib` for not-found-with-context cases.

### REQ-X-009: No Business Logic
**THE SYSTEM SHALL NOT** contain business logic, permission checks, or complex orchestration. **THE SYSTEM SHALL** perform only data access (CRUD, queries, filtering, sorting, pagination). All business logic resides in `backend/services/`.

### REQ-X-010: Barrel Registration
**THE SYSTEM SHALL** create `backend/db/repo/certificates/index.ts` barrel re-exporting all seven repository namespaces. **THE SYSTEM SHALL** register the certificates barrel in `backend/db/repo/index.ts` via `export { ... } from "@/backend/db/repo/certificates";`.

---

## 5. Non-Functional Requirements

### NFR-001: Type Safety
All repository functions shall use types from `backend/types/certificates/` (e.g., `CertificateSelectType`, `CertificateInsertType`, `CertificateReturnType`). No direct schema type references in function signatures.

### NFR-002: Import Conventions
All imports within `.repository.ts` files shall use `@/` aliases for cross-layer dependencies (types, schema, sibling repositories). Relative imports are only for siblings in the same sub-directory barrel.

### NFR-003: Naming Conventions
- Namespace name: `{Entity}Repository` (PascalCase)
- File name: `{entity}.repository.ts` (kebab-case)
- Prepared statement name: `{method}Prepared` with `.prepare("snake_case_name")`
- Barrel: `export * from "./{entity}.repository";`

### NFR-004: Query Performance
- Composite index `(createdAt, id)` shall support cursor pagination on `certificates`, `certificate_templates`, and `certificate_recipient_groups`.
- GIN index on `to_tsvector('simple', recipientName)` shall support FTS on certificates.
- GIN index on `to_tsvector('simple', name)` shall support FTS on templates and categories.
- Unique index on `idempotencyKey` shall enforce idempotency deduplication.

### NFR-005: Separation of Concerns
Repositories shall not import from `@/frontend/**`, `@/app/**`, or `@/backend/services/**`. Repositories may import from `@/backend/db/**`, `@/backend/types`, `@/backend/enum`, `@/backend/lib`, `@/shared/locale`, and sibling repos in `@/backend/db/repo/**`.

---

## 6. Dependencies

| Dependency | Plan | Status | Notes |
|---|---|---|---|
| Certificate DB schema tables | Plan 01 | Required | All `certificates*` tables must exist in `backend/db/schema/certificates/` |
| Certificate type definitions | Plan 02 | Required | `backend/types/certificates/` must export all `*SelectType`, `*InsertType`, `*ReturnType` |
| Certificate enums | Plan 02 | Required | `backend/enum/certificates/` must export `CertificateStatus`, `TemplateElementType`, etc. |
| `queryDb` / `db` | Existing | Available | `@/backend/db` exports `queryDb`; `@/backend/db/drizzleDb` exports `db` |
| `DBTransaction` type | Existing | Available | `@/backend/db/db.types` |
| `queryWithPagination` / `fullTextSearch` | Existing | Available | `@/backend/db/query.extensions` |
| `AuditRepository` | Existing | Available | `@/backend/db/repo/audit` |
| `SoftDeleteRepository` | Existing | Available | `@/backend/db/repo/shared` (needs new entries) |
| `NotFoundError` | Existing | Available | `@/backend/lib` |
| `getServerTranslations` | Existing | Available | `@/shared/locale/server-graphql` |

---

## 7. Acceptance Criteria

1. All seven repository namespaces are exported from `@/backend/db/repo/certificates` and registered in `@/backend/db/repo/index.ts`.
2. `CertificateRepository` supports: `findById` (prepared), `findMany` (cursor + filters), `create` (idempotency), `update`, `softDelete`, `findCertificatesByStudent`, `findCertificatesByTemplate`, `findCertificatesByStatus`, `searchByRecipientName`, `loadByIds`, `existsById`.
3. `TemplateRepository` supports: `findById`, `findMany`, `create`, `update` (version bump), `softDelete`, `findTemplatesByCategory`, `createVersion`, `findLatestVersion`.
4. All read methods use `queryDb(tx)` for stateless Neon HTTP reads; all write methods use `tx ?? db`.
5. Prepared statements are used only for simple `findById` with no `inArray` / dynamic conditions; transaction fallback is implemented.
6. Soft delete filters `isNull(deletedAt)` on all queries against `certificates` and `certificate_templates`.
7. `SOFT_DELETE_TABLES` registry includes `certificates` and `certificate_templates` entries.
8. Cursor pagination decodes/encodes base64 cursors on `(createdAt, id)`.
9. Full-text search uses `fullTextSearch()` helper from `@/backend/db/query.extensions`.
10. Idempotency key violations are caught and return existing rows.
11. No hardcoded error strings — all use `tErrors` parameter.
12. All types come from `@/backend/types` — no local type definitions in repository files.
13. Feature 6 (Outcome Knowledge Base) methods are implemented on `CertificateRepository` and `TemplateRepository`.
14. `tsgo` type checking passes for all new repository files.
15. `biome:check` passes for all new repository files.
16. ESLint passes for all new repository files (via lint queue client).

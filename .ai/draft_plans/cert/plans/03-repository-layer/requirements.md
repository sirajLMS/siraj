# Plan 03 — Repository Layer: Requirements

> **Feature**: Certificate Module — Repository Layer (Data Access)
> **Plan #**: 03
> **Dependencies**: Plan 1 (DB Schema & Enums), Plan 2 (Types & Permissions)
> **Stakeholders**: Backend engineering, Database engineering
> **Related Docs**:
> - `MASTER_ARCHITECTURE.md` — Overarching certificate feature architecture
> - `siraj_analysis/03-repository-patterns.md` — Canonical repo patterns in Siraj
> - `siraj_analysis/01-db-schema-patterns.md` §12 — Repository conventions from schema layer
> - `cgvs_analysis/02-database-schema.md` — Repository pattern section (CGVS project)
> - `cgvs_analysis/06-student-recipient.md` §9 (Student CRUD) and §12 (Filters)
> - `backend/db/repo/AGENTS.md` — Authoritative repo rules
> - `docs/drizzle/prepared-statements.md` — Prepared statement guidelines
> - `docs/drizzle/neon-http-client.md` — `queryDb(tx)` read path rationale

---

## 1. Introduction

### 1.1 Overview

This plan specifies the repository layer for the certificate feature, living in
`backend/db/repo/certificates/`. Repositories are the **only** layer that touches
the database directly; they expose pure data-access operations as namespaces of exported
arrow functions, with no business logic and no permission checks. All repositories
follow the Siraj `queryDb(tx)` read idiom, `tx ?? db` write idiom, prepared statement
opt-in, soft delete centerpiece, FTS helpers, and cursor-paginated findMany helpers
already established in `backend/db/repo/`.

### 1.2 Business Value

A clean, pattern-compliant repository layer is the prerequisite for the services layer
(Plan 4), GraphQL API (Plan 5), and all downstream UI. It guarantees:
- Consistent transaction propagation from service callers
- Idempotent create operations with unique-index conflict catch
- Searchable templates and certificates via FTS + trigram GiST
- Paginated list endpoints with stable `(createdAt, id)` cursors
- Soft-deleted records kept for audit, with advisory-locked hard cleanup path

### 1.3 Scope

| In Scope | Out of Scope |
|---|---|
| `backend/db/repo/certificates/*.repository.ts` files | Schema definitions (Plan 1) |
| Barrel `backend/db/repo/certificates/index.ts` re-exports | Type definitions (Plan 2) |
| `CertificateRepository`, `TemplateRepository`, `TemplateElementRepository` | Service layer business logic (Plan 4) |
| `TemplateVariableRepository`, `RecipientGroupRepository` | GraphQL resolvers (Plan 5) |
| `VerificationRepository`, `CertificateCategoryRepository` | Permission checks (service layer) |
| Prepared statements (findById only, per pattern rules) | Frontend UI |
| FTS via `fullTextSearch` helper + trigram GiST (`gist_trgm_ops` `ilike` fallback) | Cron cleanup orchestration (Plan 22) |
| Cursor pagination helpers on `(createdAt, id)` | PDF rendering (Plan 6) |
| Soft delete via the shared `SoftDeleteRepository.softDelete` | Storage signed URLs (Plan 7) |
| Idempotency unique-index catch for create operations | TestData factory (Plan 20) |
| Error handling: `NotFoundError`, translated conflict errors | Seed data (Plan 1) |
| Map-to-DTO helpers (entity → service return type) | |
| i18n keys for repo-thrown errors | |

### 1.4 Entities Covered

| Repository Namespace | Primary Table(s) |
|---|---|
| `CertificateRepository` | `certificates` |
| `TemplateRepository` | `certificate_templates` |
| `TemplateElementRepository` | `certificate_template_elements` |
| `TemplateVariableRepository` | `certificate_template_variables` |
| `RecipientGroupRepository` | `certificate_recipient_groups`, `certificate_recipient_group_items`, `recipient_group_item_variable_values` |
| `VerificationRepository` | `certificate_verifications` |
| `CertificateCategoryRepository` | `certificate_categories` |

---

## 2. Requirements (EARS Format)

> EARS conventions:
> - **WHEN** `⟨precondition⟩` **THE SYSTEM SHALL** `⟨behavior⟩`
> - **IF** `⟨error-condition⟩` **THE SYSTEM SHALL** `⟨error-behavior⟩`
> - **THE SYSTEM SHALL** `⟨unconditional-behavior⟩`

### 2.1 Repository Architecture Conformance

#### REQ-REPO-001
**THE SYSTEM SHALL** expose every certificate repository as a single
`export namespace {Entity}Repository { ... }` block per
`*.repository.ts` file under `backend/db/repo/certificates/`.

#### REQ-REPO-002
**THE SYSTEM SHALL** not import from `@/frontend/**`, `@/backend/services/**`,
`@/backend/graphql/**`, or `@/app/**` inside any repository file. Repositories may
only import from `@/backend/db/schema`, `@/backend/types`, `@/backend/db`,
`@/backend/lib`, `@/backend/db/repo` (cross-repo barrels), and `@/shared/locale`.

#### REQ-REPO-003
**THE SYSTEM SHALL** type all method return values using types from
`@/backend/types/certificates/*.types.ts` — never infer from raw Drizzle schema types
in the public method signatures.

#### REQ-REPO-004
**WHEN** a repository method is invoked in a read-only context without a transaction
parameter **THE SYSTEM SHALL** use `queryDb(tx)` to resolve the executor, enabling the
Neon HTTP fast path for stateless reads.

#### REQ-REPO-005
**WHEN** a repository method is invoked with a `tx?: DBTransaction` argument
**THE SYSTEM SHALL** propagate that transaction to every downstream repo call within
the same method, never mixing `tx`-scoped and global-`db` scoped queries in one operation.

#### REQ-REPO-006
**WHEN** a repository performs a write (insert/update/delete/upsert)
**THE SYSTEM SHALL** resolve the executor via `const executor = tx ?? db;` — writes
never use the Neon HTTP client.

---

### 2.2 Prepared Statement Compliance

#### REQ-PREP-001
**THE SYSTEM SHALL** provide prepared statements for the following scalar-lookup
methods only:
- `CertificateRepository.findById(id, tx?)`
- `TemplateRepository.findById(id, tx?)`
- `CertificateCategoryRepository.findById(id, tx?)`
- `VerificationRepository.findByCode(code, tx?)`

Each prepared statement **SHALL** be defined at module level before its namespace,
named `{method}Prepared`, and registered via `.prepare("snake_case_name")`.

#### REQ-PREP-002
**WHEN** a prepared-statement-backed method is invoked with a `tx` argument
**THE SYSTEM SHALL** fall back to a regular Drizzle query inside the transaction
(prepared statements are bound to the global `db` session and cannot run in a tx).

#### REQ-PREP-003
**THE SYSTEM SHALL NOT** use prepared statements for:
- Any `inArray(col, ids)` lookup
- Any insert/update/delete/upsert
- Any method with a mandatory `tx` parameter
- Any dynamic WHERE clause (filters, FTS, cursor pagination)
- Any `$count()` or `$dynamic()` query

These **SHALL** use dynamic `db.select()...where(...)` or `tx.select()...where(...)`
per the executor pattern.

#### REQ-PREP-004
**THE SYSTEM SHALL** guard each prepared-statement-backed method against
`tx`-and-prepared conflicts by branching: if `!tx`, execute the prepared statement;
otherwise, build a regular Drizzle query using the supplied `tx`.

---

### 2.3 `CertificateRepository` — Certificate CRUD & Search

#### REQ-CERT-001 — Create
**THE SYSTEM SHALL** expose `create(input: CertificateCreateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<CertificateReturnType>`.
The method SHALL insert a row, catch unique-index conflicts (verification code,
idempotency key) and throw translated conflict errors via `tErrors`.

#### REQ-CERT-002 — FindById
**THE SYSTEM SHALL** expose `findById(id: string, tx?: DBTransaction): Promise<CertificateReturnType | null>`.
This method SHALL be backed by a prepared statement when `tx` is absent.

#### REQ-CERT-003 — FindMany (cursor pagination)
**THE SYSTEM SHALL** expose `findMany(filters: CertificateFilters, paginationArgs: PaginationArgs, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<{ items: CertificateReturnType[]; pageInfo: PageInfo; totalCount: number }>`.
- Filters include: `status`, `templateId`, `studentId`, `recipientNameSearch` *(future-decision placeholder — Plan 01 `certificates` has NO `recipientName` column; recipient-name search requires a denormalized snapshot column OR a join-backed `ILIKE students.name` query; until Plan 01 decides, this filter is implemented as a join-backed `ILIKE` against `students.name` rather than an FTS on a `certificates` column — see design section 7.1 note)*, `dateFrom`, `dateTo`.
- Cursor pagination SHALL use `(createdAt, id)` stable ordering.
- `totalCount` SHALL be computed via `sql<number>\`cast(count(*) over() as int)\`` window column.
- Cursor decode/encode SHALL use base64 of `{ createdAt, id }` per the `StudentRepository._processStudentQuery` pattern.

#### REQ-CERT-004 — Search (FTS)
**WHEN** `filters.search` is a non-empty string **THE SYSTEM SHALL** apply the
`fullTextSearch` helper against the recipient name column using config `'simple'`,
and additionally apply trigram `ilike` fallback for short tokens.

#### REQ-CERT-005 — Update
**THE SYSTEM SHALL** expose `update(id: string, patch: CertificateUpdateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<CertificateReturnType>`.
The method SHALL reject updates to soft-deleted rows and throw `tErrors.certificateNotFound(id)` when the row is missing or deleted.

#### REQ-CERT-006 — SoftDelete
**THE SYSTEM SHALL** expose `softDelete(id: string, actorUserId: string, tErrors: ErrorsLabels, tx?: DBTransaction, locale?: string): Promise<{ entity: CertificateReturnType; deletedAt: Date }>`.
The method SHALL delegate to the shared `SoftDeleteRepository.softDelete` helper with
`tableName: 'certificates'` and write a matching `AuditRepository.createAuditLog` entry.

#### REQ-CERT-007 — Exists
**THE SYSTEM SHALL** expose `exists(id: string, tx?: DBTransaction): Promise<boolean>`.
The method SHALL use `q.$count()` (never a prepared statement).

#### REQ-CERT-008 — Count
**THE SYSTEM SHALL** expose `count(filters: CertificateFilters, tx?: DBTransaction): Promise<number>`.
The method SHALL return `Number(row?.count ?? 0)` and reuse the same filter builder as `findMany` minus pagination.

#### REQ-CERT-009 — UpdateStatus
**THE SYSTEM SHALL** expose `updateStatus(id: string, newStatus: CertificateStatus, expectedVersion: number, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<CertificateReturnType>`.
The method SHALL implement optimistic concurrency by checking `current.version !== expectedVersion`
and throwing `tErrors.certificateVersionMismatch` on mismatch, then bumping `version` via
`sql\`${certificates.version} + 1\``.

#### REQ-CERT-010 — LoadByIds (DataLoader)
**THE SYSTEM SHALL** expose `loadByIds(ids: string[], tErrors: ErrorsLabels, tx?: DBTransaction): Promise<(CertificateReturnType | Error)[]>`.
The method SHALL:
- Return `[]` when `ids.length === 0`
- Use `inArray(certificates.id, ids)` — NEVER a prepared statement
- Preserve request order
- Return `new Error(tErrors.certificateNotFound(id))` for each missing id

#### REQ-CERT-011 — FindByVerificationCode
**THE SYSTEM SHALL** expose `findByVerificationCode(code: string, tx?: DBTransaction): Promise<CertificateReturnType | null>`.
This lookup is used by the public verification flow and SHALL be backed by a
prepared statement (scalar lookup, no `tx` in public path).

#### REQ-CERT-012 — Map to DTO
**THE SYSTEM SHALL** expose a private helper `mapCertificateToDto(row): CertificateReturnType`
inside the namespace that flattens JSONB columns (e.g., `metadata`) and resolves
any localized fields via `resolveLocalized`.

---

### 2.4 `TemplateRepository` — Template CRUD & Versioning

#### REQ-TPL-001 — Create
**THE SYSTEM SHALL** expose `create(input: TemplateCreateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TemplateReturnType>`.
The method SHALL insert with status `draft` and version `1`, and catch the
`(slug, version)` unique-index conflict with `tErrors.templateSlugVersionConflict(slug, version)`.

#### REQ-TPL-002 — FindById
**THE SYSTEM SHALL** expose `findById(id: string, tx?: DBTransaction): Promise<TemplateReturnType | null>`
backed by a prepared statement when `tx` is absent.

#### REQ-TPL-003 — FindMany (cursor pagination)
**THE SYSTEM SHALL** expose `findMany(filters: TemplateFilters, paginationArgs: PaginationArgs, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<{ items: TemplateReturnType[]; pageInfo: PageInfo; totalCount: number }>`.
- Filters: `status`, `categoryId`, `authorUserId`, `nameSearch`, `orientation`, `dateFrom`, `dateTo`.
- Stable ordering on `(createdAt, id)`.

#### REQ-TPL-004 — Search (FTS)
**WHEN** `filters.nameSearch` is non-empty **THE SYSTEM SHALL** apply `fullTextSearch`
against `certificate_templates.name` with config `'simple'`, with trigram `ilike`
fallback for tokens shorter than 3 characters.

#### REQ-TPL-005 — Update
**THE SYSTEM SHALL** expose `update(id: string, patch: TemplateUpdateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TemplateReturnType>`.
The method SHALL reject updates to published/archived templates unless the patch
includes an explicit `forceEdit` flag (enforced by the service layer; repo just throws
on missing row or deleted row).

#### REQ-TPL-006 — SoftDelete
**THE SYSTEM SHALL** expose `softDelete(id: string, actorUserId: string, tErrors: ErrorsLabels, tx?: DBTransaction, locale?: string): Promise<{ entity: TemplateReturnType; deletedAt: Date }>`
delegating to `SoftDeleteRepository.softDelete` with `tableName: 'certificate_templates'` and
an audit log entry.

#### REQ-TPL-007 — PublishVersion
**THE SYSTEM SHALL** expose `publishVersion(id: string, actorUserId: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TemplateReturnType>`.
The method SHALL:
1. Acquire advisory lock `pg_advisory_xact_lock(hashtext('cert_template_' || id))`
2. Load current draft row
3. Mutate `status:` `'published'`, `publishedAt: now()`, bump `version` atomically
4. Write audit log entry `{ action: 'PUBLISH', ... }`

#### REQ-TPL-008 — GetVersionChain
**THE SYSTEM SHALL** expose `getVersionChain(slug: string, tx?: DBTransaction): Promise<TemplateReturnType[]>`.
The method SHALL return all rows sharing the same `slug` ordered by `version DESC`.
This uses a dynamic `where(eq(certificate_templates.slug, slug))` — NOT a prepared
statement, because it returns a list.

#### REQ-TPL-009 — CloneForVersioning
**THE SYSTEM SHALL** expose `cloneForVersioning(sourceId: string, newVersion: number, tx?: DBTransaction): Promise<TemplateReturnType>`.
The method SHALL:
1. Load the source template (with elements and variables via repo composition)
2. Insert a new template row with the same `slug`, `newVersion`, status `draft`,
   copied dimensions/orientation/background/font metadata
3. NOT cascade-copy elements/variables (service layer orchestrates that via
   `TemplateElementRepository` and `TemplateVariableRepository` calls within the
   same `tx`)

---

### 2.5 `TemplateElementRepository` — Element CRUD

#### REQ-ELEM-001 — FindByTemplate
**THE SYSTEM SHALL** expose `findByTemplate(templateId: string, tx?: DBTransaction): Promise<TemplateElementReturnType[]>`.
Ordered by `zIndex ASC, createdAt ASC`. Uses dynamic `where(eq(templateId, ...))`.

#### REQ-ELEM-002 — Create
**THE SYSTEM SHALL** expose `create(input: TemplateElementCreateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TemplateElementReturnType>`.

#### REQ-ELEM-003 — Update
**THE SYSTEM SHALL** expose `update(id: string, patch: TemplateElementUpdateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TemplateReturnType>`.
On missing or deleted row, throw `tErrors.elementNotFound(id)`.

#### REQ-ELEM-004 — Delete
**THE SYSTEM SHALL** expose `delete(id: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<void>`.
Template elements use hard delete (not soft delete) because they're child records
of a template. The method SHALL throw `tErrors.elementNotFound(id)` on missing rows.

#### REQ-ELEM-005 — Reorder
**THE SYSTEM SHALL** expose `reorder(templateId: string, orderedIds: string[], tErrors: ErrorsLabels, tx?: DBTransaction): Promise<void>`.
The method SHALL update each element's `zIndex` based on the position in `orderedIds`,
performing all updates inside the supplied `tx` or a fresh `db.transaction`.

#### REQ-ELEM-006 — FindByType
**THE SYSTEM SHALL** expose `findByType(templateId: string, elementType: TemplateElementType, tx?: DBTransaction): Promise<TemplateElementReturnType[]>`.
Filtered by `eq(elementType, ...)`. Useful for QR code generation (filter for
`qr_code` elements) and image publishing (filter for `image` elements).

---

### 2.6 `TemplateVariableRepository` — Variable CRUD

#### REQ-VAR-001 — FindByTemplate
**THE SYSTEM SHALL** expose `findByTemplate(templateId: string, tx?: DBTransaction): Promise<TemplateVariableReturnType[]>`.

#### REQ-VAR-002 — Create
**THE SYSTEM SHALL** expose `create(input: TemplateVariableCreateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TemplateVariableReturnType>`.
The method SHALL catch `unique(key, templateId)` index conflict with
`tErrors.variableKeyConflict(key)`.

#### REQ-VAR-003 — Update
**THE SYSTEM SHALL** expose `update(id: string, patch: TemplateVariableUpdateInput, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TemplateVariableReturnType>`.

#### REQ-VAR-004 — Delete
**THE SYSTEM SHALL** expose `delete(id: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<void>`.
Hard delete (child record); throw `tErrors.variableNotFound(id)` on missing.

#### REQ-VAR-005 — FindByType
**THE SYSTEM SHALL** expose `findByType(templateId: string, variableType: TemplateVariableType, tx?: DBTransaction): Promise<TemplateVariableReturnType[]>`.

---

### 2.7 `RecipientGroupRepository` — Group + Items + Variable Values

#### REQ-GRP-001 — Group CRUD
**THE SYSTEM SHALL** expose CRUD methods on the `certificate_recipient_groups` table:
- `create(input: RecipientGroupCreateInput, tErrors, tx?): Promise<RecipientGroupReturnType>`
- `findById(id, tx?): Promise<RecipientGroupReturnType | null>`
- `findMany(filters: RecipientGroupFilters, paginationArgs, tErrors, tx?): Promise<PaginatedResult<RecipientGroupReturnType>>`
- `update(id, patch, tErrors, tx?): Promise<RecipientGroupReturnType>`
- `softDelete(id, actorUserId, tErrors, tx?, locale?): Promise<{ entity, deletedAt }>`
- `findByTemplate(templateId, tx?): Promise<RecipientGroupReturnType[]>`

#### REQ-GRP-002 — FindItems (paginated)
**THE SYSTEM SHALL** expose `findItems(groupId: string, filters: RecipientGroupItemFilters, paginationArgs: PaginationArgs, tErrors, tx?): Promise<PaginatedResult<RecipientGroupItemReturnType>>`.
- Filters: `studentNameSearch`, `hasVariableOverrides`, `studentId`.
- Joined to `students` table to resolve student name/identity.
- Cursor pagination on `(createdAt, id)` of `certificate_recipient_group_items`.

#### REQ-GRP-003 — AddItem
**THE SYSTEM SHALL** expose `addItem(input: RecipientGroupItemCreateInput, tErrors, tx?): Promise<RecipientGroupItemReturnType>`.
The method SHALL catch `unique(group_id, student_id)` conflict with
`tErrors.studentAlreadyInGroup(studentId, groupId)`.

#### REQ-GRP-004 — RemoveItem
**THE SYSTEM SHALL** expose `removeItem(itemId: string, tErrors, tx?): Promise<void>`.
Hard delete on junction row; throw `tErrors.itemNotFound(itemId)` on missing.

#### REQ-GRP-005 — UpdateVariableValue
**THE SYSTEM SHALL** expose `updateVariableValue(itemId: string, variableId: string, value: string, tErrors, tx?): Promise<RecipientGroupItemVariableValueReturnType>`.
The method SHALL upsert into `recipient_group_item_variable_values` on the
`(item_id, variable_id)` unique key, using `onConflictDoUpdate`.

#### REQ-GRP-006 — FindByTemplate
**THE SYSTEM SHALL** expose `findByTemplateForGeneration(templateId: string, tx?: DBTransaction): Promise<RecipientGroupWithItemsReturnType[]>`.
Returns groups with eagerly-loaded items and variable values, optimized for the
generation pipeline (Plan 4/17). Uses relational query builder
`q.query.certificateRecipientGroups.findMany({ with: { items: { with: { variableValues: true } } } })`.

---

### 2.8 `VerificationRepository` — Verification Logs

#### REQ-VER-001 — Create
**THE SYSTEM SHALL** expose `create(input: VerificationCreateInput, tx?: DBTransaction): Promise<VerificationReturnType>`.
Verifications are append-only (no updates). No unique-conflict catch needed.
No `tErrors` parameter — verification creation never throws business errors.

#### REQ-VER-002 — FindByCertificate
**THE SYSTEM SHALL** expose `findByCertificate(certificateId: string, paginationArgs: PaginationArgs, tx?: DBTransaction): Promise<PaginatedResult<VerificationReturnType>>`.
Ordered by `createdAt DESC` (most recent first).

#### REQ-VER-003 — FindByCode
**THE SYSTEM SHALL** expose `findByCode(code: string, tx?: DBTransaction): Promise<VerificationReturnType | null>`
backed by a prepared statement when `tx` is absent.

#### REQ-VER-004 — CountVerifications
**THE SYSTEM SHALL** expose `countVerifications(certificateId: string, tx?: DBTransaction): Promise<number>`.
Returns `Number(row?.count ?? 0)`.

---

### 2.9 `CertificateCategoryRepository` — Category Tree

#### REQ-CAT-001 — FindById
**THE SYSTEM SHALL** expose `findById(id, tx?): Promise<CertificateCategoryReturnType | null>`
backed by a prepared statement when `tx` is absent.

#### REQ-CAT-002 — Create
**THE SYSTEM SHALL** expose `create(input: CertificateCategoryCreateInput, tErrors, tx?): Promise<CertificateCategoryReturnType>`.

#### REQ-CAT-003 — Update
**THE SYSTEM SHALL** expose `update(id, patch, tErrors, tx?): Promise<CertificateCategoryReturnType>`.

#### REQ-CAT-004 — SoftDelete
**THE SYSTEM SHALL** expose `softDelete(id, actorUserId, tErrors, tx?, locale?): Promise<{ entity, deletedAt }>`
delegating to the shared `SoftDeleteRepository.softDelete` helper.

#### REQ-CAT-005 — FindTree
**THE SYSTEM SHALL** expose `findTree(rootId: string | null, tx?: DBTransaction): Promise<CertificateCategoryTreeNode[]>`.
Returns recursive tree (children populated) starting from a root (or all roots
if `rootId` is null). Uses a recursive CTE via `sql` template because Drizzle
relational API doesn't support arbitrary-depth tree expansion.

#### REQ-CAT-006 — Reorder
**THE SYSTEM SHALL** expose `reorder(siblings: { id: string; sortOrder: number }[], tx?: DBTransaction): Promise<void>`.
Bulk updates the `sortOrder` column within a single `tx`-scoped transaction.

#### REQ-CAT-007 — FindWithTemplateCount
**THE SYSTEM SHALL** expose `findWithTemplateCount(parentId: string | null, tx?: DBTransaction): Promise<(CertificateCategoryReturnType & { templateCount: number })[]>`.
Uses conditional aggregation `sql<number>\`COALESCE(COUNT(certificate_templates.id), 0)::int\``
with `leftJoin(certificate_templates, eq(...))` and group-by category.

---

### 2.10 Cross-cutting: Soft Delete, Audit, Idempotency

#### REQ-SD-001 — Soft Delete Registration
**THE SYSTEM SHALL** register `certificates`, `certificate_templates`, and
`certificate_categories` in the `SOFT_DELETE_TABLES` registry in
`backend/db/repo/shared/soft-delete.repository.ts` so they can use the generic
`SoftDeleteRepository.softDelete` helper with audit log support.

#### REQ-SD-002 — Soft Delete Filter
**THE SYSTEM SHALL** filter `isNull(deletedAt)` in all `findMany`, `findById`,
`update`, `count`, `exists`, and `loadByIds` queries for soft-deletable entities
(certificates, templates, categories). Items, elements, variables, and verifications
do not soft-delete and shall not filter on `deletedAt`.

#### REQ-AUDIT-001 — Audit on Soft Delete
**WHEN** a soft delete succeeds **THE SYSTEM SHALL** write an
`AuditRepository.createAuditLog` entry with:
- `action: 'DELETE'`
- `tableName` set to the entity table name
- `entityId` set to the deleted id
- `actorUserId` set to the caller's id
- `previousState` set to the pre-delete snapshot
- `newState` is null (entity is now soft-deleted)
- `changes` set to `{ deletedAt: { from: null, to: <timestamp> } }`

#### REQ-IDEMP-001 — Idempotency Index Catch
**WHEN** a create operation hits a unique-index conflict (e.g., certificate
verification code, idempotency key, template `(slug, version)`, variable
`(key, templateId)`, recipient item `(group_id, student_id)`)
**THE SYSTEM SHALL** catch the Postgres unique-violation error code
`23505` and throw the corresponding `tErrors.<conflictKey>(...)` translated message
instead of leaking the raw database error.

---

### 2.11 Feature 6: Outcome Knowledge Base & Progress Tracking

#### REQ-KNOW-001
**WHEN** repository files are created/modified **THE SYSTEM SHALL** track progress
in the session SQLite `todos` table with status transitions
`pending → in_progress → done` per repository file.

#### REQ-KNOW-002
**WHEN** any deviation from the Siraj repository pattern is discovered
(e.g., new prepared-statement idiom, new FTS config) **THE SYSTEM SHALL** document
it in `docs/certificates/repository-patterns.md` (created in Plan 21 — but noted here
as a dependency for knowledge persistence).

---

## 3. i18n Requirements

### 3.1 Translation Keys — Repository Errors

All repository-thrown error messages use the compile-time translation system in `shared/locale/`. Repositories take a **`tErrors: ErrorsLabels`** parameter (positionally, before `tx?`), where `ErrorsLabels` is the SINGLE AGGREGATE error-translation interface defined at `shared/locale/types/errors/index.ts` (~308 lines, with per-domain sub-interfaces `StudentErrors`, `BillingErrors`, etc., plus a flattened backward-compat section for legacy keys like `studentCreateFailed`). Verified canonical pattern at `backend/db/repo/students/student.repository.ts:15,105,155`. There is NO per-entity `{Entity}RepoErrors` type in this codebase — all repositories reuse the same aggregate `ErrorsLabels`.

> **Important (reality-checked)**: The caller (service layer, Plan 4) constructs `tErrors` via the **1-arg** `getServerTranslations(locale)` helper from `@/shared/locale` (returns `{ errorsTranslations: ErrorsLabels }`, accessed by sub-namespace — e.g. `getServerTranslations(locale).errorsTranslations.certificate.<key>(args)`) and passes it in. The invented 2-arg `getServerTranslations(locale, "certificates.errors.repo")` form does NOT exist for backend errors — the 2-arg pattern belongs to the client-side `defineNamespace(id, config)` namespace system (`shared/locale/namespaces/define-namespace.ts`) used by the frontend `useTranslation` hook, distinct from backend repo error binding. Repositories themselves never call translation functions directly for business errors — they only invoke `tErrors.certificate.<key>(args)` (or the legacy flattened `tErrors.<key>` aliases) to produce error strings.

### 3.2 Aggregate Type: `CertificateRepoErrors` sub-keyset of `ErrorsLabels`

| Key | Interpolation Params | English (one/other) | Arabic plural |
|---|---|---|---|
| `certificateNotFound` | `id: string` | `Certificate not found: {id}` | zero/one/two/few/many/other: `لم يتم العثور على الشهادة: {id}` |
| `certificateCreateFailed` | — | `Failed to create certificate` | `فشل في إنشاء الشهادة` |
| `certificateVersionMismatch` | — | `Certificate version mismatch — please refresh and try again` | `تعارض في إصدار الشهادة — يرجى التحديث والمحاولة مرة أخرى` |
| `certificateVerificationCodeConflict` | `code: string` | `Verification code conflict: {code}` (one/other for `{code}` count, not used here) | `تعارض في رمز التحقق: {code}` |
| `templateNotFound` | `id: string` | `Template not found: {id}` | `لم يتم العثور على القالب: {id}` |
| `templateSlugVersionConflict` | `slug: string, version: number` | `Template slug {slug} version {version} already exists` | `القالب {slug} الإصدار {version} موجود بالفعل` |
| `templateCreateFailed` | — | `Failed to create template` | `فشل في إنشاء القالب` |
| `elementNotFound` | `id: string` | `Template element not found: {id}` | `لم يتم العثور على عنصر القالب: {id}` |
| `variableNotFound` | `id: string` | `Template variable not found: {id}` | `لم يتم العثور على متغير القالب: {id}` |
| `variableKeyConflict` | `key: string` | `Variable key already exists in template: {key}` | `مفتاح المتغير موجود بالفعل في القالب: {key}` |
| `groupNotFound` | `id: string` | `Recipient group not found: {id}` | `لم يتم العثور على مجموعة المستفيدين: {id}` |
| `groupItemNotFound` | `id: string` | `Recipient group item not found: {id}` | `لم يتم العثور على عنصر مجموعة المستفيدين: {id}` |
| `studentAlreadyInGroup` | `studentId: string, groupId: string` | `Student {studentId} already in group {groupId}` | `الطالب {studentId} موجود بالفعل في المجموعة {groupId}` |
| `categoryNotFound` | `id: string` | `Category not found: {id}` | `لم يتم العثور على الفئة: {id}` |
| `categoryCreateFailed` | — | `Failed to create category` | `فشل في إنشاء الفئة` |
| `categoryHasChildren` | `id: string` | `Cannot delete category {id} — it has child categories` | `لا يمكن حذف الفئة {id} — تحتوي على فئات فرعية` |
| `categoryHasTemplates` | `id: string, count: number` | `Cannot delete category {id} — {count} template(s) assigned` | zero: `لا يمكن حذف الفئة {id} — لا توجد قوالب معينة` · one: `لا يمكن حذف الفئة {id} — قالب واحد معين` · two: `لا يمكن حذف الفئة {id} — قالبان معينان` · few: `لا يمكن حذف الفئة {id} — {count} قوالب معينة` · many: `لا يمكن حذف الفئة {id} — {count} قالباً معيناً` · other: `لا يمكن حذف الفئة {id} — {count} قالب معين` |
| `invalidCursorPosition` | — | `Invalid cursor position` | `موضع المؤشر غير صالح` |

### 3.3 Pluralization Rules

| Locale | Rule | Example |
|---|---|---|
| `en` | `one` / `other` | `categoryHasTemplates`: one → `1 template`, other → `{count} templates` |
| `ar` | `zero / one / two / few / many / other` | `categoryHasTemplates`: zero → `لا توجد قوالب`, one → `قالب واحد`, two → `قالبان`, few → `{count} قوالب`, many → `{count} قالباً`, other → `{count} قالب` |

### 3.4 Translation Type Schema Location

The certificate repository error keys SHALL be ADDED to the existing single-aggregate backend error-translation layer (verified reality; the original "flat-file" approach below is INCORRECT and has been corrected):
- Type schema: append a new `CertificateRepoErrors` sub-interface + compose it into the existing `ErrorsLabels` aggregate at `shared/locale/types/errors/index.ts` (verified single aggregate ~308 lines; add `certificate: CertificateRepoErrors;` to the aggregate just like the existing `student: StudentErrors`, `billing: BillingErrors` sub-interfaces).
- English impl: append a nested `certificate: { ... }` domain block to the existing `shared/locale/en/errors/index.ts` (verified single English errors file with nested domain objects).
- Arabic impl: append a nested `certificate: { ... }` block to the existing `shared/locale/ar/errors/index.ts` (verified single Arabic errors file matching the English shape).

DO NOT CREATE flat per-domain files like `shared/locale/certificates.errors.repo.ts` / `shared/locale/en/certificates.errors.repo.ts` / `shared/locale/ar/certificates.errors.repo.ts` — that flat scheme does NOT exist anywhere in `shared/locale/`; backend errors use a single aggregate. These edits are made as part of this plan's task scope (i18n for backend repo errors is inlined here, since there is no separate i18n plan).

> Note (reality-checked): The shared/locale system is compile-time TypeScript. Each key is a function `(params...) => string` declared in the type schema and implemented in each locale file. The `tErrors` parameter type is the bound `ErrorsLabels` aggregate; certificate error keys are accessible via the `certificate` sub-namespace (or via flattened legacy aliases where introduced). The service layer constructs `tErrors` via the 1-arg helper `getServerTranslations(locale).errorsTranslations` (verified at `backend/db/repo/students/student.repository.ts:17,190`), NOT via the invented 2-arg `getServerTranslations(locale, "certificates.errors.repo")` form.

---

## 4. Acceptance Criteria

### 4.1 Repository Architecture
- **AC-1**: Every repository file exports exactly one `namespace {Entity}Repository`
  with no class definitions and no inline schema redefinitions.
- **AC-2**: `bun tsgo` passes with zero new type errors in any cert repo file.
- **AC-3**: `bun biome:check` passes on every cert repo file.
- **AC-4**: `bun run lint` passes on every cert repo file (via lint queue client).

### 4.2 Prepared Statement Compliance
- **AC-5**: `CertificateRepository.findById`, `TemplateRepository.findById`,
  `CertificateCategoryRepository.findById`, and `VerificationRepository.findByCode`
  each declare a module-level prepared statement.
- **AC-6**: Each prepared-statement-backed method branches on `tx` — no path where a
  prepared statement is invoked inside a `db.transaction` callback.
- **AC-7**: No `inArray`-based method uses a prepared statement (`loadByIds`,
  `getVersionChain`, `findByType`).

### 4.3 CRUD Correctness
- **AC-8**: All create methods catch `23505` unique-violation and throw translated
  `tErrors.<conflictKey>` — raw DB error never reaches the caller.
- **AC-9**: All update methods reject soft-deleted rows (throw `tErrors.<entity>NotFound`).
- **AC-10**: All `findById` methods on soft-deletable entities filter `isNull(deletedAt)`.
- **AC-11**: `loadByIds` returns `(Entity | Error)[]` in request order with
  `new Error(...)` for misses. Empty `ids` array returns `[]` without any DB query.

### 4.4 Pagination
- **AC-12**: `findMany` cursor pagination decodes base64 `{ createdAt, id }`,
  builds `(createdAt, id)` comparison predicate, and re-encodes `startCursor`
  /`endCursor` from first/last row.
- **AC-13**: `totalCount` uses window function `cast(count(*) over() as int)`,
  not a separate count query.

### 4.5 FTS
- **AC-14**: Template search uses `fullTextSearch` helper with config `'simple'`
  on `name` column.
- **AC-15**: Certificate search uses `fullTextSearch` helper with config `'simple'`
  on recipient name column, with trigram `ilike` fallback for short tokens.

### 4.6 Soft Delete & Audit
- **AC-16**: Generic `SoftDeleteRepository.softDelete` is invoked for `certificates`,
  `certificate_templates`, and `certificate_categories` — each acquisition of
  `pg_advisory_xact_lock(hashtext('...'))` before the read+write.
- **AC-17**: Each soft delete writes an `AuditRepository.createAuditLog` entry
  with `action: 'DELETE'`.

### 4.7 i18n
- **AC-18**: A new `CertificateRepoErrors` sub-interface exists in `shared/locale/types/errors/index.ts`, IS composed into the `ErrorsLabels` aggregate as `certificate: CertificateRepoErrors;`, with one function type per key listed in §3.2.
- **AC-19**: A nested `certificate: { ... }` block exists in both `shared/locale/en/errors/index.ts` and `shared/locale/ar/errors/index.ts` with matching key signatures to the `CertificateRepoErrors` interface.
- **AC-20**: Arabic pluralization for `categoryHasTemplates` produces all six
  forms (zero/one/two/few/many/other) with correct template literals.
- **AC-21**: No repository file contains a hardcoded user-facing error string —
  all errors go through `tErrors.<key>(args)`.

### 4.8 Knowledge Propagation
- **AC-22**: `backend/db/repo/certificates/index.ts` barrel re-exports all seven
  repository namespaces.
- **AC-23**: `backend/db/repo/index.ts` top-level barrel re-exports the
  `certificates` sub-barrel.
- **AC-24**: This plan's tasks file references applicable `AGENTS.md` and
  `.github/instructions/*.instructions.md` files per task.

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Corrections applied to requirements.md
1. **§2 «soft delete» dependency row `softDelete.generic`** → **`SoftDeleteRepository.softDelete`** — verified `backend/db/repo/shared/soft-delete.repository.ts:69`.
2. **All REQ signatures `tErrors: <Entity>RepoErrors`** → **`tErrors: ErrorsLabels`** (18 occurrences). Verified canonical `student.repository.ts:15,105,155` — every repo uses the single aggregate `ErrorsLabels` from `@/shared/locale`, NOT a per-entity type.
3. **§3.1 i18n prose** — replaced the invented `{Entity}RepoErrors` type and the 2-arg `getServerTranslations(locale, "certificates.errors.repo")` form with the verified reality: `tErrors: ErrorsLabels` (single aggregate at `shared/locale/types/errors/index.ts`) bound via the 1-arg `getServerTranslations(locale).errorsTranslations` from `@/shared/locale`. The 2-arg namespace-id form belongs to the client-side `defineNamespace` system (`shared/locale/namespaces/define-namespace.ts`), used by frontend `useTranslation`, distinct from backend repo error binding.
4. **§3.2 heading "Namespace: `certificates.errors.repo`"** → "Aggregate Type: `CertificateRepoErrors` sub-keyset of `ErrorsLabels`" — the original heading implied a frontend-style namespace registration; the backend reality is a sub-interface composed into the single aggregate.

### Verified correct (no changes needed)
- All `backend/db/repo/certificates/*.repository.ts` file paths match verified repo file-naming convention. ✓
- `@/backend/types/certificates/*.types.ts` import path (cross-reference to Plan 02) matches Plan 02's corrected `backend/types/certificates/` sub-directory. ✓
- `db.transaction(runner)` + advisory lock + soft-delete-GUC pattern (`set_config('app.soft_delete', 'true', true)`). ✓
- All `created`/`updated`/`uniqueness` error-throw semantics described are consistent with verified `student.repository.ts:127-133` patterns.

### Caveat
- The §3.2 table lists the entity-specific error keys (e.g. `certificateNotFound`, `templateSlugVersionConflict`, `categoryHasTemplates`). These will be defined as a new `CertificateRepoErrors` interface and added to the `ErrorsLabels` aggregate (see Plan 03 design §11). Verify the new keys don't collide with any flattened legacy keys already on `ErrorsLabels` (e.g. the existing `studentNotFound`, `billingNotFound` siblings).

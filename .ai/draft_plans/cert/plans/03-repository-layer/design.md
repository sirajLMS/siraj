# Plan 03 — Repository Layer: Design

> **Feature**: Certificate Module — Repository Layer (Data Access)
> **Plan #**: 03
> **Dependencies**: Plan 1 (DB Schema & Enums), Plan 2 (Types & Permissions)
> **Authoritative Patterns**:
> - `backend/db/repo/AGENTS.md`
> - `siraj_analysis/03-repository-patterns.md`
> - `siraj_analysis/01-db-schema-patterns.md` §12
> - `docs/drizzle/prepared-statements.md`
> - `docs/drizzle/neon-http-client.md`
> - `docs/graphql/dataloader-batching.md` (batch lookup chapter)

---

## 1. Architecture Position

```
App Router (server) → Service → [Repository] → Database
Client → Apollo → GraphQL → Resolver → Service → [Repository] → Database
```

The repository layer sits between the service layer (Plan 4) and the PostgreSQL
database. It is the **sole permit holder** for SQL execution — no service, resolver,
or component writes raw queries. This plan implements the certificate-specific
repositories; all patterns are lifted verbatim from existing Siraj repos
(`StudentRepository`, `CreditRepository`, `BillingRepository`,
`SoftDeleteRepository`, `AuditRepository`, `StorageDbRepository`).

### 1.1 Data Flow Within Repositories

```
Service caller
   │
   ├─ read path → queryDb(tx) → Drizzle query builder / prepared statement
   │                                      ↓
   │                              mapEntityToDto(row) → ReturnType
   │
   └─ write path → const executor = tx ?? db
                          ↓
              Drizzle insert/update/delete
                          ↓
              catch 23505 → throw tErrors.<conflictKey>
                          ↓
              mapEntityToDto(row) → ReturnType
```

### 1.2 Transaction Boundary

Repositories **never** create transactions — they receive `tx?: DBTransaction`
from the service layer. When a method needs to compose multiple writes (e.g.,
`RecipientGroupRepository.addItem` with variable values, or
`TemplateRepository.publishVersion` with an audit log), it branches:

- If `tx` is provided, all operations run inside that `tx`.
- If `tx` is absent, each operation runs independently against `db`.

The service layer is responsible for wrapping composite operations in
`db.transaction(runner)` before invoking repository methods. This matches the
existing Siraj pattern (`StudentRepository.create`, `BillingRepository.createInvoice`,
`SoftDeleteRepository.softDelete`).

---

## 2. Design Decisions

### 2.1 Namespace-Not-Class

Each repository is `export namespace {Entity}Repository { ... }` containing
`export const` arrow functions. No classes, no `this`, no instances.
**Rationale**: Matches Siraj convention (`StudentRepository`, `CreditRepository`,
`BillingRepository`). Tree-shakable, trivially mockable, no DI container needed.
Private helpers are named non-exported functions inside the namespace
(e.g., `acquireCertificateLock`, `mapCertificateToDto`).

### 2.2 `queryDb(tx)` for Reads; `tx ?? db` for Writes

**Rationale**: Reads can leverage the Neon HTTP fast path via
`getStatelessHttpDb()` when `tx` is absent (see `backend/db/drizzleDb.ts:58` and
`docs/drizzle/neon-http-client.md`). Writes must never use HTTP — they always
go to the pooled `db` or the supplied `tx`.

**Alternatives considered**:
- Single executor for all: rejected — would lose HTTP fast-path optimization
  on the read-heavy certificate list/verify paths.
- Always `tx ?? db` even for reads: rejected — HTTP fast path gives 30-50%
  latency reduction on serverless reads (see `neon-http-client.md`).

### 2.3 Prepared Statements — Scalar Lookups Only

Only `findById` (certificates, templates, categories) and `findByCode`
(verifications) are prepared. These are:
- Frequent (every public verification hit calls `findByCode`)
- Scalar (single `text` or `uuid` parameter)
- Not transactional in the hot path

All other queries are dynamic because they involve:
- `inArray` (prohibited in prepared statements — see `prepared-statements.md`)
- Dynamic WHERE clauses (filters, pagination)
- Writes
- Mandatory `tx` (audit, soft delete, version bump)

**Transaction fallback pattern**: each prepared-statement-backed method branches
on `tx` — prepared path when `!tx`, inline `tx.select()` when `tx` is provided.
This is the canonical pattern from `signedUrl.repository.ts:13-18` and
`prepared-statements.md`.

### 2.4 Soft Delete Reuse — Not Reimplementation

Certificates, templates, and categories are soft-deletable. The implementation
**delegates** to `SoftDeleteRepository.softDelete(input, tx?, locale?)` in `backend/db/repo/shared/soft-delete.repository.ts` — verified canonical pattern (the original plan invents a `softDelete.generic` name which DOES NOT exist; verified `backend/db/repo/shared/soft-delete.repository.ts:69: export const softDelete = async <T>(input: Types.SoftDeleteInput & { tableName: T }, tx?, locale?) => {...}`)
after registering each table in the `SOFT_DELETE_TABLES` map.

**Why not re-implement**: The generic helper already handles advisory locking,
session GUC (`app.soft_delete`), audit log emission, and the
`updatedAt`-exists check. Re-implementing would duplicate audited, security-sensitive
logic — a `backend/db/repo/AGENTS.md` violation.

**Why categories and not elements/variables**: Elements, variables, and
recipient-group items are child records of a parent (template or group). When the
parent is soft-deleted, children remain immutable (not deleted) so that audit
trail and restoration are possible. Hard delete of children is only done explicitly
by the service layer (e.g., "remove element" UI action).

### 2.5 Cursor Pagination on `(createdAt, id)`

Stable ordering via `(createdAt, id)` composite. Every soft-deletable cert table
has a composite index `index("..._pagination_idx").on(createdAt, id)` created in
Plan 1. The cursor is base64-encoded `{ createdAt, id }` — decoded for the WHERE
predicate and re-encoded for `startCursor` / `endCursor`.

**Why not offset-only**: Offset pagination degrades on large tables and doesn't
survive concurrent inserts (page drift). Cursor pagination on a unique composite
key is drift-free and matches the `StudentRepository.fetchWithFilters` pattern
(`student.repository.ts:18-80`).

**Total count via window function**: `sql<number>\`cast(count(*) over() as int\`` —
avoids a second `COUNT(*)` round trip. Mirrors `student.repository.ts:277`.

### 2.6 FTS via `fullTextSearch` Helper

Uses the existing `fullTextSearch(column, text, config='simple')` helper in
`backend/db/query.extensions.ts`. Config `'simple'` is preferred for mixed
Arabic/English content (no stemming, no stopword removal).

**Index backing**: GIN index on `to_tsvector('simple', column)` (Plan 1) backs
the FTS query. A GiST trigram index (`gist_trgm_ops`) on the same column backs
the `ilike` fallback for short tokens (`< 3 chars`) where `to_tsquery` is too
coarse.

**Why not `'arabic'` config**: PostgreSQL's built-in `'arabic'` FTS config uses
a stemmer that over-aggressively normalizes Arabic names. The `'simple'` config
preserves exact word boundaries while still supporting `&` conjunction and `:*`
prefix matching (see `query.extensions.ts:28-61`).

### 2.7 Idempotency Unique-Index Catch

Create operations catch the Postgres `23505` unique-violation error code and
translate it to a domain `tErrors.<conflictKey>(...)` message. The catch is
narrow — only on `db.insert(...).returning()` — and the error surface is
restricted to the known unique indexes for each table.

**Why not pre-check then insert**: Race condition between SELECT and INSERT.
The unique index is the authoritative constraint — let the DB reject, catch,
and translate. This is the same idiom used by `StudentRepository.create`
(`student.repository.ts:128-132`).

### 2.8 Map-to-DTO Separation

Each repository has a private `mapEntityToDto(row): {Entity}ReturnType` helper
inside the namespace. This:
- Flattens JSONB columns (`metadata`, `dimensions`, `fontSettings`)
- Resolves localized fields via `resolveLocalized` (`backend/db/repo/utils/resolve-localized.ts`)
- Coerces `null` to sensible defaults (e.g., `[]` for missing arrays)
- Decouples internal Drizzle row shape from public ReturnType

Public methods always return `{Entity}ReturnType`, never raw Drizzle inference.
This is a `backend/types/AGENTS.md` requirement — `ReturnType` is the canonical
service-layer contract.

---

## 3. Repository Interface Contracts

> All methods are arrow-function exports inside `export namespace {Entity}Repository { ... }`.
> `tx` is always optional: `tx?: DBTransaction`.
> `tErrors` is the bound translation object: **`tErrors: ErrorsLabels`** (verified at `@/shared/locale` import in `student.repository.ts:15`). There is no `{Entity}RepoErrors` per-entity type — all repos share the single aggregate `ErrorsLabels` (see §9.1).

### 3.1 `CertificateRepository`

**File**: `backend/db/repo/certificates/certificate.repository.ts`

| Method | Params | Return | Prepared? | Notes |
|---|---|---|---|---|
| `findById` | `id: string, tx?` | `Promise<CertificateReturnType \| null>` | YES (fallback on tx) | Filters `isNull(deletedAt)` |
| `findByVerificationCode` | `code: string, tx?` | `Promise<CertificateReturnType \| null>` | YES (fallback on tx) | Used by public verify path |
| `findMany` | `filters: CertificateFilters, paginationArgs: PaginationArgs, tErrors, tx?` | `Promise<{ items: CertificateReturnType[]; pageInfo: PageInfo; totalCount: number }>` | NO | Cursor pagination `(createdAt, id)`; FTS on `verificationCode` (recipient-name search requires a denormalized `recipientName` snapshot column — pending Plan 01 human decision; see section 7.1 note) |
| `create` | `input: CertificateCreateInput, tErrors, tx?` | `Promise<CertificateReturnType>` | NO | Catches `23505` on verification code + idempotency key |
| `update` | `id: string, patch: CertificateUpdateInput, tErrors, tx?` | `Promise<CertificateReturnType>` | NO | Rejects soft-deleted rows |
| `updateStatus` | `id: string, newStatus: CertificateStatus, expectedVersion: number, tErrors, tx?` | `Promise<CertificateReturnType>` | NO | Optimistic concurrency via version check |
| `softDelete` | `id: string, actorUserId: string, tErrors, tx?, locale?` | `Promise<{ entity: CertificateReturnType; deletedAt: Date }>` | NO | Delegates to `SoftDeleteRepository.softDelete` + audit |
| `exists` | `id: string, tx?` | `Promise<boolean>` | NO | Uses `q.$count()` |
| `count` | `filters: CertificateFilters, tx?` | `Promise<number>` | NO | Reuses filter builder from `findMany` |
| `loadByIds` | `ids: string[], tErrors, tx?` | `Promise<(CertificateReturnType \| Error)[]>` | NO | `inArray` — preserves order, `Error` for misses |

**Private helpers**:
- `acquireCertificateLock(tx, id): Promise<void>` — advisory xact lock
- `mapCertificateToDto(row): CertificateReturnType` — flattens + resolves localized
- `buildCertificateFilters(filters, tx?)` — dynamic where builder reused by `findMany` and `count`

**`CertificateFilters` shape** (type from `backend/types/certificates/certificate.types.ts`):
- `status?: CertificateStatus`
- `templateId?: string`
- `studentId?: string`
- `recipientNameSearch?: string`
- `search?: string`
- `dateFrom?: Date`
- `dateTo?: Date`

### 3.2 `TemplateRepository`

**File**: `backend/db/repo/certificates/template.repository.ts`

| Method | Params | Return | Prepared? | Notes |
|---|---|---|---|---|
| `findById` | `id: string, tx?` | `Promise<TemplateReturnType \| null>` | YES (fallback on tx) | Filters `isNull(deletedAt)` |
| `findMany` | `filters: TemplateFilters, paginationArgs: PaginationArgs, tErrors, tx?` | `Promise<PaginatedResult<TemplateReturnType>>` | NO | Cursor pagination; FTS on `name` |
| `create` | `input: TemplateCreateInput, tErrors, tx?` | `Promise<TemplateReturnType>` | NO | Catches `23505` on `(slug, version)` |
| `update` | `id: string, patch: TemplateUpdateInput, tErrors, tx?` | `Promise<TemplateReturnType>` | NO | Rejects soft-deleted; status guard at service level |
| `softDelete` | `id: string, actorUserId: string, tErrors, tx?, locale?` | `Promise<{ entity: TemplateReturnType; deletedAt: Date }>` | NO | Delegates to `SoftDeleteRepository.softDelete` + audit |
| `publishVersion` | `id: string, actorUserId: string, tErrors, tx?` | `Promise<TemplateReturnType>` | NO | Advisory lock → load draft → mutate status/version → audit log |
| `getVersionChain` | `slug: string, tx?` | `Promise<TemplateReturnType[]>` | NO | `where(eq(slug, ...))` ordered by `version DESC` |
| `cloneForVersioning` | `sourceId: string, newVersion: number, tx?` | `Promise<TemplateReturnType>` | NO | Copies scalar fields only; elements/variables handled by service via their repos |

**Private helpers**:
- `acquireTemplateLock(tx, id): Promise<void>` — `pg_advisory_xact_lock(hashtext('cert_template_' || id))`
- `mapTemplateToDto(row): TemplateReturnType` — resolves localized `name`/`description` via `resolveLocalized`

**`TemplateFilters` shape**:
- `status?: TemplateStatus`
- `categoryId?: string`
- `authorUserId?: string`
- `nameSearch?: string`
- `orientation?: TemplateOrientation`
- `dateFrom?: Date`
- `dateTo?: Date`

### 3.3 `TemplateElementRepository`

**File**: `backend/db/repo/certificates/template-element.repository.ts`

| Method | Params | Return | Prepared? | Notes |
|---|---|---|---|---|
| `findByTemplate` | `templateId: string, tx?` | `Promise<TemplateElementReturnType[]>` | NO | Ordered `zIndex ASC, createdAt ASC` |
| `create` | `input: TemplateElementCreateInput, tErrors, tx?` | `Promise<TemplateElementReturnType>` | NO | No unique index to catch |
| `update` | `id: string, patch: TemplateElementUpdateInput, tErrors, tx?` | `Promise<TemplateElementReturnType>` | NO | Hard entity — no `deletedAt` filter |
| `delete` | `id: string, tErrors, tx?` | `Promise<void>` | NO | Hard delete; throw `elementNotFound` on missing |
| `reorder` | `templateId: string, orderedIds: string[], tErrors, tx?` | `Promise<void>` | NO | Bulk `zIndex` updates within `tx ?? db.transaction` |
| `findByType` | `templateId: string, elementType: TemplateElementType, tx?` | `Promise<TemplateElementReturnType[]>` | NO | Used by QR gen + image publishing |

**Private helpers**: None — DTO mapping is trivial (columns are scalar).

### 3.4 `TemplateVariableRepository`

**File**: `backend/db/repo/certificates/template-variable.repository.ts`

| Method | Params | Return | Prepared? | Notes |
|---|---|---|---|---|
| `findByTemplate` | `templateId: string, tx?` | `Promise<TemplateVariableReturnType[]>` | NO | |
| `create` | `input: TemplateVariableCreateInput, tErrors, tx?` | `Promise<TemplateVariableReturnType>` | NO | Catches `23505` on `(key, templateId)` |
| `update` | `id: string, patch: TemplateVariableUpdateInput, tErrors, tx?` | `Promise<TemplateVariableReturnType>` | NO | |
| `delete` | `id: string, tErrors, tx?` | `Promise<void>` | NO | Hard delete |
| `findByType` | `templateId: string, variableType: TemplateVariableType, tx?` | `Promise<TemplateVariableReturnType[]>` | NO | |

**Private helpers**: None — DTO mapping is trivial.

### 3.5 `RecipientGroupRepository`

**File**: `backend/db/repo/certificates/recipient-group.repository.ts`

This repository spans three tables: `certificate_recipient_groups` (parent),
`certificate_recipient_group_items` (child), and
`recipient_group_item_variable_values` (grandchild). All methods that touch
multiple tables accept `tx?` and propagate it.

| Method | Params | Return | Prepared? | Notes |
|---|---|---|---|---|
| `create` | `input: RecipientGroupCreateInput, tErrors, tx?` | `Promise<RecipientGroupReturnType>` | NO | |
| `findById` | `id: string, tx?` | `Promise<RecipientGroupReturnType \| null>` | NO | Filters `isNull(deletedAt)` |
| `findMany` | `filters: RecipientGroupFilters, paginationArgs: PaginationArgs, tErrors, tx?` | `Promise<PaginatedResult<RecipientGroupReturnType>>` | NO | Filters: `templateId`, `nameSearch` |
| `update` | `id: string, patch: RecipientGroupUpdateInput, tErrors, tx?` | `Promise<RecipientGroupReturnType>` | NO | Rejects soft-deleted |
| `softDelete` | `id: string, actorUserId: string, tErrors, tx?, locale?` | `Promise<{ entity: RecipientGroupReturnType; deletedAt: Date }>` | NO | Delegates to `SoftDeleteRepository.softDelete` + audit |
| `findByTemplate` | `templateId: string, tx?` | `Promise<RecipientGroupReturnType[]>` | NO | |
| `findItems` | `groupId: string, filters: RecipientGroupItemFilters, paginationArgs: PaginationArgs, tErrors, tx?` | `Promise<PaginatedResult<RecipientGroupItemReturnType>>` | NO | Joins `students`; cursor `(createdAt, id)` on items |
| `addItem` | `input: RecipientGroupItemCreateInput, tErrors, tx?` | `Promise<RecipientGroupItemReturnType>` | NO | Catches `23505` on `(group_id, student_id)` |
| `removeItem` | `itemId: string, tErrors, tx?` | `Promise<void>` | NO | Hard delete junction row |
| `updateVariableValue` | `itemId: string, variableId: string, value: string, tErrors, tx?` | `Promise<RecipientGroupItemVariableValueReturnType>` | NO | `onConflictDoUpdate` on `(item_id, variable_id)` |
| `findByTemplateForGeneration` | `templateId: string, tx?` | `Promise<RecipientGroupWithItemsReturnType[]>` | NO | Relational query: groups → items → variableValues |

**Private helpers**:
- `mapRecipientGroupToDto(row): RecipientGroupReturnType`
- `mapRecipientGroupItemToDto(row): RecipientGroupItemReturnType` — joins `students.name`
- `buildRecipientGroupFilters(filters, tx?)` — dynamic where builder

### 3.6 `VerificationRepository`

**File**: `backend/db/repo/certificates/verification.repository.ts`

| Method | Params | Return | Prepared? | Notes |
|---|---|---|---|---|
| `create` | `input: VerificationCreateInput, tx?` | `Promise<VerificationReturnType>` | NO | Append-only — no `tErrors` param |
| `findByCertificate` | `certificateId: string, paginationArgs: PaginationArgs, tx?` | `Promise<PaginatedResult<VerificationReturnType>>` | NO | Ordered `createdAt DESC` |
| `findByCode` | `code: string, tx?` | `Promise<VerificationReturnType \| null>` | YES (fallback on tx) | Scalar lookup |
| `countVerifications` | `certificateId: string, tx?` | `Promise<number>` | NO | `Number(row?.count ?? 0)` |

**Private helpers**: None — columns are scalar.

### 3.7 `CertificateCategoryRepository`

**File**: `backend/db/repo/certificates/category.repository.ts`

| Method | Params | Return | Prepared? | Notes |
|---|---|---|---|---|
| `findById` | `id: string, tx?` | `Promise<CertificateCategoryReturnType \| null>` | YES (fallback on tx) | Filters `isNull(deletedAt)` |
| `create` | `input: CertificateCategoryCreateInput, tErrors, tx?` | `Promise<CertificateCategoryReturnType>` | NO | |
| `update` | `id: string, patch: CertificateCategoryUpdateInput, tErrors, tx?` | `Promise<CertificateCategoryReturnType>` | NO | Rejects soft-deleted |
| `softDelete` | `id: string, actorUserId: string, tErrors, tx?, locale?` | `Promise<{ entity: CertificateCategoryReturnType; deletedAt: Date }>` | NO | Pre-check: throw if has children or templates |
| `findTree` | `rootId: string \| null, tx?` | `Promise<CertificateCategoryTreeNode[]>` | NO | Recursive CTE via `sql` template |
| `reorder` | `siblings: { id: string; sortOrder: number }[], tx?` | `Promise<void>` | NO | Bulk update within `tx ?? db.transaction` |
| `findWithTemplateCount` | `parentId: string \| null, tx?` | `Promise<(CertificateCategoryReturnType & { templateCount: number })[]>` | NO | `leftJoin` + conditional aggregation |

**Private helpers**:
- `mapCategoryToDto(row): CertificateCategoryReturnType`
- `buildCategoryTreeQuery(rootId, tx?)` — raw `sql` recursive CTE

---

## 4. Prepared Statement Architecture

### 4.1 Declaration Site

Each prepared statement is declared at **module level** (above the namespace),
named `{method}Prepared`, and registered via `.prepare("snake_case_name")`.
The snake_case name is globally unique across the application.

| Prepared Statement | Registration Name | Table | Param |
|---|---|---|---|
| `findCertificateByIdPrepared` | `find_cert_by_id` | `certificates` | `id: uuid` |
| `findCertificateByCodePrepared` | `find_cert_by_code` | `certificates` | `verificationCode: text` |
| `findTemplateByIdPrepared` | `find_tpl_by_id` | `certificate_templates` | `id: uuid` |
| `findCategoryByIdPrepared` | `find_cert_cat_by_id` | `certificate_categories` | `id: uuid` |
| `findVerificationByCodePrepared` | `find_verification_by_code` | `certificate_verifications` | `code: text` |

### 4.2 Transaction Fallback Logic

Each prepared-statement-backed method follows this conditional structure:

| Condition | Path |
|---|---|
| `tx` is `undefined` | Execute the prepared statement via `.execute({ param })` |
| `tx` is provided | Build a regular `tx.select().from(table).where(eq(...))` inline — never invoke the prepared statement |

This branching is the canonical pattern from `signedUrl.repository.ts:34` and
`prepared-statements.md` §"Transaction Fallback".

### 4.3 Prohibitions

- No `inArray` in prepared statements (PG protocol limitation — see `prepared-statements.md`)
- No writes via prepared statement
- No `$count()` via prepared statement
- No `$dynamic()` or conditional where in prepared statement
- No mandatory-`tx` method backed by a prepared statement

---

## 5. Transaction Handling

### 5.1 Read Path

All read methods without a mandatory `tx` use `queryDb(tx)` — resolves to the
Neon HTTP client when no `tx` is present and the HTTP client is eligible, or
falls back to the pooled `db`.

### 5.2 Write Path

All write methods use `const executor = tx ?? db` — writes never use the HTTP
client because the HTTP client doesn't support mutations.

### 5.3 Transaction Propagation

When a repository method calls another repository method (e.g.,
`RecipientGroupRepository.addItem` might compose with
`updateVariableValue`), it **must pass `tx` through**. If `tx` is `undefined`,
the sub-call also receives `undefined` and runs against `db` independently.

### 5.4 Advisory Locks

Acquired inside a transaction via `pg_advisory_xact_lock(hashtext('namespace_' || entityId))`
before the read+write mutation sequence:

| Repository | Lock Key Prefix | Method |
|---|---|---|
| `CertificateRepository` | `'cert_'` | `softDelete`, `updateStatus` |
| `TemplateRepository` | `'cert_template_'` | `publishVersion`, `softDelete` |
| `CertificateCategoryRepository` | `'cert_cat_'` | `softDelete` |

Locks are scoped to the `tx` (advisory xact lock auto-releases on commit/rollback).

---

## 6. Soft Delete & Audit Integration

### 6.1 Registry Extension

The `SOFT_DELETE_TABLES` map in `backend/db/repo/shared/soft-delete.repository.ts`
is extended with:

| Key | Table Name | `entityType` (audit subject) |
|---|---|---|
| `certificates` | `certificates` | `'CERTIFICATE'` |
| `certificate_templates` | `certificate_templates` | `'TEMPLATE'` |
| `certificate_categories` | `certificate_categories` | `'CATEGORY'` |

Each entry is appended to the verified `SOFT_DELETE_TABLES` registry map (`backend/db/repo/shared/soft-delete.repository.ts:19-52` — a single `as const` object) so `SoftDeleteRepository.softDelete` knows which Drizzle table instance to update and what `entityType` string to record in the audit log. Pattern: `certificates: { table: certificates, entityType: "CERTIFICATE" as const }`.

> **REQUIRED PAIRING -- `Types.SoftDeletableTableName` union extension**: `SoftDeleteRepository.softDelete` is typed `<T extends Types.SoftDeletableTableName>` (`soft-delete.repository.ts:69`), where `Types.SoftDeletableTableName` is a string-literal union of *all* keys allowed in `SOFT_DELETE_TABLES`. Adding cert keys (`certificates`, `certificate_templates`, `certificate_categories`, `certificate_recipient_groups`) to the `SOFT_DELETE_TABLES` map **without** also extending the `Types.SoftDeletableTableName` union (and the `SoftDeletableEntityMap[T]` entity-type literals) will fail to compile (the generic `T` will not admit the new keys). Plan 02 owns the `backend/types` layer; Plan 03 must coordinate a matching `backend/types` extension task (add the 4 cert table names to the `SoftDeletableTableName` union + `SoftDeletableEntityMap` literals) — this is a hard cross-plan dependency. The `SOFT_DELETE_TABLES` `as const` map and the `SoftDeletableTableName` union must stay in lock-step on every addition.

### 6.2 Call Site Pattern

Each `softDelete` method is a thin delegate (verified against `SoftDeleteRepository.softDelete` signature at `soft-delete.repository.ts:69`):
1. Call `SoftDeleteRepository.softDelete(
     { tableName, entityId, actorUserId, description, metadata } satisfies Types.SoftDeleteInput & { tableName: T },
     tx,
     locale
   )` — note: `input` positionally first, then `tx`, then `locale`. The `tableName` MUST be one of the keys registered in `SOFT_DELETE_TABLES` (extended in this plan — see §6.1).
2. The shared helper acquires a `pg_advisory_xact_lock(hashtext('soft_delete_' || tableName || '_' || entityId))`, sets the `'app.soft_delete'` GUC, reads (with `isNull(deletedAt)`), throws `NotFoundError` if absent (using `getServerTranslations(locale ?? "en").errorsTranslations.file.recordNotFound(...)`), updates `deletedAt` + `updatedAt`, writes the audit log via `AuditRepository`, and returns `{ entity, deletedAt }`.
3. Map the returned entity through the entity's `mapEntityToDto` before returning to the caller.

### 6.3 Category Pre-Check

`CertificateCategoryRepository.softDelete` performs two existence checks **before**
calling `SoftDeleteRepository.softDelete`:
1. Any child categories with `parentId = thisId` and `isNull(deletedAt)` — throw
   `tErrors.categoryHasChildren(id)`
2. Any templates with `categoryId = thisId` and `isNull(deletedAt)` — throw
   `tErrors.categoryHasTemplates(id, count)`

These checks run inside the same `tx` as the soft delete, after acquiring the
advisory lock, to prevent concurrent inserts from invalidating the pre-check.

---

## 7. Full-Text Search Design

### 7.1 Helper Usage

The `fullTextSearch(column, text, config='simple')` helper in
`backend/db/query.extensions.ts` is called directly in the filter builder:

| Repository | Column | Config | Trigram Fallback Column |
|---|---|---|---|
| `TemplateRepository.findMany` | `certificate_templates.name` | `'simple'` | same, via `ilike` |
| `CertificateRepository.findMany` | `certificates.verificationCode` | `'simple'` | same, via `ilike` |

> **Column correction**: Plan 01 `certificates` has NO `recipientName` column (verified — the recipient is resolved via the `studentId`->`students` join; certificate FTS is on `verificationCode` per Plan 01 section 4.8 `cert_fts_idx`). Searching certificates by recipient name would require a **generated/denormalized** `recipientName text` column on `certificates` (filled at ISSUE time from `students.name`, frozen for the cert's lifetime) — Plan 01 SWE-Expert-Review notes this as a human decision: if "search certificates by recipient name" is a v1 requirement, Plan 01 should add a snapshot `recipientName text` column + a `cert_recipient_name_trgm_idx` GiST trigram index, and the row above would then switch to `certificates.recipientName`. The `recipientNameSearch` filter on `CertificateFilters` (section 4) is left as a placeholder for that future decision; until then backends reject it or alias it to a join-backed `ILIKE students.name` query (N+1-free via a single JOIN).

### 7.2 Trigram Fallback

For tokens shorter than 3 characters (where `to_tsquery` might return zero results
because it requires complete word tokens), the filter builder applies an
additional `ilike('%token%')` predicate backed by the GiST trigram index.

The decision is made at filter-build time based on `token.length < 3` — not
a runtime query fallback.

### 7.3 Index Backing

All FTS indexes (GIN on `to_tsvector`, GiST on `gist_trgm_ops`) are created in
Plan 1. The repository layer only writes the queries — never creates indexes.

---

## 8. Cursor Pagination Design

### 8.1 Cursor Format

Base64-encoded JSON `{ createdAt: string; id: string }`. Decoded via `JSON.parse(atob(cursor))`
and validated with `tErrors.invalidCursorPosition` on malformed input.

### 8.2 Where Predicate

For DESC ordering (default — newest first):
- `lt(createdAt, cursorDate)` OR
- `eq(createdAt, cursorDate) AND lt(id, cursorId)`

For ASC ordering (oldest first), mirror with `gt`.

This is the exact pattern from `StudentRepository._processStudentQuery`
(`student.repository.ts:18-80`).

### 8.3 Page Info Construction

`pageInfo` is built via `PaginationUtils.buildPageInfoFromArgs(paginationArgs, items)`:
- `hasNextPage`: `items.length === paginationArgs.first`
- `hasPreviousPage`: cursor is present
- `startCursor`: base64 of `{ createdAt, id }` from `items[0]`
- `endCursor`: base64 of `{ createdAt, id }` from `items[items.length - 1]`

### 8.4 Total Count

`totalCount` is computed via the window function
`sql<number>\`cast(count(*) over() as int)\`` attached as a column on each row.
After mapping items, the total is extracted from the first row: `Number(rows[0]?.totalCount ?? 0)`.

---

## 9. Error Handling Strategy

### 9.1 Translation Parameter Convention

Every repository method that can throw a business error accepts
**`tErrors: ErrorsLabels`** (imported from `@/shared/locale` — verified canonical pattern at `backend/db/repo/students/student.repository.ts:15: import type { ErrorsLabels } from "@/shared/locale";`) as a positional parameter before `tx`. There is NO per-domain `{Entity}RepoErrors` type in this codebase — all repositories reuse the **single aggregate `ErrorsLabels` interface** defined in `shared/locale/types/errors/index.ts` (~308 lines, with sub-interfaces per domain: `BillingErrors`, `StudentErrors`, etc., plus a flattened backward-compat section for legacy dot-path keys like `studentCreateFailed`).

> **Replacement for the original invented types**: the original plan proposed `tErrors: {Entity}RepoErrors` constructed via `getServerTranslations(locale, "certificates.errors.repo")` (a 2-arg form). **Reality-checked**: the backend `getServerTranslations(locale)` helper (1-arg, from `@/shared/locale`) returns a `{ errorsTranslations: ErrorsLabels }` object accessed by sub-namespace — e.g. `getServerTranslations(locale).errorsTranslations.certificate.<key>(args)` or the legacy flattened `getServerTranslations(locale).errorsTranslations.file.recordNotFound({ tableName, entityId })`. There is NO 2-arg namespace-id form for backend errors; the 2-arg `defineNamespace(id, config)` is the **client-side frontend `useTranslation` namespace system** (`shared/locale/namespaces/define-namespace.ts`), distinct from backend repo error binding.

The `tErrors` object is constructed by the service layer (Plan 4) as:
```ts
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale";

const tErrors: ErrorsLabels = getServerTranslations(locale).errorsTranslations;
// then:
CertificateRepository.create(input, tErrors, tx);
```
or pulled per-namespace for clarity:
```ts
const tErrors: ErrorsLabels = getServerTranslations(locale).errorsTranslations;
throw new Error(tErrors.certificate.certificateNotFound(id));
```
The certificate repository methods accept the **whole `ErrorsLabels`** object (so the same method can be reused across contexts and the type contract is uniform across all repos); they access the `certificate` sub-namespace at throw-time.

### 9.2 Error Types

| Error Class | Source | Usage |
|---|---|---|
| `NotFoundError` | `@/backend/lib` | Soft-delete missing record (thrown inside `SoftDeleteRepository.softDelete` via `getServerTranslations(locale ?? "en").errorsTranslations.file.recordNotFound(...)`) — verified at `soft-delete.repository.ts:86-90` |
| `Error(tErrors.<key>(args))` | inline | All other business errors (not found on update, conflict, version mismatch) |

### 9.3 Conflict Catch Pattern

Create methods wrap the `db.insert(...).returning()` call in a try/catch:

| Postgres SQLSTATE | Meaning | Translation Key |
|---|---|---|
| `23505` | unique_violation | Table-specific conflict key (e.g., `certificateVerificationCodeConflict`, `templateSlugVersionConflict`, `variableKeyConflict`, `studentAlreadyInGroup`) |

Any other SQLSTATE re-throws unchanged (unexpected DB error — should surface
for debugging, not be masked).

### 9.4 No Hardcoded Strings

No repository file contains a user-facing string literal. All error messages are
produced via `tErrors.certificate.<key>(args)` (or the `ErrorsLabels.flattened` legacy keys where applicable) — i.e. object-property function-call form, NOT 2-arg namespace-id form. The repository layer never calls
`getServerTranslations` itself for business errors — it receives the bound `tErrors: ErrorsLabels` from the caller (service layer, Plan 4). **Verified invariant**: `backend/db/repo/students/student.repository.ts` only calls `getServerTranslations` directly inside `loadByIds` (line 190) and the soft-delete helper (line 86), which operate without a service-supplied `tErrors` — repository `create`/`update` paths always receive `tErrors` positionally and never translate locally.

---

## 10. Barrel Structure

### 10.1 Sub-Directory Barrel

**File**: `backend/db/repo/certificates/index.ts`

Re-exports all seven repository namespaces:
- `CertificateRepository` from `./certificate.repository`
- `TemplateRepository` from `./template.repository`
- `TemplateElementRepository` from `./template-element.repository`
- `TemplateVariableRepository` from `./template-variable.repository`
- `RecipientGroupRepository` from `./recipient-group.repository`
- `VerificationRepository` from `./verification.repository`
- `CertificateCategoryRepository` from `./category.repository`

Also re-exports any type-only exports needed by callers (e.g.,
`CertificateFilters`, `TemplateFilters` — typed from `@/backend/types`).

### 10.2 Top-Level Barrel Extension

**File**: `backend/db/repo/index.ts`

Add: `export * from "./certificates"` — makes all cert
repositories importable as `import { CertificateRepository } from "@/backend/db/repo"`.

> **Reality-checked**: the verified `backend/db/repo/index.ts` barrel uses RELATIVE re-exports (e.g. `export * from "./audit"`, `export * from "./students"`), NOT `@/`-aliased paths — the line above originally proposed `@/backend/db/repo/certificates`, which would be inconsistent with every existing entry. Corrected to the canonical relative form.

---

## 11. i18n Design

### 11.1 Namespace Structure (REALITY-CHECKED)

The invented flat-file layout (`shared/locale/certificates.errors.repo.ts`, `shared/locale/en/certificates.errors.repo.ts`, `shared/locale/ar/certificates.errors.repo.ts`) does NOT exist in the codebase. **Backend errors** in this codebase are organized under a SINGLE aggregate — verified:

```
shared/locale/
├── types/errors/
│   └── index.ts        // Single `ErrorsLabels` aggregate (~308 lines). ADD a `CertificateErrors`
│                       //   interface + add `certificate: CertificateErrors` to the aggregate.
│                       //   Add a flattened backward-compat key (e.g. `certificateCreateFailed`)
│                       //   to the flattened `ErrorsLabels` section if needed.
├── en/errors/
│   └── index.ts        // Nested domain objects. ADD `certificate: { <key>: (...args) => string }` block.
└── ar/errors/
    └── index.ts        // Same shape as English. ADD `certificate: { ... }` block.
```

> This is the **backend repo errors binding** path (the `tErrors` parameter pattern). It is distinct from the **frontend i18n namespace** system (Plan 02 §6) which uses `defineNamespace` per-domain sub-directories under `shared/locale/{types,namespaces,en,ar}/certificates/`. Both layers are required; this Plan 03 only touches the **errors aggregate** (`shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`).

### 11.2 Type Schema Pattern (REALITY-CHECKED)

`ErrorsLabels` is a **single flattened interface** (verified at `shared/locale/types/errors/index.ts`). Each certificate error key is added as a function signature on a NEW `CertificateErrors` sub-interface, and the aggregate `ErrorsLabels` extends `CertificateErrors` (or composes via `certificate: CertificateErrors` — pick the same approach used by the existing `StudentErrors` / `BillingErrors` sub-interfaces). Key examples:
- `certificateNotFound: (id: string) => string`            → `CertificateErrors.certificateNotFound`
- `templateSlugVersionConflict: (slug: string, version: number) => string`
- `categoryHasTemplates: (id: string, count: number) => string`

For backward-compat with code that uses flattened keys (e.g. `tErrors.studentCreateFailed` — verified at `student.repository.ts:132,180`), also add the legacy flattened counterparts (`certificateCreateFailed`, `templateCreateFailed`, etc.) so existing patterns compose uniformly across repositories.

The aggregate `ErrorsLabels` (exported from `shared/locale/types/errors/index.ts`) IS the `tErrors` parameter type used across repository method signatures — verified at `student.repository.ts:105,155`. There is NO `{Entity}RepoErrors` per-domain type.

### 11.3 Arabic Pluralization

Arabic CLDR rules require six forms: zero, one, two, few, many, other. Only
`categoryHasTemplates` uses pluralization (based on `count`). All other keys are
interpolation-only (single form in both locales).

### 11.4 Bound `tErrors` Object

The service layer constructs `tErrors: ErrorsLabels` by calling the 1-arg
`getServerTranslations(locale)` helper (from `@/shared/locale`) and destructuring
its `.errorsTranslations` property — verified pattern at `backend/db/repo/students/student.repository.ts:17,190`:

```ts
const tErrors: ErrorsLabels = getServerTranslations(locale).errorsTranslations;
// pass tErrors positionally to any cert repo method:
await CertificateRepository.create(input, tErrors, tx);
```

This bound `ErrorsLabels` object is passed as a parameter to repository methods.
Repositories never construct translations themselves — they only invoke
`tErrors.certificate.<key>(args)` (or flattened `tErrors.<key>` on legacy aliases).
The only repositories that call `getServerTranslations` directly are helper paths
without a service-supplied `tErrors` — verified `student.repository.ts:190`
(`loadByIds`) and `soft-delete.repository.ts:86` (the shared soft-delete helper).

---

## 12. Data Model References

The following tables (all created in Plan 1) are accessed by this plan's repositories:

| Repository | Tables | Soft-Deletable? | FTS Index? | Cursor Pagination Index? |
|---|---|---|---|---|
| `CertificateRepository` | `certificates` | YES | YES (recipient name) | YES |
| `TemplateRepository` | `certificate_templates` | YES | YES (name) | YES |
| `TemplateElementRepository` | `certificate_template_elements` | NO | NO | NO |
| `TemplateVariableRepository` | `certificate_template_variables` | NO | NO | NO |
| `RecipientGroupRepository` | `certificate_recipient_groups`, `certificate_recipient_group_items`, `recipient_group_item_variable_values` | groups YES | YES (group name) | YES (groups + items) |
| `VerificationRepository` | `certificate_verifications` | NO (append-only) | NO | YES |
| `CertificateCategoryRepository` | `certificate_categories` | YES | NO | NO (tree query) |

---

## 13. AGENTS.md & Instruction File References

Files created/modified in this plan must comply with:

### 13.1 AGENTS.md Files

| File | Applies To |
|---|---|
| `AGENTS.md` (root) | All files — logging, path aliases, i18n, theme |
| `backend/db/repo/AGENTS.md` | All repository files — canonical repo rules |
| `shared/AGENTS.md` | `shared/locale/` files — i18n system rules |
| `backend/types/AGENTS.md` | If any type re-exports touch `backend/types/` |

### 13.2 Instruction Files

| File | Applies To |
|---|---|
| `.github/instructions/backend.instructions.md` | All `backend/**/*.ts` files |

### 13.3 Relevant Quality Commands

```bash
bun tsgo                    # Type check — safe for parallel
bun biome:check             # Format + lint — safe for parallel
bun run lint                # Lint queue client — safe for parallel (serialized behind queue server)
bun run scripts/health/sub-loop.ts <file> --lifecycle lint  # Per-file progressive verification
```

---

## 14. Outcome & Knowledge Transfer Protocol

### 14.1 Deviation Log

Any pattern deviation from `siraj_analysis/03-repository-patterns.md` discovered
during implementation SHALL be documented inline as a comment in the relevant
file AND logged to the session `todos` table with a `deviation` label.

### 14.2 Knowledge Artifacts for Plan 21

This plan produces the following knowledge that Plan 21 (Knowledge Propagation)
will incorporate into permanent documentation:

| Artifact | Target Location |
|---|---|
| Certificate repo namespace list | `docs/certificates/repository-patterns.md` (created in Plan 21) |
| Prepared statement registration names | `docs/certificates/repository-patterns.md` |
| Soft-delete registration entries | `docs/certificates/repository-patterns.md` |
| FTS config + trigram fallback strategy | `docs/certificates/repository-patterns.md` |
| i18n error keys for repo layer | `shared/locale/` type schema + en/ar implementations (done in this plan) |

### 14.3 Handoff to Plan 4 (Services)

The service layer (Plan 4) consumes the repositories via:
- Import from `@/backend/db/repo` (top-level barrel)
- Constructs `tErrors: ErrorsLabels` via `getServerTranslations(locale).errorsTranslations` (1-arg helper from `@/shared/locale`; verified pattern at `backend/db/repo/students/student.repository.ts:17` import + the bound-`tErrors` parameter at lines 105/155)
- Wraps multi-step operations in `db.transaction(runner)` and passes `tx` to each repo call
- Uses `loadByIds` for DataLoader (GraphQL resolver batching — Plan 5)

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Verified correct (no changes needed)
- **Repository file naming** — `backend/db/repo/certificates/{entity}.repository.ts` matches the verified per-entity repo pattern (`backend/db/repo/students/student.repository.ts`). ✓
- **`export namespace XxxRepository { export const findById = async (id): Promise<...> => {...} }`** pattern — verified at `student.repository.ts:82-95`. ✓
- **TX pattern (`const q = queryDb(tx)` for reads, `const executor = tx ?? db` for writes)** — verified at `student.repository.ts:91` (read) and `student.repository.ts:128` (write). ✓
- **Advisory lock pattern** `db.transaction(runner)` + `pg_advisory_xact_lock(hashtext('...'))` — verified at `student.repository.ts:86-88` and `soft-delete.repository.ts:60-63`. ✓
- **Cursor pagination index pattern** `(..._pagination_idx).on(createdAt, id)` — verified at `backend/db/schema/students/students.ts:88`. ✓
- **`NotFoundError` from `@/backend/lib`** — verified import at `soft-delete.repository.ts:15`, used at lines 87-90. ✓
- **`runInRollback` testing pattern** — verified at the root `AGENTS.md`. ✓
- **Cursor decoding pattern** in student repository (`Buffer.from(after, "base64")` + JSON parse) — verified at `student.repository.ts:29-31`. ✓
- **`backend/db/repo/certificates/`** directory path — matches verified `backend/db/repo/students/`, `backend/db/repo/audit/`, etc. ✓
- **Sub-directory barrel `backend/db/repo/certificates/index.ts`** exporting each `XxxRepository` namespace — matches verified `backend/db/repo/students/index.ts` pattern. ✓

### Corrections applied
1. **`softDelete.generic` → `SoftDeleteRepository.softDelete`** — the original plan invents a `softDelete.generic` name which does NOT exist. Verified canonical API: `backend/db/repo/shared/soft-delete.repository.ts:69: export const softDelete = async <T>(input: Types.SoftDeleteInput & { tableName: T }, tx?, locale?) => Promise<Types.SoftDeleteResult<...>>`. Every occurrence of `softDelete.generic` in design.md §6.1/§6.2/§6.3 and the method-table `Delegates to softDelete.generic` cells was replaced with the actual `SoftDeleteRepository.softDelete` call signature (input positionally first, then `tx`, then `locale`).
2. **`SOFT_DELETE_TABLES` registry extension** — clarified that new certificate entries (e.g. `certificates: { table: certificates, entityType: "CERTIFICATE" as const }`) are APPENDED to the verified top-level `SOFT_DELETE_TABLES` const map at `soft-delete.repository.ts:19-52` (NOT placed in a separate `ございました` file). The shared helper's generic `<T extends Types.SoftDeletableTableName>` requires the entry to be present in the map; the `Types.SoftDeletableTableName` union must also be extended in `backend/types` (Plan 02 / type layer) for type-safety.
3. **`tErrors: {Entity}RepoErrors` → `tErrors: ErrorsLabels`** — the original invented a per-entity translator type. Verified reality: every repository in this codebase reuses the single aggregate `ErrorsLabels` interface (`student.repository.ts:15: import type { ErrorsLabels } from "@/shared/locale"`; params at `student.repository.ts:105,155: tErrors: ErrorsLabels`). The aggregate is defined at `shared/locale/types/errors/index.ts` (~308 lines, with sub-interfaces `StudentErrors`, `BillingErrors`, etc., and a flattened backward-compat section). All `tErrors: {Entity}RepoErrors` signatures in §3.x method tables and §9.x were switched to `tErrors: ErrorsLabels`; §9.1 / §11.1-11.4 prose rewritten to document the real binding mechanism.
4. **`getServerTranslations(locale, "certificates.errors.repo")` (2-arg, namespace-id) → `getServerTranslations(locale).errorsTranslations` (1-arg)** — the original conflated the backend errors helper with the frontend namespace system. Verified: backend `getServerTranslations(locale)` (from `@/shared/locale`, 1-arg) returns `{ errorsTranslations: ErrorsLabels }` accessed by sub-namespace — used directly in `student.repository.ts:190` (`getServerTranslations(locale ?? "en").errorsTranslations.student.studentNotFound(id)`) and `soft-delete.repository.ts:86` (`getServerTranslations(locale ?? "en").errorsTranslations.file.recordNotFound(...)`). The 2-arg `defineNamespace(id, config)` pattern belongs to the CLIENT-side `useTranslation` namespace system at `shared/locale/namespaces/define-namespace.ts` (used by frontend `useAppTranslation`, not by backend repos). §9.1 / §11.1-11.4 and the §14 handoff to Plan 4 were all corrected.
5. **i18n file paths invented (`shared/locale/certificates.errors.repo.ts`, `shared/locale/en/certificates.errors.repo.ts`, `shared/locale/ar/certificates.errors.repo.ts`) → EXTEND existing aggregate files** — the original invented flat per-domain i18n files. Verified actual structure: backend errors use a SINGLE aggregate. The corrected instructions in §11: ADD a new `CertificateRepoErrors` sub-interface + `certificate: CertificateRepoErrors` to `ErrorsLabels` in `shared/locale/types/errors/index.ts`; ADD a nested `certificate: {...}` block to `shared/locale/en/errors/index.ts` and `shared/locale/ar/errors/index.ts` (verified single-file English / Arabic errors impls with domain-nested objects). The flat per-domain `shared/locale/<prefix>.<sub>.ts` scheme proposed by the original does NOT exist anywhere in `shared/locale/`.
6. **§6.1 / §6.2 explicit directional clarity** — added the verified `satisfies Types.SoftDeleteInput & { tableName: T }` constraint to the call-site pattern and the audit-via-`AuditRepository` note; clarified that `NotFound` is thrown from inside the shared helper (verified `soft-delete.repository.ts:86-90`), not by the repo method.

### Caveats / things to keep an eye on during execution
- **`SoftDeletableTableName` union extension** — Plan 03's `SOFT_DELETE_TABLES` registry additions must be paired with a corresponding extension to the `Types.SoftDeletableTableName` TypeScript union (Plan 02 owns that). Ensure the new entries (`certificates`, `certificate_templates`, `certificate_categories` — and possibly `certificate_recipient_groups` if soft-deletable) are added there before Plan 03's repos compile. The corrected design notes this dependency explicitly. The `SoftDeletableEntityMap[T]` mapping also needs the corresponding entity types.
- **`Backend/types.py` mismatch** — verify `atypes compared to billing's `InvoiceReturnType`): if Plan 02 corrected them to `CertificateReturnType` and `CertificateTemplateReturnType`/`CertificateCategoryReturnType`, Plan 03's repo signatures must use the SAME names. Cross-check with Plan 02 design.md §3.1-3.6 ReturnType column.
- **The 23505 unique-violation catch pattern** Plan 03 §9.3 describes ("Create methods wrap the `db.insert(...).returning()` call in a try/catch") was not visible in the student.repository.ts `StudentRepository.create` quick read (which catches and rethrows a generic `tErrors.studentCreateFailed` — `student.repository.ts:131-133`) — the student `create` does NOT inspect `error.code === "23505"`. Recommend verifying whether the codebase pattern for SQLSTATE inspection lives elsewhere (e.g. billing `InvoiceRepository.create`) before implementing conflict-specific translation keys. The §9.3 design is reasonable but should be confirmed against an actual codebase pattern in a billing/BookRepository during execution.

### Verified reference files (read-only)
- `backend/db/repo/shared/soft-delete.repository.ts` (`SoftDeleteRepository.softDelete` signature, `SOFT_DELETE_TABLES` registry, advisory lock + GUC pattern).
- `backend/db/repo/students/student.repository.ts` (`ErrorsLabels` import + positional `tErrors` parameter; `queryDb(tx)` read pattern; `executor = tx ?? db` write pattern; `loadByIds` direct `getServerTranslations(locale)` access).
- `backend/db/repo/shared/signedUrl.repository.ts` (module-level prepared statement + tx branch pattern).
- `shared/locale/types/errors/index.ts` (single `ErrorsLabels` aggregate, sub-domain interfaces).
- `shared/locale/en/errors/index.ts` (nested domain-object English impl).
- `shared/locale/namespaces/define-namespace.ts` (CLIENT-side 2-arg namespace registration — distinct from backend `ErrorsLabels`).
- `backend/db/repo/AGENTS.md` (existing repository rules).

---

## SWE Expert Review Notes

### Issues found and fixed (this pass) — Plan 03 was the most pre-corrected plan; remaining fixes were surgical

1. **[HIGH — Scope typo]** requirements §1.3 scope table read "trigram GiSTConsumption" (a stray token from a text-merge artifact). **Fixed** to "trigram GiST (`gist_trgm_ops` `ilike` fallback)" matching the verified `gist_trgm_ops` operator used by `backend/db/query.extensions.ts`'s trigram fallback.
2. **[HIGH — Nonexistent FTS column]** §7.1 FTS table routed `CertificateRepository.findMany` FTS through `certificates.recipientName`; §4 Filter shape exposed `recipientNameSearch`. Plan 01 `certificates` has **NO** `recipientName` column (verified — the recipient is resolved via `studentId`→`students` join; Plan 01 §4.8 `cert_fts_idx` is on `to_tsvector(verificationCode)`). **Fixed**: FTS channel for certificates is now `certificates.verificationCode` (the column Plan 01 actually indexes); `recipientNameSearch` is recategorized as a future-decision placeholder — implementations either join to `students.name` (`ILIKE`, N+1-free via single JOIN) OR require Plan 01 to add a frozen `recipientName text` snapshot column (see Plan 01 SWE notes — human decision).
3. **[HIGH — Barrel import style]** §10.2 said `export * from "@/backend/db/repo/certificates"` — but the verified `backend/db/repo/index.ts` barrel **only** uses RELATIVE re-exports (`export * from "./audit"`, `export * from "./students"`); `@/`-aliased re-exports appear in ZERO existing barrel entries. **Fixed** to `export * from "./certificates"` (relative form). Keeps the barrel consistent and avoids the lint rule that flags mixed path styles.
4. **[HIGH — SoftDeletableTableName type union dependency]** Plan 03 extends `SOFT_DELETE_TABLES` (`soft-delete.repository.ts:19-52`) with 4 cert tables (`certificates`, `certificate_templates`, `certificate_categories`, `certificate_recipient_groups`), but `SoftDeleteRepository.softDelete<T extends Types.SoftDeletableTableName>` (`soft-delete.repository.ts:69`) admits only the keys of the `Types.SoftDeletableTableName` string-literal union (maintained in the type layer, owned by Plan 02). Appending to the map **without** extending the union would fail to compile (generic `T` rejects the new keys). **Fixed**: added an explicit "REQUIRED PAIRING" note in the soft-delete section calling out the hard cross-plan dependency (Plan 02 must add the 4 cert table names to the `SoftDeletableTableName` union + `SoftDeletableEntityMap[T]` literals in lock-step with Plan 03's `SOFT_DELETE_TABLES` additions).
5. **[MEDIUM — `getVersionChain(slug)` now valid]** REQ-TPL-001 / REQ-TPL-008 previously referenced a `slug` column that did NOT exist in Plan 01's original schema. **Now resolved upstream**: Plan 01 added `slug text NOT NULL` + `tpl_slug_version_unique` index on `certificate_templates`, so `getVersionChain(slug)` (the version chain by stable identifier) and the `(slug, version)` conflict catch are wired against a real column. No Plan 03 edit was needed beyond confirming the dependency is met.

### Reality-check mismatches corrected
- `backend/db/repo/index.ts` barrel uses RELATIVE exports — §10.2 corrected to `./certificates`.
- `backend/db/repo/shared/soft-delete.repository.ts:69` signature `softDelete(input, tx?, locale?)` + the generic `<T extends Types.SoftDeletableTableName>` — verified; the union/map lock-step rule is now explicit.
- `backend/db/query.extensions.ts` `fullTextSearch(column, text, config='simple')` + `queryWithPagination` + `pg_trgm` already enabled in `1-extensions.sql` — verified; §7.1 Hadjiarn correctly notes Plan 1 owns the indexes and Plan 3 only writes queries.
- `getServerTranslations(locale)` is 1-arg at `shared/locale/server-graphql.ts:3` returning `{ errorsTranslations: ErrorsLabels }` — Plan 03 already self-corrected its repo `tErrors` wiring; no further change needed.

### Architectural concerns (remaining, flagged for human review)
- **`defineRelations` relational-query API compatibility**: REQ-GRP-006 uses `q.query.certificateRecipientGroups.findMany({ with: { items: { with: { variableValues: true } } } })` — the Drizzle relational query API. Plan 01 corrected the relations registry to the `defineRelations(schema, r => ({...}))` graph (exported as `relations` from `backend/db/drizzleRelations.ts`). The `defineRelations` object IS the query-API relations source — its `with:` paths reference the relation keys (`items`, `variableValues`, `student`) registered in `defineRelations`. **Flagged**: confirm the relation key names registered in Plan 01's `defineRelations` block (`items`, `variableValues`, `student`, `template`...) match exactly the `with:` paths used in Plan 03's repository queries; mismatched keys throw a runtime error, not a compile error.
- **Prepared statement scope**: Plan 03 correctly limits prepared statements to single-row `findById`-style reads (verified AGENTS.md rule). `getVersionChain`, `loadByIds` (inArray), and `findMany` MUST stay dynamic statements. **Flagged**: ensure the lint/CI check `no-prepared-statement-for-lists` (equivalent) catches accidental `prepare()` on list-returning methods.
- **Idempotency-key race**: `cert_idempotency_key_unique` (Plan 01) uses `NULLS NOT DISTINCT`. The repo's `create` MUST do `INSERT ... ON CONFLICT (idempotencyKey) DO NOTHING` and then re-fetch by `(templateId, studentId, idempotencyKey)` to return the original certificate — a simple `DO NOTHING` returning nothing leaves the caller without a handle. **Flagged**: confirm the create-with-idempotency-key flow returns the existing row on conflict (not `undefined`).
- **Arabic FTS**: PG's `'simple'` config tokenizes Arabic as-is (no stemming, normalized); `'arabic'` config exists but uses a snowball stemmer that may over-stem proper names. Plan 03 correctly keeps `'simple'` + GiST trigram `ilike` fallback. **Flagged**: for recipient-name search (if Plan 01 adds the snapshot column), benchmark `ilike` trigram vs `'arabic'` config on representative Arabic names before v1 sign-off.
- **Soft-delete scope asymmetry**: Plan 01 marks `certificate_categories`, `certificate_templates`, `certificate_recipient_groups`, `certificates` as soft-deletable (4 tables). Plan 03 must add exactly these 4 to `SOFT_DELETE_TABLES` + the union — NOT the cascade-deleted children (`certificate_template_elements`, `certificate_recipient_group_items`, etc.) which hard-delete with their parent.

### Remaining risks flagged for human review
1. **`SoftDeletableEntityMap[T]` literals** — the map's `entityType` string values (`"CERTIFICATE" as const`, `"CERTIFICATE_TEMPLATE" as const`, ...) MUST match what the audit-log consumer (Plan 22 cron cleanup?) expects. Standardize the enum-valued strings with Plan 22.
2. **`recipientName` snapshot column decision** (cross-plan with Plan 01) — confirm before v1 whether search-by-recipient-name is required; drives a Plan 01 schema addition + a Plan 03 FTS-channel switch.
3. **Audit-log ownership**: certificate soft-deletes write an audit row via the `app.soft_delete` GUC + `entityType`. Confirm the audit-log table/insert lives in Plan 03's repo call or a shared post-soft-delete hook, and that the certificate feature's audit entries land in the same audit table as other domains.

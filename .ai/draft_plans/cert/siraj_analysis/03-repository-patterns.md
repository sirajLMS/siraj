# Siraj Repository Layer Analysis — `backend/db/repo/`

> Analysis for certificate feature integration. Documents the canonical data-access layer patterns used across the codebase.
> All file paths are absolute under `/home/ahmed/Projects/siraj-cert/`.

---

## 1. Repository Pattern

### 1.1 Source of truth
- `backend/db/repo/AGENTS.md` is the canonical rules document. Key rules:
  - Repositories are the **only** layer that touches the DB directly — no business logic, no permission checks (those live in `backend/services/`).
  - One `export namespace {Entity}Repository { ... }` per `.repository.ts` file (line 54–55, 60).
  - File naming: `backend/db/repo/<subdir>/<entity>.repository.ts`.
  - Types come from `backend/types/<subdir>/<entity>.types.ts` (`$inferSelect` / `$inferInsert` with custom transforms), not directly from schema.
  - No hardcoded error strings — use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale` (AGENTS.md line 42); legacy `getBackendTranslations` is deprecated.
  - Conditional aggregation uses `sql<number>\`...\`` template with `.mapWith(Number)`; avoid DB-specific casts like `CAST(... AS INT)`.

### 1.2 Structure: namespaces of exported arrow functions
Repositories are **not classes**. Each file exports a single `namespace` containing `export const` arrow-function methods plus private helper functions (named, non-exported functions inside the namespace).

Example — `backend/db/repo/students/student.repository.ts`:
```ts
// private helper inside namespace
async function acquireStudentLock(tx: DBTransaction, studentId: string): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('student_' || ${studentId}::text))`);
}

export namespace StudentRepository {
  export const findById = async (id: string): Promise<Types.StudentEntity | null | undefined> => {
    const q = queryDb();
    return await q.query.students.findFirst({ where: { id: id } });
  };

  export const create = async (input: Types.StudentCreateInput, tErrors: ErrorsLabels, tx?: DBTransaction) => { ... };
}
```
- `backend/db/repo/billing/credit.repository.ts` — same namespace pattern (`export namespace CreditRepository { ... }`).
- `backend/db/repo/shared/soft-delete.repository.ts` — namespace with a generic `softDelete<T>` plus typed wrappers (`softDeleteUser`, `softDeleteInvoice`, etc.).

### 1.3 The `tx` parameter pattern — transaction propagation
- The optional transaction parameter is typed `tx?: DBTransaction`.
- `DBTransaction` is derived from Drizzle's transaction callback type — `backend/db/db.types.ts`:
  ```ts
  export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
  ```
- Two executor-resolution idioms appear:

  **(a) `queryDb(tx)` — preferred for reads** (see `backend/db/drizzleDb.ts:58`):
  ```ts
  export function queryDb<T = undefined>(tx?: T) {
    if (tx !== undefined) return tx as ...;          // transaction path
    return (getStatelessHttpDb() ?? db) as never;     // HTTP-fast path or pooled db
  }
  ```
  `queryDb()` returns the Neon-HTTP DB singleton when no `tx` is passed and Neon HTTP is eligible; otherwise falls back to the pooled `db`. Used pervasively:
  - `StudentRepository.findById`, `getStudentIdByUserId`, `loadByIds`, `existsById`, `countAllStudents` (`student.repository.ts:91,98,188,199,208`).
  - `StorageDbRepository.getFilesForParent`, `getFilesForInvoice` (`storage.repository.ts:641,673`).
  - `CreditRepository.getTransactions`, `countTransactions`, `aggregateBalanceFromLedger` (`credit.repository.ts:42,56,168`).

  **(b) `const executor = tx ?? db;` — for writes** (no HTTP fast path; writes always go to pooled `db` or the supplied `tx`):
  - `StudentRepository.create` (`student.repository.ts:128`).
  - `StorageDbRepository.linkFileToParent`, `linkFileToInvoice` (`storage.repository.ts:710,732`).

- Some repositories use `ReadExecutor = DBTransaction | typeof db` to allow either type (`credit.repository.ts:11`), with overloaded positional signatures that auto-detect string-vs-object first args.

### 1.4 Prepared statements
- Canonical reference: `docs/drizzle/prepared-statements.md`. Defined at **module level** before the namespace, named `{method}Prepared` with `.prepare("snake_case_name")`.
- Transaction fallback pattern (CRITICAL): prepared statements are bound to the global `db` session and **cannot** run inside `db.transaction(tx)`. Methods must branch:
  ```ts
  const findByIdPrepared = db.select().from(users)
    .where(eq(users.id, sql.placeholder("id"))).limit(1).prepare("find_user_by_id");

  export const findById = async (id: string, tx?: DBTransaction) => {
    if (!tx) {
      const result = await findByIdPrepared.execute({ id });
      return result[0] ?? null;
    }
    // fall back to regular query for transactions
    const [row] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  };
  ```
- Example in repo: `backend/db/repo/shared/signedUrl.repository.ts:13-18` — `findSignedUrlByIdPrepared`, used by `getSignedUrlById` (line 34).
- **Prohibitions** (prepared-statements.md §"What NOT to Prepare"):
  - **`inArray` + prepared statements PROHIBITED** — PG protocol treats `$1` as a single scalar, cannot expand arrays for `IN`. Use dynamic `db.select()...where(inArray(col, ids))` instead.
  - No writes (insert/update/delete/upsert), no mandatory-`tx` methods, no dynamic WHERE clauses, no `$count()`, no `$dynamic()`, no raw `sql` template aggregates, no correlated sub-selects.
- Rollout status: 10 repos, 24 prepared statements (users, teachers, books, billing/credit, parents, complaints, session-config, signedUrl, timezone, fx-sync).

### 1.5 Query building
Three styles, all via Drizzle ORM (no raw SQL for the common case):
- **Drizzle query builder (relational)**: `q.query.students.findFirst({ where: { id } })` (`student.repository.ts:92`). Requires `relations` (see `backend/db/drizzleRelations.ts`, exported via `drizzleDb.ts`).
- **Drizzle select builder**: `db.select({...}).from(t).leftJoin(...).where(...).orderBy(...)` — dominant style. Composable with `.$dynamic()` for conditional chaining.
  - `student.repository.ts:273` — `fetchWithFilters` builds with `.$dynamic()` then passes to `_processStudentQuery`.
  - `credit.repository.ts:43` — `.$dynamic()` chained with `queryWithPagination`.
- **Raw `sql\`...\` template**: reserved for things Drizzle can't express.
  - Advisory locks: `sql\`SELECT pg_advisory_xact_lock(hashtext('invoice_' || ${id}::text))\`` (`billing.repository.ts:28`, `soft-delete.repository.ts:61`, `student.repository.ts:87`).
  - Conditional aggregation / window functions: `sql<number>\`cast(count(*) over() as int)\`` (`student.repository.ts:277`), `sql<number>\`COALESCE(SUM(CASE WHEN ... ELSE 0 END), 0)::int\`` (`credit.repository.ts:171-173`).
  - UNION ALL existence checks: `db.execute(sql\`SELECT 1 FROM ( ... UNION ALL ... ) sub LIMIT 1\`)` (`storage.repository.ts:333`).

### 1.6 Error handling
- **Domain errors via translated strings**: callers pass `tErrors: ErrorsLabels` into repo methods; repos `throw new Error(tErrors.<key>(...))`. Example: `StudentRepository.create` throws `tErrors.studentCreateFailed` (`student.repository.ts:132`); `partiallyUpdate` throws `tErrors.studentNotFound(id)` (line 231); `BillingRepository.getExistingInvoiceOrThrow` throws `tErrors.billing.invoiceNotFound(id)` (`billing.repository.ts:45`) using `acquireInvoiceLock` first.
- **`NotFoundError`** typed error from `@/backend/lib` for not-found cases with structured params — `SoftDeleteRepository.softDelete` (`soft-delete.repository.ts:87-90`):
  ```ts
  throw new NotFoundError(input.tableName.toUpperCase(), file.recordNotFound({ tableName, entityId }));
  ```
- **Soft failure booleans / result objects**: storage repo catches errors and returns `false` / `{ success: false, message }` instead of throwing — `deleteFile` returns `false` on error (`storage.repository.ts:72`), `registerFileUsage` returns `FileOperationResult` (line 350).
- Idempotency: financial mutations use deterministic idempotency keys — `CreditRepository.generateIdempotencyKey` (`credit.repository.ts:182`) is sha256-based, warned against using random UUIDs (which would break dedup).
- Optimistic concurrency: `StudentRepository.adjustClasses` checks `current.version !== expectedVersion` and throws `tErrors.studentVersionMismatch` (`student.repository.ts:299`), then bumps `version: sql\`${students.version} + 1\``.

### 1.7 Return types
- Single-record lookups: `Promise<T | null | undefined>` or `Promise<T | null>`. `?? null` / `?? undefined` from `[0]` destructure.
- Lists: `Promise<T[]>` (often typed as `XxxSelectType` from `backend/types`).
- Batch lookups for DataLoader: return `Promise<T[]>` or `(T | Error)[]` — `StudentRepository.loadByIds` returns `(Types.Student | Error)[]`, mapping requested ids to `new Error(studentNotFound(id))` for misses (`student.repository.ts:186-196`).
- Aggregate: `Promise<{ count: number }>` or numeric `Promise<number>` (via `Number(row?.count ?? 0)`).
- Soft-delete returns a typed `SoftDeleteResult<SoftDeletableEntityMap[T]>` = `{ entity, deletedAt }` (`soft-delete.repository.ts:73`).

---

## 2. Repository Index (`backend/db/repo/index.ts`)

- Top-level barrel re-exports every sub-directory's namespace (or directly from `*.repository.ts` files). Pattern:
  ```ts
  export { AuditRepository } from "@/backend/db/repo/audit";
  export { BookRepository } from "@/backend/db/repo/books/book.repository";
  export { ReportGroupingMode, ReportRepository } from "@/backend/db/repo/books/report.repository";
  export type { PendingReviewFilters } from "@/backend/db/repo/classes/lesson-report.repository";
  export type { UserReturnType, UserSelectType } from "@/backend/types";
  ```
- Import convention (AGENTS.md §"Import Convention"): consumers import from the top-level barrel `import { TeacherRepository } from "@/backend/db/repo"` (alias `@/backend/db/repo`); deep imports `@/backend/db/repo/teachers/teacher.repository` are also valid.
- Each sub-directory has its own `index.ts` barrel re-exporting its `*.repository.ts` files (e.g. `backend/db/repo/storage/index.ts` re-exports `LearningResourceRepository`, `SiteContentRepository`, `StorageDbRepository`).
- The whole `backend/db/repo` barrel is also re-exported from `backend/db/index.ts` via `export * from "@/backend/db/repo"`, so `@/backend/db` is the superset entry point.
- Some types/enums leak through the barrel (e.g. `ReportGroupingMode` enum, `UserReturnType`, `UserSelectType`, `PendingReviewFilters`).

---

## 3. Utils (`backend/db/repo/utils/`)

Only one file: `backend/db/repo/utils/resolve-localized.ts`. Provides four helpers for localized JSONB (`LocalizedString` map):

| Function | Purpose |
|---|---|
| `resolveLocalized(map, locale?)` | Resolve a localized map to one string with fallback chain: requested locale → default `ar` → first available → `""`. Used to flatten i18n columns into display strings. |
| `setLocalized(existing, locale, value)` | Merge a single-locale value into an existing localized map (immutable spread). |
| `localeJsonKey(locale?)` | Returns a normalized locale string safe for jsonb `->>` extraction. |
| `omitEmptyLocalized(map)` | Drops entries whose value is empty/whitespace; mirrors frontend `omitEmptyLocalizedString`. |

Other repo-internal helpers live as **non-exported functions inside namespaces** (e.g. `acquireStudentLock`, `adjustClasses`, `acquireSoftDeleteLock`, `performJunctionInsert`, `mapRowToUsage`). The `utils/` dir is intentionally small; cross-cutting DB utilities used by repos live in `backend/utils/` (e.g. `student.filterUtils.ts`, `escapeLikeWildcards` in `backend/utils/db.utils.ts`).

---

## 4. Transaction Management

- **Type**: `DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]` (`backend/db/db.types.ts:3`) — derived from Drizzle's `db.transaction(async tx => ...)` callback signature so both neon-serverless and node-postgres `db` instances satisfy it.
- **Creation**: `db.transaction(runner)` where `runner: (t: DBTransaction) => Promise<T>`. The canonical reuse helper appears in `backend/db/repo/audit/audit.repository.ts:12`:
  ```ts
  async function runInTransaction<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
    return tx ? await fn(tx) : await db.transaction((t: DBTransaction) => fn(t));
  }
  ```
- Equivalent inline variant (e.g. `soft-delete.repository.ts:131`, `group-class.repository.ts:30-35`): `return tx ? runner(tx) : db.transaction(runner);`. The reusable `insertReturning` helper in `group-class.repository.ts:25-35` is a generic example for write-through-transaction patterns.
- **No** `runInRollback` / `withTransaction` abstraction wrapper — the pattern is the inline ternary or the local `runInTransaction` helper per repo.
- **Advisory locks** are acquired *inside* the transaction via `pg_advisory_xact_lock(hashtext('...'))` before reading + mutating to serialize per-entity writes:
  - `acquireInvoiceLock` (`billing.repository.ts:27`).
  - `acquireStudentLock` (`student.repository.ts:86`).
  - `acquireSoftDeleteLock` (`soft-delete.repository.ts:55`).
- **Row-level locking** with `SELECT ... FOR UPDATE SKIP LOCKED` for atomic claims — `SignedUrlRepository.claimSignedUrl` uses `.for("update", { skipLocked: true })` inside `db.transaction` (`signedUrl.repository.ts:49-73`).
- **Session config** for soft-delete scope: `enableSoftDeleteSession` runs `SELECT set_config('app.soft_delete', 'true', true)` inside the tx so FK delete triggers can branch (`soft-delete.repository.ts:65`).

---

## 5. Pagination & Sorting

- **Helpers** in `backend/db/query.extensions.ts`:
  - `queryWithPagination(qb, args?)` — applies `.limit(args.perPage).offset(args.offset)` (offset-based) when `args` present; returns `qb` unchanged otherwise.
  - `fullTextSearch(column, text, config='simple')` — see §7.
- **Offset-based** style (most common): build base query with `.$dynamic()`, then `queryWithPagination(baseQuery, paginationArgs)`. Used by `CreditRepository.getTransactions` (`credit.repository.ts:49`).
- **Cursor-based (Relay-style)** for filtered lists with stable ordering on `(createdAt, id)`:
  - `StudentRepository.fetchWithFilters` → `_processStudentQuery` (`student.repository.ts:18-80`):
    - Decodes base64 cursor `paginationArgs.after` into `{ createdAt, id }`.
    - Builds WHERE with `or(lt(createdAt, cursorDate), and(eq(createdAt, cursorDate), lt(id, cursorId)))` for DESC (mirror with `gt` for ASC).
    - Computes total via `sql<number>\`cast(count(*) over() as int)\`` as a window column on each row (`student.repository.ts:277`).
    - Builds `pageInfo` with `PaginationUtils.buildPageInfoFromArgs` and re-encodes `startCursor`/`endCursor` from first/last item timestamps.
- **Sorting** is delegated to dedicated filter/order util classes under `backend/utils/` (e.g. `StudentFilterUtils.applyFilters(qb, filters)` and `StudentFilterUtils.applyOrdering(qb, orderBy)` at `student.repository.ts:25-26`). `orderBy` is an array of `{ column, order }` clauses using `OrderSortDirection` enum.
- **Counties**: `q.$count(table, where)` for cheap existence/total checks — `StudentRepository.existsById`, `countAllStudents` (`student.repository.ts:200,210`). Note: `$count` cannot be prepared.
- **Composite indexes** support the common sort/cursor path: e.g. `index("students_pagination_idx").on(table.createdAt, table.id)` (`backend/db/schema/students/students.ts:88`).

---

## 6. Soft Deletes

- Yes — `deletedAt` timestamp column on multiple tables. Reads filter with `isNull(t.deletedAt)` (e.g. `billing.repository.ts:42`, `learning-resource.repository.ts:53`).
- **Centralized** implementation: `backend/db/repo/shared/soft-delete.repository.ts`.
- **Registry** of soft-deletable tables (`SOFT_DELETE_TABLES`, `soft-delete.repository.ts:19-52`): `users`, `recurring_schedules`, `class_instances`, `complaints`, `learning_resources`, `invoices`, `suggestions`, `books`. Each entry maps `{ table, entityType }` (entityType is the `AuditRepository` action subject).
- Generic `softDelete<T tableName>({ tableName, entityId, actorUserId, description, metadata }, tx?, locale?)`:
  1. `acquireSoftDeleteLock` (advisory xact lock).
  2. `enableSoftDeleteSession` (sets `app.soft_delete=true` GUC).
  3. SELECT with `isNull(deletedAt)` → throw `NotFoundError` if missing.
  4. `UPDATE ... SET deletedAt = now(), updatedAt = now()` (only sets `updatedAt` if column exists on table — `"updatedAt" in config.table` check at line 97).
  5. Writes an `AuditRepository.createAuditLog({ action: "DELETE", previousState/newState/changes for deletedAt, metadata })`.
  6. Returns `{ entity, deletedAt }`.
- Typed convenience wrappers for each registered table: `softDeleteUser`, `softDeleteRecurringSchedule`, `softDeleteClassInstance`, `softDeleteComplaint`, `softDeleteLearningResource`, `softDeleteInvoice`, `softDeleteSuggestion`, `softDeleteBook`.
- **Hard delete**: `hardDelete<T>(tableName, entityId, tx?, locale?)` for superuser cleanup of already-soft-deleted rows (line 201). Reuses `db.transaction(runner)` vs `runner(tx)` ternary.

---

## 7. Full-Text Search

Two complementary mechanisms defined in `backend/db/query.extensions.ts:28-61`:

1. **`fullTextSearch(column, text, config='simple')`** — builds a `to_tsvector(config, column) @@ to_tsquery(config, query)` SQL fragment.
   - Sanitizes each word by stripping FTS special chars (`&|!():`), appends PG prefix operator `:*` for partial matching, joins tokens with ` & ` (AND logic).
   - Returns `null` for empty input (caller skips the where clause).
   - Configs used: `'simple'`, `'english'`, `'arabic'` (per docstrings).
   - Consumed by `backend/utils/student.filterUtils.ts:24` — `fullTextSearch(students.name, args.name, "simple")`.

2. **Indexes** in `backend/db/schema/students/students.ts:78-79`:
   ```ts
   index("idx_students_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),
   index("idx_students_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
   ```
   - GIN index on `to_tsvector('simple', name)` backs the `fullTextSearch` queries.
   - GiST trigram index (`gist_trgm_ops`) on `name` backs similarity/`ILIKE` lookups.
- No separate repo-level trigram methods found; `like`/`ilike` are used in dynamic filters (`student.filterUtils.ts:1` imports `like, notLike`).

---

## 8. Batch Operations

- **Bulk insert with chunking**: `backend/db/repo/shared/bulk-upsert.ts` — `bulkInsertOnConflictDoNothing(table, rows, { chunkSize?, tx? })`.
  - `DEFAULT_BULK_CHUNK_SIZE = 100`.
  - Loops `rows` in chunks, `db.insert(table).values(chunk).onConflictDoNothing()`.
  - Accepts optional `tx`; resolves `queryDb = options?.tx ?? db`.
  - Consumed by `AuditRepository` (`audit.repository.ts:4` import) for batched audit log inserts.
- **Single multi-row insert via `.values([...inputs]).returning()`**:
  - `StudentRepository.createList` (`student.repository.ts:153-184`) — pre-validates each, maps to `StudentEntityInput[]`, then `db.insert(students).values(values).returning()`.
  - `GroupClassRepository.createEnrollments` via `insertManyReturning` helper (`group-class.repository.ts:37-49`).
- **Batch lookups for DataLoader** (no prepared statements): pattern is `db.select().from(t).where(inArray(col, ids))`, with a **pre-initialized Map** mapping all requested keys → `null`, then filling matches:
  ```ts
  const map = new Map<string, string | null>(userIds.map(id => [id, null]));
  for (const row of rows) map.set(row.userId, row.teacherId);
  return map;
  ```
  (pattern from `prepared-statements.md:198`, used by `teachers/teacher.repository.ts`, `parents/parent.repository.ts`).
  - Student variant returns `(Student | Error)[]` preserving order, missing ids become `new Error(studentNotFound(id))` (`student.repository.ts:186-196`).
  - Guard: `if (ids.length === 0) return [];` precedes every batch query (e.g. `credit.repository.ts:139`, `student.repository.ts:187`).
- **Multi-table parallel fan-out**: `StorageDbRepository.getFileUsages` fans out to 3 helper groups (`fetchPersonUsages`, `fetchContentUsages`, `fetchSystemUsages`), each `Promise.all` over junction-table selects (`storage.repository.ts:208-311`). The `isFileInUse` variant uses a single `sql\`UNION ALL ...\`` for an existence check (line 333).
- **Cleanup deletes**: bulk `db.delete(storageFiles).where(inArray(storageFiles.id, fileIds))` after collecting unused ids (`storage.repository.ts:818`).

---

## 9. Storage Repository (in detail)

File: `backend/db/repo/storage/storage.repository.ts` — `export namespace StorageDbRepository { ... }`. The **DB-only** half of file operations; the actual object-storage (put/get/presign) lives in `backend/services/storage/storage.service.ts`. Signed URL token persistence is in `backend/db/repo/shared/signedUrl.repository.ts`.

### 9.1 File records (`storageFiles` table)
- `fileById(id)`, `fileByPath(path)`, `filesByIds(ids[])`, `filesByPaths(paths[])` — plain selects; `[]` guards on empty input (`storage.repository.ts:26-44`).
- `createFile(path, isProtected=false)` — **upsert** on `storageFiles.path`:
  ```ts
  db.insert(storageFiles).values({ path, isProtected })
    .onConflictDoUpdate({ target: storageFiles.path, set: { isProtected } }).returning();
  ```
- `updateFile`, `deleteFile(path)` (returns boolean, swallows errors via logger).
- Hard deletes (no soft-delete on `storageFiles`); orphan cleanup via `cleanupExpiredFiles` uses 10-way `leftJoin` + `isNull(...) ` to find unused files then `inArray` delete (lines 779-818).

### 9.2 Directory records (`storageDirectories`)
- Same CRUD shape; `directoriesByParentPath` uses `LIKE escaped_path + '/%'` (note `escapeLikeWildcards` import from `@/backend/utils`, line 98).
- `ensureDirectoryRecord` is an upsert that also normalizes a permissions object (defaults: uploads/delete/move/subDirs true) and supports `isProtected` + `protectChildren` flags.
- `validateUpload({ path, size, contentType })` (line 751) — Synchronous validation: rejects `..` and leading `/` (path traversal), 100MB cap, requires contentType.

### 9.3 Permission & protection
- `setProtection({ path, isProtected, protectChildren })` (line 605): idempotently updates either the file or the directory (whichever matches the path), returning a `FileOperationResult`.
- `updateDirectoryPermissions` mirrors the directory-permission CRUD.
- `checkFileUsage` returns `{ isInUse, usages[], canDelete, deleteBlockReason }`.

### 9.4 File-usage linkage (junction tables)
Siraj tracks which entities reference each file across **10 junction tables**: `userFiles`, `teacherFiles`, `studentFiles`, `parentFiles`, `invoiceFiles`, `complaintFiles`, `learningResourceFiles`, `staffProfileFiles`, `recurringScheduleFiles`, `classInstanceFiles`.
- `registerFileUsage({ referenceTable, referenceId, usageType, filePath })` (line 350) creates the `storageFiles` row then dispatches to a type-safe `performJunctionInsert(params, locale?)` switch (lines 386-428) that inserts into the matching junction table. Unknown table → `getServerTranslations(locale).errorsTranslations.invalidInput` error.
- `unregisterFileUsage(filePath, usageType, referenceId)` (line 430) deletes from **all 10 junctions** in parallel (`deletePersonRelatedUsages` + `deleteBusinessRelatedUsages`) so a file can be cleanly detached regardless of which entity had it.
- `getFileUsages` (line 183) returns a unified `FileUsageInfo[]` across all junctions; `isFileInUse` returns a boolean via a UNION ALL existence query.
- Per-entity link helpers expose typed access: `linkFileToParent(parentId, fileId, usageType, tx?, createdAt?)` and `linkFileToInvoice(...)` (lines 703-745) — both use `const queryDb = tx ?? db;` and `.returning()`.
- Entity-scoped reads: `getFilesForParent`, `getFilesForInvoice(invoiceId, usageType?, tx?, limit?)` — joins `junctiontable` ⨝ `storageFiles`, projects a uniform `LinkedFileReturnType`, applies optional `usageType` filter and `limit` (`storage.repository.ts:637-701`).

### 9.5 Signed URLs (`SignedUrlRepository`, `backend/db/repo/shared/signedUrl.repository.ts`)
This is the **token / authorization side** of secure downloads/uploads, distinct from object-store presigning.
- Table: `signedUrls` (`id`, `filePath`, `used`, `expiresAt`).
- `createSignedUrl(data)` — inserts a new token, logs `id` + `filePath` (line 24).
- `getSignedUrlById(id)` — **prepared statement** `findSignedUrlByIdPrepared.execute({ id })`, returns `result[0] || null` (lines 34-37). Auth note in JSDoc: *authorization must be checked by the calling service beforehand*.
- `claimSignedUrl(id)` — **atomic single-use claim** via `db.transaction`:
  1. `SELECT FOR UPDATE SKIP LOCKED` where `eq(id)`, `eq(used, false)`, `gt(expiresAt, now)`.
  2. Returns null if not found / already used / expired.
  3. `UPDATE ... SET used = true` and returns the row (lines 44-80).
  This prevents race conditions where two clients redeem the same one-time token concurrently.
- `deleteExpired()` — `db.delete(signedUrls).where(lt(expiresAt, now)).returning()`; returns count (line 86).

### 9.6 Service-layer integration (`backend/services/storage/storage.service.ts`)
- Imports `SignedUrlRepository` (line 3).
- Upload validation flow: `validateUpload` doc at line 61, then verifies `SignedUrlRepository.getSignedUrlById(sessionId)` (line 79) — invalid session → `{ error: "Invalid upload session", status: 403 }`.
- On successful validation: claims the token via `SignedUrlRepository.claimSignedUrl(sessionId)` (line 118).
- Expired-token housekeeping via `SignedUrlRepository.deleteExpired()` (line 248).
- `linkFileToEntity` style helper links an uploaded filePath into entity junction tables (line 263).
- The repository is therefore **DB book-keeping only** (rows for files/dirs/tokens/usages); the actual S3/Vercel-Blob `put`/`get`/presign is performed in the service layer.

### 9.7 Learning resources (`LearningResourceRepository`, `backend/db/repo/storage/learning-resource.repository.ts`)
- Shares the namespace style. Uses a shared `resourceSelectColumns` projection (lines 25-34) with `sql\`NULL\`` placeholders for fields not yet joined (`uploadedByUserName`, `fileSize`, `contentType`).
- `findByFilePath` filters `and(eq(filePath), isNull(deletedAt))` — **soft-deleted** via `deletedAt` on `learningResources` (this table *is* in `SOFT_DELETE_TABLES`).
- `LearningResourceListResult` returns `{ rows, totalCount }` for paginated list flows.

---

## 10. Summary — Patterns to mirror for a Certificate feature

For a new `certificates` domain, follow these conventions:

1. **Location**: `backend/db/repo/certificates/certificate.repository.ts` exporting `namespace CertificateRepository`.
   - Add `export * from "./certificate.repository";` to a new `backend/db/repo/certificates/index.ts`.
   - Add `export { CertificateRepository } from "@/backend/db/repo/certificates";` to `backend/db/repo/index.ts`.
2. **Types** in `backend/types/certificates/certificate.types.ts` using `$inferSelect`/`$inferInsert` from the new schema; expose `CertificateSelectType`, `CertificateInsertType`.
3. **Schema** in `backend/db/schema/certificates/certificates.ts` — include `deletedAt` (register in `SOFT_DELETE_TABLES` if soft-deletable), `idempotencyKey` + unique index for retried operations, composite `(createdAt, id)` index if cursor pagination is wanted, and a GIN `to_tsvector('simple', name)` index if FTS on title/recipient name is needed.
4. **Reads**: use `queryDb(tx)` from `@/backend/db` for stateless reads; consider a module-level prepared statement for `findById` only if it accepts optional `tx` and has no `inArray`/dynamic conditions.
5. **Writes**: `const executor = tx ?? db;` and `.returning()` for insert/update; wrap multi-step writes with `db.transaction(runner)` ternary `tx ? runner(tx) : db.transaction(runner)` (or reuse a `runInTransaction` helper).
6. **Batch lookups** (DataLoader): `inArray(col, ids)` dynamic query; never prepared; return a pre-seeded `Map<string, T|null>` or `(T | Error)[]`.
7. **Pagination**: prefer cursor-based on `(createdAt, id)` for stable ordering + a `count(*) over()` window column for `total`, OR offset-based via `queryWithPagination`.
8. **FTS**: reuse `fullTextSearch(column, text, 'simple')`; ensure a matching GIN index exists.
9. **Errors**: take `tErrors: ErrorsLabels` and `throw new Error(tErrors.<...>(...))`; use `NotFoundError` for not-found-with-context; never hardcode user-facing strings.
10. **File links**: if the certificate is associated with an uploaded PDF, add a `certificateFiles` junction table and follow the `StorageDbRepository` pattern (or reuse one of the existing junction tables if a generic `learning_resources` link fits). Signed download URLs go through `SignedUrlRepository` (create on issue, `claimSignedUrl` on download).

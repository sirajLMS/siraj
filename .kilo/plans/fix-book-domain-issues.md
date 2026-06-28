# Plan: Fix Book Domain Issues (6 Findings)

## Summary

6 issues across the book domain: a no-op `refetchQueries` (most visible user-facing bug), a TOCTOU race condition, fragile error re-identification via translated string comparison, missing RLS policies, redundant repo existence check, and dead type exports.

## Execution Order

Issues are ordered by dependency: foundational backend changes first, then frontend.

---

## Phase 1: Introduce Domain Error Classes (Finding #3)

**Files:**
- `backend/lib/errors.ts` (NEW)
- `backend/lib/index.ts` (add `export * from "./errors"`)

**What:**
Create a small hierarchy of domain error classes that carry a stable `code` property, eliminating the need to compare translated `error.message` strings:

```ts
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, message: string, options?: ErrorOptions) {
    super(`${entity}_NOT_FOUND`, message, options);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super("UNAUTHORIZED", message, options);
  }
}
```

**Why first:** Phases 2 and 3 depend on `error.code` being available.

---

## Phase 2: Fix TOCTOU Race + Fragile Error Identification (Findings #2, #3, #5)

**Files:**
- `backend/services/resource/book.service.ts`
- `backend/db/repo/book.repository.ts`

**What:**

### `book.repository.ts` — Remove redundant existence check, accept `actorUserId` for `SoftDeleteRepository`

Replace the custom `deleteBook` implementation with a call to `SoftDeleteRepository.softDelete()`. Remove the internal existence check (lines 58-66); let `SoftDeleteRepository.softDelete()` handle the existence check atomically within its transaction.

```ts
export async function deleteBook(
  id: string,
  actorUserId?: string | null,
  tx?: DBTransaction
): Promise<boolean> {
  await SoftDeleteRepository.softDelete(
    { tableName: "books", entityId: id, actorUserId },
    tx
  );
  return true;
}
```

### `book.service.ts` — Remove double `findById`, catch by `error.code`

1. Remove service-level `findById` call (line 29-32) — the repo's `softDelete` already checks existence atomically.
2. Replace translated-string comparison with `error.code` checks:

```ts
} catch (error) {
  if (error instanceof DomainError) {
    if (error.code === "UNAUTHORIZED" || error.code === "BOOKS_NOT_FOUND") {
      throw error;
    }
  }
  const t = await getBackendTranslations({ locale, namespace: "errors" });
  throw new Error(t("bookDeleteFailed"), { cause: error });
}
```

3. Change `findById` not-found and unauthorized throws to use `NotFoundError` and `UnauthorizedError`.
4. Remove unused `getBackendTranslations` import from the catch block (only needed for generic fallback).

---

## Phase 3: Register `books` in Soft Delete System + Add RLS Policies (Finding #4)

**Files:**
- `backend/types/soft-delete.types.ts`
- `backend/db/repo/soft-delete.repository.ts`
- `backend/db/migration/books_rls_policies.sql` (NEW)

### `soft-delete.types.ts`

1. Add `"books"` to `SoftDeletableTableName` union.
2. Add `books: typeof books.$inferSelect` to `SoftDeletableEntityMap`.
3. Add `books: Extract<AuditEntityType, "BOOK">` to `SoftDeletableAuditEntityMap`.

### `soft-delete.repository.ts`

1. Import `books` from `@/backend/db/schema`.
2. Add to `SOFT_DELETE_TABLES`:
```ts
books: {
  table: books,
  entityType: "BOOK" as const,
},
```
3. Add convenience method `softDeleteBook`.

### `backend/db/migration/books_rls_policies.sql` (NEW)

Following the exact pattern from `soft_delete_rls_policies.sql`:

```sql
-- 7. books configuration
ALTER TABLE "books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "books" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS books_select_policy ON "books";
CREATE POLICY books_select_policy ON "books" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS books_insert_policy ON "books";
CREATE POLICY books_insert_policy ON "books" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS books_update_policy ON "books";
CREATE POLICY books_update_policy ON "books" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS books_delete_policy ON "books";
CREATE POLICY books_delete_policy ON "books" FOR DELETE USING (false);
```

### Audit type update

Add `"BOOK"` to `AuditEntityType` in `backend/types/audit.types.ts:14-32` (currently missing — only resources like `LEARNING_RESOURCE`, `SUGGESTION`, `COMPLAINT` are present).

---

## Phase 4: Fix No-Op `refetchQueries` — Optimistic UI Removal (Finding #1)

**Files:**
- `frontend/views/dashboard/resources/books-and-bags/BookItemCard.tsx`
- `frontend/views/dashboard/resources/books-and-bags/BooksAndBagsClient.tsx`
- `frontend/views/dashboard/resources/books-and-bags/booksAndBags.types.ts`

**What:**

### Strategy: Optimistic removal via callback prop

This is the simplest approach that matches the project's server-component-driven data flow. No need to convert the entire page to Apollo `useQuery`.

### `booksAndBags.types.ts`

Add `onDelete` callback to `BookItemCardProps`:

```ts
export interface BookItemCardProps {
  readonly book: BookItem;
  readonly labels: BooksAndBagsLabels;
  readonly onDelete: (bookId: string) => void;
}
```

### `BooksAndBagsClient.tsx`

1. Add `useState` for the book list, initialized from `initialBooks`.
2. Create `handleDelete` callback that filters out the deleted book:
```ts
const [books, setBooks] = useState<BookItem[]>(() =>
  initialBooks.map(b => ({ id: b.id, name: b.name, availabilityStatus: b.availabilityStatus }))
);
const handleDelete = (bookId: string) => {
  setBooks(prev => prev.filter(b => b.id !== bookId));
};
```
3. Pass `onDelete={handleDelete}` through `BooksAndBagsGrid` to `BookItemCard`.

### `BooksAndBagsGrid.tsx`

Thread `onDelete` prop through to each `BookItemCard`.

### `BookItemCard.tsx`

1. Remove `refetchQueries` from `useMutation`.
2. Call `onDelete(book.id)` on successful mutation.
3. Remove `booksAndBagsQueryDocument` import (no longer needed).

---

## Phase 5: Remove Dead Type Exports (Finding #6)

**Files:**
- `backend/types/book.types.ts`

**What:**

Remove `BookSelectType` and `BookInsertType` exports. They are unused (confirmed: zero imports outside of `book.types.ts` itself). `BookReturnType` uses `BookSelectType` internally via `Omit<BookSelectType, ...>`, so keep the local alias but remove the `export`:

```ts
import type { books } from "@/backend/db/schema";
import type { AvailabilityStatus } from "@/shared/lib/enum";

type BookSelectType = typeof books.$inferSelect;
type BookInsertType = typeof books.$inferInsert;

export type BookReturnType = Omit<BookSelectType, "availabilityStatus" | "deletedAt"> & {
  availabilityStatus: AvailabilityStatus;
};
```

Change `export type` to `type` (unexported) for both. Verify no consumers import them (confirmed: none do).

---

## Phase 6: Quality Gate

1. `bun run generate:gqlSchema && bun codegen` — rebuild GraphQL types after backend changes.
2. `bun tsgo` — type check.
3. `bun biome:check` — format/lint.
4. `bun run lint` — ESLint.
5. `bun run test:db` — database tests (if any exist for books).
6. `bun run test:graphql` — GraphQL integration tests.
7. Run RLS migration SQL against dev database (manual or via migration tool).
8. `bun quality-gate` — full quality gate.

---

## Files Modified (Summary)

| File | Change |
|------|--------|
| `backend/lib/errors.ts` | NEW — Domain error classes |
| `backend/lib/index.ts` | Add re-export |
| `backend/db/repo/book.repository.ts` | Remove redundant existence check, delegate to `SoftDeleteRepository` |
| `backend/services/resource/book.service.ts` | Remove `findById`, use `error.code` instead of string comparison |
| `backend/types/soft-delete.types.ts` | Add `"books"` to all type maps |
| `backend/types/audit.types.ts` | Add `"BOOK"` to `AuditEntityType` (verify) |
| `backend/db/repo/soft-delete.repository.ts` | Add `books` to `SOFT_DELETE_TABLES`, add `softDeleteBook` method |
| `backend/db/migration/books_rls_policies.sql` | NEW — RLS policies for books table |
| `backend/types/book.types.ts` | Unexport `BookSelectType`, `BookInsertType` |
| `frontend/views/dashboard/resources/books-and-bags/BookItemCard.tsx` | Remove `refetchQueries`, add `onDelete` callback |
| `frontend/views/dashboard/resources/books-and-bags/BooksAndBagsClient.tsx` | Add `useState` for book list, add `handleDelete` |
| `frontend/views/dashboard/resources/books-and-bags/bookAndBags.types.ts` | Add `onDelete` to `BookItemCardProps` |
| `frontend/views/dashboard/resources/books-and-bags/BooksAndBagsGrid.tsx` | Thread `onDelete` prop |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| RLS migration could lock the `books` table briefly | Run during low-traffic; `DROP POLICY IF EXISTS` prevents errors on re-run |
| `DomainError` is new — need to verify it doesn't break GraphQL error formatting | Pothos/GraphQL propagates standard `Error` subclasses fine; `DomainError.message` still contains the translated string for client display |
| Removing `BookSelectType`/`BookInsertType` exports could break if any consumer uses indirect import via `index.ts` | Verified: zero consumers import these types |
| Optimistic removal means stale data if delete actually fails server-side | The `.catch()` handler in `BookItemCard` already shows an error toast; if deletion fails, the book stays in the list (correct behavior). For true rollback, add `onError` to revert state — but current UX of showing error toast is acceptable. |

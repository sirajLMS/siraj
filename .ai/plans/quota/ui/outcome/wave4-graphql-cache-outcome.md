# Wave 4 — Task Group 17: GraphQL Cache Optimization

## Summary

Verified and gap-filled all Apollo cache `update` functions for quota create, update, and delete mutations.

**Wave 1 carry-forward**: The create mutation already had `cache.updateQuery` adding the new item to the paginated list cache. The detail VM's delete mutation already had `cache.evict` + `cache.updateQuery` removing the item from the list cache. No `refetch()` was used in either of those files.

**Gaps fixed**:

1. **Update mutation** (`useQuotaFormViewModel.ts`) — Replaced `cache.modify` (entity-level only) with `cache.updateQuery` for both the `quotas` list cache and `quota` detail cache. The `cache.modify` approach only updated the normalized entity fields; it did not update the denormalized `rows` array in the `Quotas` list query. The new `replaceQuotaInListCache` mapper function spreads updated fields onto the matched row.

2. **Delete mutation** (`useQuotaViewModel.ts`) — Replaced `onCompleted: () => { void refetch() }` with a proper `update` function using `cache.evict` + `cache.updateQuery` (via `removeQuotaFromListCache`). This removes the deleted item from the list cache immediately without an extra network request, satisfying R15 requirement: "not `refetch()`".

3. **Version field** — The backend GraphQL schema (`Quota`, `QuotaSubmitInput`, `QuotaUpdateInput`) does **not** expose a `version` field. Optimistic concurrency via version is not supported by the backend. No changes to input types were made.

## Files Modified

| File | Changes |
|------|---------|
| `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts` | Added `replaceQuotaInListCache` module-level function. Replaced `cache.modify` in update mutation with `cache.updateQuery` for both `quotasQueryDocument` (list update) and `quotaQueryDocument` (detail update). Added `QuotasQuery` type import. |
| `frontend/common/views/dashboard/billing/quota/useQuotaViewModel.ts` | Added `removeQuotaFromListCache` module-level function. Replaced `onCompleted: () => { void refetch() }` with `update` function using `cache.evict` + `cache.updateQuery` + `cache.gc`. Removed `refetch` from `useQuery` destructure. Added `QuotasQuery` type import. |
| `.ai/plans/quota/ui/tasks.md` | Updated task 16.1, 16.1.QL, 16.1.IV from `[ ]` to `[x]` |

## Files Verified (No Changes Needed)

| File | Status |
|------|--------|
| `frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel.ts` | ✅ Already had proper `update` with `cache.evict` + `cache.updateQuery` from Wave 1. No changes needed. Verified passing all checks. |

## Cache Update Function Inventory

### Create Mutation (`useQuotaFormViewModel.ts`)

```ts
cache.updateQuery({ query: quotasQueryDocument }, cached => {
  if (!cached?.quotas?.rows) return cached;
  return {
    ...cached,
    quotas: {
      ...cached.quotas,
      rows: [...cached.quotas.rows, created],
      totalCount: (cached.quotas.totalCount ?? 0) + 1,
    },
  };
});
```

- Adds new item to end of `rows` array ✅
- Increments `totalCount` ✅
- Null-safe (returns `cached` if no rows) ✅

### Update Mutation (`useQuotaFormViewModel.ts`)

```ts
cache.updateQuery({ query: quotasQueryDocument }, replaceQuotaInListCache(quotaId, updated));
cache.updateQuery({ query: quotaQueryDocument, variables: { id: quotaId } }, cached => {
  if (!cached?.quota) return cached;
  return { ...cached, quota: { ...cached.quota, ...updated } };
});
```

- Updates matched row in list cache (spreads updated fields) ✅
- Updates detail query cache ✅
- `replaceQuotaInListCache` is module-level (avoids `sonarjs/no-nested-functions`) ✅

### Delete Mutation — Detail VM (`useQuotaDetailViewModel.ts`)

```ts
cache.evict({ id: cache.identify({ __typename: "Quota", id: quotaId }) });
cache.updateQuery({ query: quotasQueryDocument }, updateQuotasCache(quotaId));
cache.gc();
```

- Evicts entity from normalized cache ✅
- Removes from list cache (filter by ID + decrement totalCount) ✅
- Garbage collects orphaned references ✅

### Delete Mutation — List VM (`useQuotaViewModel.ts`)

```ts
cache.evict({ id: cache.identify({ __typename: "Quota", id: deleted.id }) });
cache.updateQuery({ query: quotasQueryDocument }, removeQuotaFromListCache(deleted.id));
cache.gc();
```

- Previously used `onCompleted: () => { void refetch() }` — now uses cache update ✅
- Same pattern as detail VM (evict + updateQuery + gc) ✅
- `removeQuotaFromListCache` is module-level (avoids `sonarjs/no-nested-functions`) ✅

## Version Field Analysis

The task requirement "Pass `version` field for optimistic concurrency" was investigated:

| Type | Has `version`? |
|------|---------------|
| `Quota` (output type) | ❌ No |
| `QuotaSubmitInput` (create input) | ❌ No |
| `QuotaUpdateInput` (update input) | ❌ No |

The backend GraphQL schema does not expose a `version` field on any quota-related type. Adding it would require backend schema changes (Pothos + database migration), which is outside the scope of this frontend task.

This requirement is marked as ⚠️ N/A in `tasks.md`.

## Generated Type Import Pattern

When using `cache.updateQuery`, the callback type must match the `QuotasQuery` type returned by the `quotasQueryDocument`. The type comes from:

- `@/frontend/common/graphql/generated/gql/graphql` — re-exports `QuotasQuery` (from `graphql.ts`)
- `@/frontend/common/graphql/generated/gql/operations` — also exports `QuotaQuery` (from `operations.ts`)

**Important**: These two files use different internal enum representations. `buildEditDefaults` in the form VM returns `QuotaFormInput` which references `QuotaKind` from `graphql-types.ts`. If `QuotaQuery` is imported from `graphql.ts` (whose `QuotaKind` is nominally different from `graphql-types.ts`'s `QuotaKind`), tsgo will fail with TS2322.

**Fix**: Import `QuotaQuery` from `operations` (matches original Wave 1 import) and `QuotasQuery` from `graphql` (matches detail VM import). This prevents enum type mismatch errors.

## Verification Results (sub-loop.ts --lifecycle codescene)

All 3 files passed the full progressive verification chain (tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene):

```
✅ useQuotaFormViewModel.ts — All checks for lifecycle "codescene" passed
✅ useQuotaViewModel.ts — All checks for lifecycle "codescene" passed
✅ useQuotaDetailViewModel.ts — All checks for lifecycle "codescene" passed (verified, no changes)
```

## Refetch Elimination

Before this task, `refetch()` was used in 3 places:

| File | Usage | Status |
|------|-------|--------|
| `useQuotaViewModel.ts` line 70 | `onCompleted: () => { void refetch() }` on delete mutation | ✅ Replaced with cache `update` function |
| `useQuotaViewModel.ts` line 60 | `refetch` in `useQuery` destructure | ✅ Removed (no longer needed) |
| `useQuotaInsightsViewModel.ts` line 127 | `refetch` exported in ViewModel interface for manual refresh | ⚠️ Out of scope — this is a legitimate manual-refresh button, not a mutation side-effect |

The `useQuotaInsightsViewModel.ts` refetch is a user-triggered manual refresh action (exposed as a button), not a mutation-driven cache replacement. It is correct usage and was not modified.

## Semantic Review Checklist

- [x] No dead branches — all cache update functions return `cached` on null guards
- [x] No cross-layer imports — only imports from `@/frontend/common/graphql/...` and `@/shared/...`
- [x] All cache functions at module level — avoids `sonarjs/no-nested-functions`
- [x] `id` field included in all mutations (delete returns `id`)
- [x] No `oxlint-disable` comments
- [x] `cache.updateQuery` used for paginated lists (not `cache.modify`)
- [x] No `refetch()` used for mutation side-effects
- [x] Version field: backend doesn't expose it; documented as N/A

## Carry-Forward Knowledge

### `cache.updateQuery` vs `cache.modify` for Paginated Lists

`cache.modify` updates normalized entity fields but does NOT update denormalized arrays in query results. When a mutation changes fields displayed in a list (e.g., `Quota.name`), `cache.modify` alone may leave stale data in the `quotas.rows` array because Apollo's cache stores the full query result, not just entity references.

Use `cache.updateQuery` for paginated list updates — it gives direct access to the cached query result and lets you map/replace items in the `rows` array.

### Module-Level Cache Functions for `sonarjs/no-nested-functions`

Cache update functions like `replaceQuotaInListCache` and `removeQuotaFromListCache` must be declared at module level, not inside `useCallback` or `useMutation` callbacks. Placing a function inside `useCallback` → `useMutation` → `update` creates 4+ levels of nesting, which triggers `sonarjs/no-nested-functions`.

### Generated Type Source Alignment

When mixing `QuotaQuery` (for detail cache) and `QuotasQuery` (for list cache) in the same file, import from the same source or from sources with compatible enum types:

- `QuotaQuery` from `@/frontend/common/graphql/generated/gql/operations` (compatible with `graphql-types.ts` enums)
- `QuotasQuery` from `@/frontend/common/graphql/generated/gql/graphql` (used by detail VM)

Do NOT import `QuotaQuery` from `graphql.ts` when the file also imports `QuotaKind` from `graphql-types.ts` — the nominally different enum types cause TS2322.

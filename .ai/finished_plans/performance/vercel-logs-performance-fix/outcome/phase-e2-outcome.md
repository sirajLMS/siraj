# Phase E2 Outcome — Enable HTTP Batching (Option A: BatchHttpLink)

## Summary

Enabled HTTP request batching to reduce the number of Vercel function invocations per page load. Apollo Server 4 disables batched HTTP requests by default — we added `allowBatchedHttpRequests: true` to the `ApolloServer` constructor. On the client side, we replaced `HttpLink` with `BatchHttpLink` (from `@apollo/client/link/batch-http`), which groups multiple concurrent GraphQL operations into a single JSON array POST body. The link chain order — `PersistedQueryLink` → `BatchHttpLink` — ensures APQ hashes are resolved before the batch is assembled.

**Expected impact:** 8 individual POST requests per permissions page load → 1 batched POST (upper bound; actual reduction depends on timing window and `BatchHttpLink` defaults).

## Files Modified

### 1. `app/api/graphql/route.ts`
- Added `allowBatchedHttpRequests: true` to the `ApolloServer` constructor options (line 62, after `cache` property)
- Added explanatory comment explaining the batching rationale and Vercel function invocation reduction
- APQ settings (`persistedQueries` with `ApolloCacheAdapter`, `ttl: null`) remain **unchanged** — batching is orthogonal to APQ

### 2. `frontend/common/providers/apollo/AppApolloProvider.tsx`
- Line 3: Removed `HttpLink` from `@apollo/client` import (kept `ApolloClient`, `ApolloLink`)
- Line 4: Added `import { BatchHttpLink } from "@apollo/client/link/batch-http"` (separate import — `BatchHttpLink` is NOT exported from `@apollo/client` root barrel)
- Line 64: Replaced `new HttpLink({ uri: "/api/graphql", credentials: "include" })` with `new BatchHttpLink({ uri: "/api/graphql", credentials: "include" })` (same options — `BatchHttpLink` accepts the same `HttpOptions` as `HttpLink` plus optional `batchInterval`, `batchMax`, `batchKey`)
- Added comments explaining:
  - `BatchHttpLink` groups concurrent operations into a single POST
  - Server must opt in via `allowBatchedHttpRequests: true`
  - `PersistedQueryLink` must chain BEFORE `BatchHttpLink` so APQ hashes resolve before batch assembly

### 3. `.ai/plans/vercel-logs-performance-fix/trackable-tasks.md`
- Updated E2.1.1, E2.1.2, E2.1.3, E2.1.4 checkboxes from `[ ]` to `[x]`

## Files Created

### `frontend/common/graphql/test/batching.test.ts`
9 tests across 2 describe blocks:

**Server-side integration tests (6 tests):**
1. Server accepts a batched array body and returns array of responses (2-operation batch)
2. Batched request without auth cookies returns errors for all entries
3. Single-element batched request still works after enabling batching
4. APQ works with batched requests — 3-step APQ lifecycle (hash-only → PersistedQueryNotFound → hash+query registers and executes → hash-only succeeds)
5. Authenticated batched request returns valid user data for multiple queries (3-operation batch)
6. Clearing cookies after batch test does not pollute subsequent tests

**Client-side structural tests (3 tests):**
7. `BatchHttpLink` is importable from `@apollo/client/link/batch-http`
8. `AppApolloProvider` uses `BatchHttpLink` (not `HttpLink`) with `PersistedQueryLink` before it (programmatic source-file verification of link chain order)
9. `ApolloServer` constructor has `allowBatchedHttpRequests: true`

## Link Chain Order (Critical)

The Apollo link chain in `AppApolloProvider.tsx` is:

```
errorLink → connectivityLink → authLink → PersistedQueryLink → BatchHttpLink
```

`PersistedQueryLink` is positioned **before** `BatchHttpLink` so that:
1. APQ processes each operation first — converting full query strings to SHA-256 hashes (or vice-versa on `PersistedQueryNotFound`)
2. `BatchHttpLink` then assembles all processed operations into a single JSON array POST

If `BatchHttpLink` came before `PersistedQueryLink`, the batch would be assembled before APQ transforms were applied, and each batch entry would carry full query text — defeating the purpose of APQ.

The test at line 219 programmatically verifies this order by checking that `source.indexOf("PersistedQueryLink")` < `source.indexOf("new BatchHttpLink")` in the source file.

## APQ + Batching Compatibility

APQ and HTTP batching are fully compatible:

- **BatchHttpLink** sends an array `[{ query, variables, extensions }, ...]` as the POST body
- **Apollo Server 4** with `allowBatchedHttpRequests: true` processes each array entry independently — each entry can include `extensions.persistedQuery` with a SHA-256 hash
- **APQ lifecycle with batching:** Each batch entry is resolved independently. A hash-only entry that hasn't been registered yet returns `PERSISTED_QUERY_NOT_FOUND` for that entry only; a hash+query entry registers and executes; subsequent hash-only entries for the same query succeed
- **No changes to APQ settings** — `persistedQueries.cache`, `ttl: null`, and `ApolloCacheAdapter` are all unchanged
- The test at line 134 verifies the full 3-step APQ lifecycle within batched requests

## BatchHttpLink Import Path

The correct import path is `@apollo/client/link/batch-http`:

```typescript
import { BatchHttpLink } from "@apollo/client/link/batch-http";
```

- **NOT** `from "@apollo/client"` — `BatchHttpLink` is not exported from the root barrel (`TS2305: Module '"@apollo/client"' has no exported member 'BatchHttpLink'`)
- **NOT** `from "@apollo/client/link/batch"` — that path exports `BatchLink` (the non-HTTP batch link), not `BatchHttpLink`
- The `node_modules/@apollo/client/link/batch-http/index.d.ts` confirms: `export { BatchHttpLink } from "./batchHttpLink.js"`
- No package installation was needed — `@apollo/client/link/batch-http` ships with `@apollo/client` (already installed at v4.0.6)

## Quality Loop Results

All 3 modified/created files passed the full quality loop (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene):

| File | tsgo | oxlint | biome | lint | dupes | codescene |
|------|------|--------|-------|------|-------|-----------|
| `app/api/graphql/route.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/common/providers/apollo/AppApolloProvider.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/common/graphql/test/batching.test.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Deferred Items

None. All 4 subtasks (E2.1.1–E2.1.4) are complete.

## Issues

None. APQ + batching works correctly with no configuration changes needed to persisted query settings.

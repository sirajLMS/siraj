# Task 9 Outcome: useCreateGeneralUser Hook

## Date: 2026-08-14

## Summary

Created `useCreateGeneralUser` — a React hook wrapping the `createGeneralUser` GraphQL mutation via Apollo's `useMutation`. The hook handles cache eviction (`cache.evict` + `cache.gc`), Zustand store synchronization (`setIsSubmitting`, `setResult`, `setError`), and error logging. It follows the established pattern from `useCreateManagerOnboarding`, `useCreateTeacherOnboarding`, and `useCreateParentOnboarding` hooks.

Additionally, fixed the `generalUserOnboardingStore` (from Task 10) to use the GraphQL codegen `GeneralUserCreateResult` type instead of the backend type, resolving a type incompatibility between the mutation result (nullable `user`/`assignedGroupSlug`) and the store's expected type (non-nullable). This aligns with the existing onboarding store convention (all stores use codegen types from `graphql-types.ts`).

## Files Created

| File | Purpose |
|------|---------|
| `frontend/common/hooks/useCreateGeneralUser.ts` | `useCreateGeneralUser` hook — wraps `createGeneralUser` mutation with cache eviction + store sync |

## Files Modified

| File | Change |
|------|--------|
| `frontend/common/stores/generalUserOnboardingStore.ts` | Changed `GeneralUserCreateResult` import from `@/backend/types` to `@/frontend/common/graphql/generated/gql/graphql-types` (codegen type with nullable fields matching the mutation result shape) |

## No Barrel File

No barrel file exists at `frontend/common/hooks/index.ts`. All existing hooks in `frontend/common/hooks/` are imported directly by file path (e.g., `import { useCreateTeacherOnboarding } from "@/frontend/common/hooks/useCreateTeacherOnboarding"`). This hook follows the same pattern — no barrel export needed.

## Exact Export Name

```typescript
useCreateGeneralUser
```

**Import path**: `@/frontend/common/hooks/useCreateGeneralUser`

## Return Type Shape

```typescript
{
  execute: (input: GeneralUserCreateInput) => Promise<void>;
  loading: boolean;
  error: ApolloError | undefined;
}
```

- **`execute`**: Takes `GeneralUserCreateInput` (GraphQL codegen type from `graphql-types.ts`) — the same type the mutation document's `variables.input` expects. Returns `Promise<void>` (re-throws on error).
- **`loading`**: From `useMutation`'s `loading` state.
- **`error`**: From `useMutation`'s `error` state (`ApolloError | undefined`).

## How Cache Eviction Is Done

Following the exact pattern from existing hooks (`useCreateManagerOnboarding`, `useCreateTeacherOnboarding`):

1. **Access cache**: `const { cache } = useApolloClient();` — gets the Apollo cache via `useApolloClient` hook.
2. **Evict**: `cache.evict({ id: "ROOT_QUERY", fieldName: "users" })` — evicts the `users` root query from the cache, causing any `useQuery` watching the `users` query to refetch on next render.
3. **Garbage collect**: `cache.gc()` — cleans up orphaned cache entries after eviction.
4. **Timing**: Cache eviction happens in the success path, after the mutation resolves with data, before setting the store result. This mirrors the `managerDirectory` eviction in `useCreateManagerOnboarding`.

## How the Zustand Store Is Integrated

```typescript
// Before mutation (start of execute):
useGeneralUserOnboardingStore.getState().reset();
useGeneralUserOnboardingStore.getState().setIsSubmitting(true);

// On success:
cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
cache.gc();
useGeneralUserOnboardingStore.getState().setResult(result.data.createGeneralUser);
useGeneralUserOnboardingStore.getState().setIsSubmitting(false);

// On error:
const errorInstance = err instanceof Error ? err : new Error(String(err));
useGeneralUserOnboardingStore.getState().setError(errorInstance);
useGeneralUserOnboardingStore.getState().setIsSubmitting(false);
throw errorInstance;
```

### Store Access Pattern

Uses `store.getState()` for direct access (matching the existing pattern in `useCreateManagerOnboarding` which uses `useStaffOnboardingStore.getState().reset()` / `setState`). The store's individual setters (`setIsSubmitting`, `setResult`, `setError`) are called via `getState()` — these are the ergonomic API added in the Task 10 store.

### Error Handling

The store's `error` type is `Error | null` (not `string | null` like existing stores). The hook wraps non-Error thrown values: `err instanceof Error ? err : new Error(String(err))` before calling `setError`.

### Why Store Type Was Changed (Codegen vs Backend)

**Problem**: Task 10's store used `GeneralUserCreateResult` from `@/backend/types`, which has non-nullable fields:
```typescript
// Backend type (backend/types):
{ user: UserReturnType; assignedGroupSlug: string }  // non-nullable
```

But the Apollo mutation result returns the codegen type from `Operations.CreateGeneralUserMutation`, which has nullable fields:
```typescript
// Codegen type (graphql-types.ts):
{ id: string | null; assignedGroupSlug: string | null; user: User | null }
```

These types are structurally incompatible — `null` cannot be assigned to `UserReturnType`.

**Fix**: Changed the store's `GeneralUserCreateResult` import to the codegen type from `@/frontend/common/graphql/generated/gql/graphql-types`. This:
1. Matches the convention of ALL existing onboarding stores (they all import types from `graphql-types.ts`)
2. Follows the `frontend/common/stores/AGENTS.md` rule: "Strictly typed using GraphQL generated types (import from `graphql-types.ts`)"
3. Makes the store's `result` type match the mutation's actual return shape
4. The `assignedGroupSlug` and `user` fields are now nullable in the store — the ViewModel (Task 11) must null-check before displaying

## Import Details

### Hook File

| Import | Path | Type | Rationale |
|--------|------|------|-----------|
| `useApolloClient`, `useMutation` | `@apollo/client/react` | value | Apollo hooks — from `@apollo/client/react`, NOT `@apollo/client` (per rules) |
| `GeneralUserCreateInput` | `@/frontend/common/graphql/generated/gql/graphql-types` | `import type` | Input type for the execute function — codegen type matching mutation variables (same as existing hooks use codegen input types) |
| `createGeneralUserMutationDocument` | `@/frontend/common/graphql/sharedDocuments` | value | The TypedDocumentNode (from barrel, Task 7) |
| `useGeneralUserOnboardingStore` | `@/frontend/common/stores/generalUserOnboardingStore` | value | Zustand store hook (from Task 10) |
| `logger` | `@/frontend/common/utils/logger` | value | Error logging (never `console.*`) |

### Store File (Modified)

| Import Change | From | To |
|---------------|------|-----|
| `GeneralUserCreateResult` | `@/backend/types` | `@/frontend/common/graphql/generated/gql/graphql-types` |

## Verification Results

### `useCreateGeneralUser.ts` — sub-loop.ts --lifecycle codescene (exit 0)

```
✅ tsgo passed (no errors for frontend/common/hooks/useCreateGeneralUser.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

### `generalUserOnboardingStore.ts` — sub-loop.ts --lifecycle codescene (exit 0)

```
✅ tsgo passed (no errors for frontend/common/stores/generalUserOnboardingStore.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

## Semantic Review Checklist

- [x] `useMutation` imported from `@apollo/client/react` (NOT `@apollo/client`)
- [x] `useApolloClient` imported from `@apollo/client/react` for cache access
- [x] `createGeneralUserMutationDocument` imported from barrel `@/frontend/common/graphql/sharedDocuments`
- [x] `GeneralUserCreateInput` imported from `graphql-types.ts` (codegen), matching existing hook pattern
- [x] `useGeneralUserOnboardingStore` used via `getState()` for store access (matching existing pattern)
- [x] Cache eviction: `cache.evict({ id: "ROOT_QUERY", fieldName: "users" })` + `cache.gc()` (matching existing hooks)
- [x] `setIsSubmitting(true)` before mutation, `setIsSubmitting(false)` after (success or error)
- [x] `setResult` called with mutation data on success
- [x] `setError` called with `Error` instance on failure (store expects `Error | null`, not `string`)
- [x] `reset()` called at start of `execute` to clear previous state
- [x] `logger.error` used for error logging (never `console.*`)
- [x] Error wrapping: `err instanceof Error ? err : new Error(String(err))` — safe for non-Error throws
- [x] Hook re-throws the error after setting store state (caller can handle/propagate)
- [x] Named export: `export function useCreateGeneralUser()`
- [x] All imports use `@/` path aliases (no relative `./` or `../`)
- [x] No `useLazyQuery` — uses `useMutation` exclusively
- [x] Returns `{ execute, loading, error }` (no `data` — the result is in the store)
- [x] No barrel file needed (matches existing hooks directory convention)

## Differences from Existing Hooks

### What's the Same
- Import pattern (`useMutation` from `@apollo/client/react`)
- Cache eviction pattern (`cache.evict` + `cache.gc`)
- Store access pattern (`store.getState().reset()` / `setState` / setters)
- Error logging pattern (`logger.error` with `{ err }`)
- Return shape (`{ execute, loading, error }`)

### What's Different (Intentionally)
- **No `data` in return**: Existing hooks return `{ execute, loading, error, data }`. This hook returns `{ execute, loading, error }` — the mutation result is stored in the Zustand store, not returned to the component. This matches the task spec.
- **Store uses `Error | null`**: Existing stores use `error: string | null` (e.g., `"operationFailed"`). This store uses `Error | null`. The hook wraps errors in `Error` instances.
- **Store uses individual setters**: Existing stores only have `reset()`, accessed via `setState`. This hook uses the explicit `setIsSubmitting`, `setResult`, `setError` setters provided by the Task 10 store.
- **No form data mapping**: Existing hooks accept form data types (`TeacherOnboardingFormData`, etc.) and map them to mutation input. This hook accepts `GeneralUserCreateInput` directly — the ViewModel (Task 11) handles form-to-input mapping. This separates concerns: the hook is a thin mutation wrapper, the ViewModel owns form validation and field mapping.

## Carry-Forward Knowledge for Task 11 (ViewModel)

### Import & Usage

```typescript
import { useCreateGeneralUser } from "@/frontend/common/hooks/useCreateGeneralUser";
import type { GeneralUserCreateInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useGeneralUserOnboardingStore } from "@/frontend/common/stores/generalUserOnboardingStore";
```

### Calling the Hook

```typescript
const { execute, loading, error } = useCreateGeneralUser();

// Build input from form data (TypeScript using codegen AccountStatus enum):
const input: GeneralUserCreateInput = {
  name: formData.name,
  email: formData.email,
  password: formData.password,
  phone: formData.phone || undefined,  // optional — undefined or string
  groupSlug: formData.groupSlug,
  status: formData.status,             // optional — AccountStatus codegen enum or undefined
};

await execute(input);
```

### Reading the Result from Store

After `execute` succeeds, the result is in the Zustand store:

```typescript
const result = useGeneralUserOnboardingStore(state => state.result);
const isSubmitting = useGeneralUserOnboardingStore(state => state.isSubmitting);
const storeError = useGeneralUserOnboardingStore(state => state.error);

// NOTE: result.user and result.assignedGroupSlug are nullable in store (codegen type)
// Must null-check before using:
if (result?.user?.id) {
  // Display success — user created
}
```

### Important Notes for ViewModel

1. **Form-to-input mapping**: The ViewModel maps `GeneralUserCreateFormData` (Zod-validated, from Task 8) to `GeneralUserCreateInput` (codegen, from `graphql-types.ts`). Key mappings:
   - `phone: formData.phone || undefined` — Zod optional string → optional `string | undefined` (Apollo skips `undefined`)
   - `status: formData.status` — Zod defaults to `AccountStatus.Activated`; codegen enum is structurally compatible (same string values)

2. **Status enum compatibility**: The Zod schema (Task 8) uses `z.enum(AccountStatus)` with the codegen enum from `graphql-types.ts`. The `GeneralUserCreateInput.status` also expects the codegen `AccountStatus`. No type mapping needed — both are the same codegen enum.

3. **Store result is nullable**: `result?.user` and `result?.assignedGroupSlug` are `| null` in the codegen type. The ViewModel must null-check before rendering.

4. **Error handling**: The hook re-throws after setting the store. The ViewModel can either rely on the store's `error` state or catch the thrown error from `execute()` — both will have the error. Using the store's `error` state is cleaner for reactive UI updates.

5. **Loading state**: Use the `loading` from the hook return value OR `isSubmitting` from the store — they are kept in sync. `loading` is Apollo's mutation loading state; `isSubmitting` is the store's manual flag. Both are set together. Prefer `isSubmitting` from the store for UI binding (survives re-renders and tier switches).

## Cross-File Dependencies Discovered & Fixed

### Store Type Incompatibility (Fixed)

- **Problem**: `generalUserOnboardingStore.ts` (Task 10) imported `GeneralUserCreateResult` from `@/backend/types` — incompatible with the mutation's codegen result type (nullable vs non-nullable fields).
- **Fix**: Changed import to `@/frontend/common/graphql/generated/gql/graphql-types` — the codegen type with matching nullable fields.
- **Scope**: Only the import line changed in the store. The store state shape, setter functions, and behavior remain identical.

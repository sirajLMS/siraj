# Task 10 Outcome: Zustand Store — generalUserOnboardingStore

## Date: 2026-08-14

## Summary

Created a Zustand store `useGeneralUserOnboardingStore` to manage the state of the general user creation flow. The store is a simple state container with `isSubmitting`, `error`, `result` fields, individual setters for each, and a `reset()` method. It follows the established Zustand pattern in the codebase (matching `staffOnboardingStore`, `parentOnboardingStore`, `teacherOnboardingStore`) while adding the individual setters required by the task spec.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/common/stores/generalUserOnboardingStore.ts` | `useGeneralUserOnboardingStore` Zustand store hook |

## Files NOT Modified

- **No barrel file** exists at `frontend/common/stores/index.ts`. All existing onboarding stores are imported directly by file path (e.g., `import { useStaffOnboardingStore } from "@/frontend/common/stores/staffOnboardingStore"`). This store follows the same pattern — no barrel export needed.

## Exact Export Name

- **Store hook name**: `useGeneralUserOnboardingStore`
- **Import path**: `@/frontend/common/stores/generalUserOnboardingStore`

## Store State Shape

```typescript
interface GeneralUserOnboardingState {
  readonly isSubmitting: boolean;
  readonly error: Error | null;
  readonly result: GeneralUserCreateResult | null;
  readonly setIsSubmitting: (value: boolean) => void;
  readonly setError: (error: Error | null) => void;
  readonly setResult: (result: GeneralUserCreateResult | null) => void;
  readonly reset: () => void;
}
```

### Initial Values

| Field | Initial Value |
|-------|---------------|
| `isSubmitting` | `false` |
| `error` | `null` |
| `result` | `null` |

### Setter Behavior

| Method | Behavior |
|--------|----------|
| `setIsSubmitting(value)` | Sets `isSubmitting` to `value` |
| `setError(error)` | Sets `error` to the provided `Error` or `null` |
| `setResult(result)` | Sets `result` to the provided `GeneralUserCreateResult` or `null` |
| `reset()` | Sets all fields back to initial values (`false`, `null`, `null`) |

## Type Import

```typescript
import type { GeneralUserCreateResult } from "@/backend/types";
```

- `GeneralUserCreateResult` is defined in `backend/types/users/user.types.ts` (added in Task 2)
- Shape: `{ readonly user: UserReturnType; readonly assignedGroupSlug: string }`
- Accessible via `@/backend/types` barrel (no deep import needed)
- Uses `import type` since it's only used as a type annotation

## Pattern Followed

The store follows the established pattern from existing onboarding stores (`staffOnboardingStore`, `parentOnboardingStore`, `teacherOnboardingStore`):

1. `import { create } from "zustand"` — Zustand import
2. `create<StoreInterface>(set => ({...}))` — typed store creator with curried generic
3. `readonly` on all interface fields (state + functions)
4. Arrow function setters using `set({...})`
5. `reset()` sets all fields back to initial values
6. No `persist` middleware — in-memory state only (no localStorage serialization)

**Key difference from existing stores**: Existing stores (`staffOnboardingStore`, etc.) only have `reset()` — no individual setters. Task 9 (the hook) uses `store.getState().reset()` and `store.setState({...})` directly. This store adds `setIsSubmitting`, `setError`, `setResult` per the task spec requirement, providing a more ergonomic API for Task 9's hook to use.

## Verification Results

### sub-loop.ts --lifecycle codescene (exit 0)

```
✅ tsgo passed (no errors for frontend/common/stores/generalUserOnboardingStore.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

All checks passed on the first run — no fixes needed.

## Semantic Review Checklist

- [x] Store is a simple state container — no business logic, no async operations
- [x] No mutable state leaks — all state mutated via `set()` calls
- [x] All initial values are primitives/`null` — no non-serializable values
- [x] No `persist` middleware — no serialization concerns
- [x] `reset()` sets ALL fields back to initial values (`false`, `null`, `null`)
- [x] All imports use `@/` path aliases (no relative `./` or `../`)
- [x] `import type` used for type-only import
- [x] `readonly` on all interface members
- [x] Store hook name follows `use<Name>Store` convention → `useGeneralUserOnboardingStore`

## Carry-Forward Knowledge for Task 9 (useCreateGeneralUser Hook)

### Import & Usage

```typescript
import { useGeneralUserOnboardingStore } from "@/frontend/common/stores/generalUserOnboardingStore";
```

### Two Usage Patterns

**Pattern A — Using individual setters (new pattern enabled by this store):**

```typescript
const store = useGeneralUserOnboardingStore;

// At start of execute:
store.getState().reset();
store.getState().setIsSubmitting(true);

// On success:
store.getState().setResult(result);
store.getState().setIsSubmitting(false);

// On error:
store.getState().setError(err instanceof Error ? err : new Error(String(err)));
store.getState().setIsSubmitting(false);
```

**Pattern B — Using `setState` directly (existing pattern from other onboarding hooks):**

```typescript
import { useGeneralUserOnboardingStore } from "@/frontend/common/stores/generalUserOnboardingStore";

// At start of execute:
useGeneralUserOnboardingStore.getState().reset();
useGeneralUserOnboardingStore.setState({ isSubmitting: true });

// On success:
useGeneralUserOnboardingStore.setState({ result, isSubmitting: false });

// On error:
useGeneralUserOnboardingStore.setState({ error: err, isSubmitting: false });
```

**Recommendation**: Task 9 should use **Pattern A** (individual setters) since it's the explicit API provided by this store. However, Pattern B (`setState` with partial update) also works since Zustand stores always expose `setState`.

### Important: `error` Type is `Error | null` (Not `string | null`)

Unlike existing onboarding stores which use `error: string | null`, this store uses `error: Error | null`. Task 9's hook must wrap errors in an `Error` object when setting the store:

```typescript
// Correct:
useGeneralUserOnboardingStore.getState().setError(err instanceof Error ? err : new Error(String(err)));

// Wrong (won't compile):
useGeneralUserOnboardingStore.getState().setError("operationFailed"); // string, not Error
```

### Store State Access in Components

Components can subscribe to the store with selectors:

```typescript
const isSubmitting = useGeneralUserOnboardingStore(state => state.isSubmitting);
const error = useGeneralUserOnboardingStore(state => state.error);
const result = useGeneralUserOnboardingStore(state => state.result);
const reset = useGeneralUserOnboardingStore(state => state.reset);
```

## Cross-File Dependencies Discovered

None. The `GeneralUserCreateResult` type was already available in `@/backend/types` from Task 2. No barrel file needed at `frontend/common/stores/index.ts` (existing onboarding stores don't use one).

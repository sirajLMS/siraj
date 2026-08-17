# Task 1 Outcome: Specialized Group Slugs Constant

## Date: 2026-08-14

## Summary

Created `shared/constants/specialized-groups.constants.ts` defining the three specialized permission group slugs (student, teacher, parent) as a readonly tuple, a `Set<string>` for O(1) lookups, and a pure `isSpecializedGroup` predicate function.

## Files Created

| File | Purpose |
|------|---------|
| `shared/constants/specialized-groups.constants.ts` | Specialized group slug constants + `isSpecializedGroup` predicate |

## Files Modified

None.

## Implementation Details

- **`SPECIALIZED_GROUP_SLUGS`**: `as const` readonly tuple of three `SystemPermissionGroupSlug` enum members (`STUDENT_DEFAULT`, `TEACHER_DEFAULT`, `PARENT_DEFAULT`).
- **`SPECIALIZED_GROUP_SLUG_SET`**: `Set<string>` constructed from the tuple for O(1) membership checks.
- **`isSpecializedGroup(slug: string): boolean`**: Pure function — delegates to `Set.has()`, no side effects, no external state.

### Imports

- `SystemPermissionGroupSlug` imported from `@/shared/constants/permission-group.enum` (shared layer — no cross-layer imports).

## Verification Results

### sub-loop.ts --lifecycle codescene (exit 0)

```
✅ tsgo passed (no errors for shared/constants/specialized-groups.constants.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

All six quality stages passed on the first run with zero errors and zero warnings.

## Semantic Review Checklist

- [x] **No mutable state**: All declarations use `const`; the `Set` is constructed once at module load and never mutated.
- [x] **All enums imported as values**: `import { SystemPermissionGroupSlug }` — value import (not `import type`), since enum members are used at runtime.
- [x] **No cross-layer imports**: Only import is from `@/shared/constants/permission-group.enum` — same layer. No `@/backend/**` or `@/frontend/**` imports.
- [x] **`isSpecializedGroup` is pure**: Takes a string, returns a boolean, no side effects, deterministic output for same input.

## shared/AGENTS.md Compliance

- ✅ **Layer isolation**: No imports from `@/frontend/**`, `@/backend/**`, or `@/app/**`.
- ✅ **Import convention**: Uses `@/` path alias (not relative `./` or `../`).
- ✅ **Deep import over barrel**: Imports directly from `@/shared/constants/permission-group.enum`, not a barrel.
- ✅ **File placement**: Constants file placed in `shared/constants/` per the directory organization table.
- ✅ **Enum usage**: Uses dot access (`SystemPermissionGroupSlug.STUDENT_DEFAULT`) per shared enum rules.

## Carry-Forward Knowledge for Future Subtasks

1. **`SystemPermissionGroupSlug` enum** lives at `shared/constants/permission-group.enum.ts` with 7 members: `SUPER_ADMIN`, `ACADEMY_ADMIN`, `TEACHER_DEFAULT`, `PARENT_DEFAULT`, `STAFF_DEFAULT`, `SUPERVISOR_DEFAULT`, `STUDENT_DEFAULT`. The three "specialized" groups are student, teacher, parent (but NOT staff or supervisor).

2. **`isSpecializedGroup`** is available for import from `@/shared/constants/specialized-groups.constants` by both frontend and backend layers. Future tasks that need to check if a permission group triggers specialized onboarding logic should use this function.

3. **`SPECIALIZED_GROUP_SLUG_SET`** is available for cases where the consumer needs the Set directly (e.g., filtering arrays of slugs).

4. **The `as const` assertion** on `SPECIALIZED_GROUP_SLUGS` makes the tuple readonly with literal enum types — consumers can iterate or index but cannot mutate. The `Set<string>` constructor accepts it without type errors because enum string values are assignable to `string`.

5. **Sub-loop discovery**: The file matched no instruction files (only `AGENTS.md` root). This is expected for `shared/constants/` files — they are pure data/utility modules.

## Cross-File Dependencies Discovered

None. This file is self-contained — only depends on the pre-existing `permission-group.enum.ts` in the same directory.

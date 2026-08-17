# Task 2: Backend Types — GeneralUserCreateInput & GeneralUserCreateResult

## Date: 2026-08-14

## Summary

Added two new TypeScript interfaces to `backend/types/users/user.types.ts`:

1. **`GeneralUserCreateInput`** — Input shape for the general user creation mutation. Contains `name`, `email`, `password`, optional `phone`, `groupSlug` (the permission group to assign), and optional `status` (defaults to service-layer default if omitted).
2. **`GeneralUserCreateResult`** — Return shape from the general user creation service. Contains the created `user` (as `UserReturnType`) and `assignedGroupSlug` (the actual group slug that was assigned, useful for confirmation/display).

## Files Modified

| File | Change |
|---|---|
| `backend/types/users/user.types.ts` | Added `GeneralUserCreateInput` and `GeneralUserCreateResult` interfaces (lines 97–109) |

## Files NOT Modified (already correct)

- `backend/types/users/index.ts` — already has `export * from "./user.types"`, so new types automatically flow through.
- `backend/types/index.ts` — already has `export * from "./users"`, so types are accessible via `@/backend/types`.
- No new imports needed — `AccountStatus` was already imported as `import type { AccountStatus, UserRole } from "@/backend/enum"` (line 2) and `UserReturnType` is defined in the same file (line 20).

## Verification Results (sub-loop.ts)

```
✅ tsgo passed (no errors for backend/types/users/user.types.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed for backend/types/users/user.types.ts
```

Exit code: 0 — all checks green on first run.

## Semantic Review Checklist

- [x] No cross-layer imports in types — all imports are from `@/backend/enum`, `@/backend/db/schema`, `@/shared/constants` (correct layer boundaries)
- [x] Enums imported as values where needed — `AccountStatus` is imported as `import type` which is sufficient here since it's only used in type positions (interface field annotations). No runtime usage of the enum value is needed in a `.types.ts` file.
- [x] Types have `readonly` properties — both interfaces use `readonly` on all fields
- [x] No duplicate type definitions — `GeneralUserCreateInput` is distinct from the existing `UserCreateInput` (which has `email: { value: string }` shape) and `UserCreateCoreInput` (which has `avatarUrl` instead of `groupSlug`/`status`)

## Carry-Forward Knowledge for Future Subtasks

### AccountStatus Import Path
- **Enum definition**: `backend/enum/auth/auth.enum.ts` — `export enum AccountStatus { ... }`
- **Canonical import**: `import { AccountStatus } from "@/backend/enum"` (re-exported via `backend/enum/index.ts` → `./auth/auth.enum`)
- **Type-only import**: `import type { AccountStatus, UserRole } from "@/backend/enum"` is the existing pattern in `user.types.ts` and is sufficient for type-only usage
- **Value import**: If a service file needs to compare against enum members at runtime (e.g., `if (status === AccountStatus.ACTIVE)`), use a **value import**: `import { AccountStatus } from "@/backend/enum"` (NOT `import type`)
- **Shared layer duplicate**: `shared/constants/auth.enum.ts` also exports `AccountStatus` — frontend code should use GraphQL codegen enums, not this backend enum
- **Type alias**: `user.types.ts` exports `UserStatus = AccountStatus` as an alias for canonical pattern compliance. Future subtasks may use either `AccountStatus` or `UserStatus` interchangeably.

### UserReturnType
- Defined in `backend/types/users/user.types.ts` (line 20–35) as `Omit<UserSelectType, ...> & { role: UserRole; status: UserStatus; timezone: IanaTimezone; displayCurrency: CurrencyCode | null; teacherId?: string | null; parentId?: string | null }`
- Accessible via `@/backend/types` barrel (no direct deep import needed)

### GeneralUserCreateInput vs Existing Types
- `UserCreateInput` (existing): used by the current user creation flow, has `email: { value: string }` (wrapped), no `groupSlug` or `status` — different shape entirely
- `UserCreateCoreInput` (existing): used by onboarding flows (teacher/parent/student/manager), has `avatarUrl`, no `groupSlug` or `status`
- `GeneralUserCreateInput` (new): the Task 2 addition, specifically for the general "create user" admin flow with group assignment and status control

## Cross-File Dependencies Discovered

- **None blocking**. The `backend/enum` barrel already exports `AccountStatus` correctly. No other files needed modification for this task.
- Future Task 3 (service layer) will import `GeneralUserCreateInput` and `GeneralUserCreateResult` from `@/backend/types` — they are already accessible via the barrel chain.

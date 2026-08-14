# Task 4 Outcome: GraphQL Pothos Types — GeneralUserCreate

## Date: 2026-08-14

## Summary

Created `backend/graphql/pothos/users/general-user-create.pothos.ts` defining two Pothos types for the general user creation mutation:

1. **`GeneralUserCreateInputPothosObject`** — an input type backed by `GeneralUserCreateInput` from `@/backend/types`, with fields: `name` (required), `email` (required), `password` (required), `phone` (optional), `groupSlug` (required), `status` (optional, uses `AccountStatusPothosObject` enum).
2. **`GeneralUserCreateResultPothosObject`** — an object type backed by `GeneralUserCreateResult` from `@/backend/types`, with fields: `id` (resolved from `parent.user.id` for Apollo cache normalization), `user` (references existing `UserPothosObject`), `assignedGroupSlug` (exposed string).

## Files Created

| File | Purpose |
|------|---------|
| `backend/graphql/pothos/users/general-user-create.pothos.ts` | Pothos input + result type definitions for general user creation |

## Files Modified

| File | Change |
|------|--------|
| `backend/graphql/pothos/users/index.ts` | Added `export * from "./general-user-create.pothos"` to barrel (alphabetically before `./user.pothos`) |

## Exact Names Used (for Task 5 reference)

### User Object Type
- **Export name**: `UserPothosObject`
- **Import path**: `@/backend/graphql/pothos/users/user.pothos`
- **Definition**: `gqlSchemaBuilder.loadableObject` backed by `UserReturnType` — a loadable object with DataLoader batch support (`UserRepository.loadByIds`)

### AccountStatus Enum
- **Export name**: `AccountStatusPothosObject` (NOT `AccountStatusPothosEnum`)
- **Import path**: `@/backend/graphql/pothos/shared/enum.pothos`
- **Definition**: `gqlSchemaBuilder.enumType(AccountStatus, { name: "AccountStatus" })` — registered in `shared/enum.pothos.ts` using the enum-object form

### gqlSchemaBuilder
- **Import path**: `@/backend/graphql/gqlSchemaBuilder`
- **Usage**: `gqlSchemaBuilder.inputRef<T>("Name").implement({...})` for input types, `gqlSchemaBuilder.objectRef<T>("Name").implement({...})` for object types

## Key Implementation Decisions

### 1. `id` field on result type
The `GeneralUserCreateResultPothosObject` includes an `id` field resolved from `parent.user.id`. This follows the critical rule that all GraphQL object types must expose an `id` field for Apollo cache normalization. Since `GeneralUserCreateResult` is a wrapper type (not a DB entity), the `id` is delegated from the nested user.

### 2. `@/` path alias for all imports (including same-directory)
The lint rule `no-restricted-syntax` enforces `@/` path aliases for ALL imports — even relative imports within the same directory (`./user.pothos`) are rejected. The `UserPothosObject` import uses the full `@/backend/graphql/pothos/users/user.pothos` path.

### 3. Constraint directives
Input string fields include `directives: { constraint: { maxLength: N } }` following the existing pattern from `teacher-onboarding.pothos.ts` and `manager-onboarding.pothos.ts` for server-side validation.

### 4. `phone` field is optional (not required)
`GeneralUserCreateInput.phone` is `string | null | undefined` (optional). The Pothos field `t.string({ directives: ... })` without `required: true` correctly maps to an optional GraphQL input field.

### 5. `status` field is optional (not required)
`GeneralUserCreateInput.status` is `AccountStatus | undefined` (optional). The Pothos field `t.field({ type: AccountStatusPothosObject })` without `required: true` correctly maps to an optional GraphQL enum input field.

## Verification Results

### sub-loop.ts --lifecycle codescene (exit 0)

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

Both `general-user-create.pothos.ts` and `index.ts` passed all six quality stages on first run (after fixing the relative import → `@/` alias).

## Semantic Review Checklist

- [x] No local type definitions — all types from `@/backend/types` (`GeneralUserCreateInput`, `GeneralUserCreateResult`)
- [x] No hardcoded enum values — uses existing `AccountStatusPothosObject` from `shared/enum.pothos`
- [x] Single canonical user object type reused — `UserPothosObject` imported, not redefined
- [x] Barrel exports follow conventions — `export * from "./general-user-create.pothos"`, `./` paths, max one `/`
- [x] `id` field exposed on result type for Apollo cache normalization
- [x] `gqlSchemaBuilder` imported from `@/backend/graphql/gqlSchemaBuilder` (correct path)
- [x] All imports use `@/` path aliases (no relative `./` or `../` in source files)

## Carry-Forward Knowledge for Task 5 (Mutation Registration)

1. **Export names for mutation**: `GeneralUserCreateInputPothosObject` (input) and `GeneralUserCreateResultPothosObject` (result) — both exported from `@/backend/graphql/pothos/users` barrel
2. **Service method**: `GeneralUserOnboardingService.createGeneralUser(actorUserId, input, locale?, tx?)` returns `GeneralUserCreateResult` — see Task 3 outcome
3. **Permission**: `AppPermission.STAFF_CREATE` — the mutation resolver should check this permission before calling the service
4. **The `UserPothosObject` is a loadableObject** — it uses DataLoader under the hood. The result type's `user` field resolves directly from `parent.user` (no async needed since the user object is already materialized in the result).
5. **Barrel already exports the new types** — Task 5 can import from `@/backend/graphql/pothos/users` or directly from the file
6. **Schema regeneration needed after Task 5**: Once the mutation is registered, run `bun run generate:gqlSchema` then `bun codegen` to sync the frontend codegen types

# Task 3 Outcome: GeneralUserOnboardingService

## Summary

Created `GeneralUserOnboardingService` with a `createGeneralUser` static method that wraps `UserOnboardingService.createUserOfType<void>` for general user creation. The service:
1. Rejects specialized group slugs (student, teacher, parent) with a localized error
2. Verifies the target permission group exists via `PermissionManagementRepository.findGroupBySlug`
3. Delegates to the shared onboarding pipeline with no extension row (`createExtension: async () => undefined`)
4. Returns `{ user, assignedGroupSlug }`

## Files Created

| File | Purpose |
|------|---------|
| `backend/services/user/general-user-onboarding.service.ts` | `GeneralUserOnboardingService` namespace with `createGeneralUser` |

## Files Modified

| File | Change |
|------|--------|
| `backend/services/user/index.ts` | Added `export * from "./general-user-onboarding.service"` to barrel |
| `backend/services/user/user-onboarding.service.ts` | Widened `groupSlug` type from `SystemPermissionGroupSlug` → `string` in `CreateUserOfTypeOptions` to support custom (non-system) group slugs; removed unused `SystemPermissionGroupSlug` import |
| `shared/locale/types/errors/index.ts` | Added `specializedGroupNotAllowed: string` to `ErrorsLabels` interface |
| `shared/locale/en/errors/index.ts` | Added English `specializedGroupNotAllowed` error message |
| `shared/locale/ar/errors/index.ts` | Added Arabic `specializedGroupNotAllowed` error message |

## `findGroupBySlug` — Already Existed

`PermissionManagementRepository.findGroupBySlug` already existed (lines 218-229). **No changes needed** to the repository.

Signature:
```typescript
export async function findGroupBySlug(
  slug: string,
  tx?: DBTransaction
): Promise<{ id: string; slug: string; isSystem: boolean } | null>
```

## ACTUAL `createUserOfType` Signature (for future reference)

```typescript
export async function createUserOfType<TExtension>(
  opts: CreateUserOfTypeOptions<TExtension>,
  tx?: DBTransaction
): Promise<CreateUserOfTypeResult<TExtension>>
```

### `CreateUserOfTypeOptions<TExtension>` shape:
```typescript
interface CreateUserOfTypeOptions<TExtension> {
  readonly actorUserId: string;
  readonly permission: AppPermission;
  readonly coreInput: UserCreateCoreInput;           // { name, email, password, avatarUrl? }
  readonly profileFields?: UserCreateProfileFieldsInput; // { phone?, timezone?, displayCurrency? }
  readonly validatePassword?: boolean;
  readonly groupSlug: string | ((extension: TExtension) => string);  // ← WIDENED from SystemPermissionGroupSlug
  readonly writeDefaultTimezone?: boolean;
  readonly preChecks?: () => Promise<void>;
  readonly createExtension: (user: UserReturnType, tx: DBTransaction) => Promise<TExtension>;
  readonly afterExtension?: (user: UserReturnType, extension: TExtension, tx: DBTransaction) => Promise<void>;
  readonly locale?: string;
  readonly tErrors: ErrorsLabels;
  readonly logTag: string;
}
```

### `CreateUserOfTypeResult<TExtension>` shape:
```typescript
interface CreateUserOfTypeResult<TExtension> {
  readonly user: UserReturnType;
  readonly extension: TExtension;
}
```

### Key details:
- **Single options object** + optional `tx` — NOT positional params
- **`groupSlug`**: can be a string or a function `(extension) => string` (for dynamic slugs like manager)
- **`createExtension`**: required, receives `(user, tx)`, returns `Promise<TExtension>`. For general users with `void`, use `async () => undefined`
- **`afterExtension`**: optional, receives `(user, extension, tx)`. For general users, use `async () => {}`
- **`tErrors`**: required `ErrorsLabels` object — must be obtained via `getServerTranslations(locale).errorsTranslations`
- **`logTag`**: used in success log message
- **`validatePassword`**: set `true` to run password strength validation

### `getServerTranslations` API (confirmed):
- File: `shared/locale/server-graphql.ts`
- Signature: `getServerTranslations(locale: string): Translations` — **synchronous**, NO namespace parameter
- Access errors: `.errorsTranslations` returns `ErrorsLabels`
- Import from: `@/shared/locale/server-graphql` (direct) or `@/shared/locale` (barrel)

## Service Method Signature

```typescript
namespace GeneralUserOnboardingService {
  export async function createGeneralUser(
    actorUserId: string,
    input: GeneralUserCreateInput,     // { name, email, password, phone?, groupSlug, status? }
    locale?: string,
    tx?: DBTransaction
  ): Promise<GeneralUserCreateResult>   // { user: UserReturnType, assignedGroupSlug: string }
}
```

## `groupSlug` Type Widening — Cross-File Dependency

**Issue**: `createUserOfType` originally typed `groupSlug` as `SystemPermissionGroupSlug`, but general users can be assigned to **custom** (non-system) permission groups whose slugs are not enum members. The pipeline string-compares the slug internally (`const slugStr: string = slug`), so any string works at runtime.

**Fix**: Widened `groupSlug` type in `CreateUserOfTypeOptions` from `SystemPermissionGroupSlug` → `string`. This is backward-compatible: `SystemPermissionGroupSlug` is a string enum, so all existing callers passing enum values still type-check.

**Alternative considered**: Type guard `value is SystemPermissionGroupSlug` — rejected because it can't narrow custom slugs that aren't enum members, and the oxlint `--deny-warnings` flag makes `no-unsafe-type-assertion` warnings fail the gate.

**Permission used**: `AppPermission.STAFF_CREATE` per design.md REQ-2.

## Verification Results

All files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene):

| File | Result |
|------|--------|
| `backend/services/user/general-user-onboarding.service.ts` | ✅ All checks passed |
| `backend/services/user/user-onboarding.service.ts` | ✅ All checks passed |
| `backend/services/user/index.ts` | ✅ All checks passed |
| `shared/locale/types/errors/index.ts` | ✅ All checks passed |
| `shared/locale/en/errors/index.ts` | ✅ All checks passed |
| `shared/locale/ar/errors/index.ts` | ✅ All checks passed |

## Semantic Review Checklist

- [x] All writes in same transaction (pass `tx` to all repository methods)
- [x] No module-level mutable state
- [x] No cross-layer imports (frontend → backend, shared → backend)
- [x] Service delegates to repository (`findGroupBySlug`), not direct DB access
- [x] Localized errors via `getServerTranslations` (not hardcoded strings)
- [x] `createUserOfType` called with correct parameter shape (single options object + tx)
- [x] `profileFields.phone` passed directly (not spread) — `UserCreateProfileFieldsInput.phone` accepts `string | null | undefined`
- [x] `validatePassword: true` — general users should have password strength validation
- [x] `logTag: "GeneralUser"` — for log identification

## Carry-Forward Knowledge for Future Subtasks

1. **`createUserOfType` groupSlug type is now `string`** — any future caller can pass custom group slugs without type assertions
2. **`getServerTranslations(locale)` is synchronous** — returns `Translations` object, access `.errorsTranslations` for `ErrorsLabels`
3. **`findGroupBySlug` exists** in `PermissionManagementRepository` — returns `{ id, slug, isSystem } | null`
4. **`specializedGroupNotAllowed` error key** now exists in `ErrorsLabels` — available for any future code that needs to reject specialized groups
5. **General user creation uses `AppPermission.STAFF_CREATE`** — the permission check is done inside `createUserOfType`, not in the service
6. **`createExtension: async () => undefined`** is the pattern for `void` TExtension — returns `undefined` which satisfies `Promise<void>`
7. **`afterExtension: async () => {}`** — no-op for general users since there's no extension row
8. **`profileFields: { phone: input.phone }`** — `phone` is `string | null | undefined`, pass directly without conditional spread

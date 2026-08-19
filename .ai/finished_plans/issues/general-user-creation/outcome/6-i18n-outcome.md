# Task 6 Outcome: i18n Namespace `dashboard.users.createUser`

## Date: 2026-08-14

## Summary

Created a complete i18n namespace for the "Create General User" feature page, following the project's compile-time TypeScript i18n system. This involved creating 8 files across 4 directories (types, en, ar, namespaces) plus 4 barrel files, and modifying 3 existing registration files (translation.ts, message.ts, en/messages.ts, ar/messages.ts).

## Files Created

| File | Purpose |
|------|---------|
| `shared/locale/types/dashboard/users/createUser.ts` | `CreateUserLabels` interface — 23 string properties + nested `sections` object |
| `shared/locale/en/dashboard/users/createUser.ts` | English implementation — `dashboardUsersCreateUserEn` |
| `shared/locale/ar/dashboard/users/createUser.ts` | Arabic implementation — `dashboardUsersCreateUserAr` |
| `shared/locale/namespaces/dashboard/users/createUser.namespace.ts` | `defineNamespace` registration with lazy-loading `en`/`ar` imports |
| `shared/locale/types/dashboard/users/index.ts` | Barrel — re-exports `createUser` + existing `directory` |
| `shared/locale/en/dashboard/users/index.ts` | Barrel — re-exports `createUser` + existing `directory` |
| `shared/locale/ar/dashboard/users/index.ts` | Barrel — re-exports `createUser` + existing `directory` |
| `shared/locale/namespaces/dashboard/users/index.ts` | Barrel — re-exports `directory.namespace` + `createUser.namespace` |

## Files Modified

| File | Change |
|------|--------|
| `shared/locale/namespaces/translation.ts` | Added import of `DashboardUsersCreateUser`; registered `UsersCreateUser: DashboardUsersCreateUser` under `Dashboard` tree (next to `UsersDirectoryParent`) |
| `shared/locale/types/message.ts` | Added `import type { CreateUserLabels }`; added `usersCreateUser: CreateUserLabels` to `DashboardTranslations` interface (next to `usersDirectoryParent`) |
| `shared/locale/en/messages.ts` | Added import of `dashboardUsersCreateUserEn`; added `usersCreateUser: dashboardUsersCreateUserEn` to `dashboardTranslations` |
| `shared/locale/ar/messages.ts` | Added import of `dashboardUsersCreateUserAr`; added `usersCreateUser: dashboardUsersCreateUserAr` to `dashboardTranslations` |

## Implementation Details

### Type Labels Interface (`CreateUserLabels`)

All properties are `readonly` (following the project convention used by `UsersDirectoryParentLabels`). The interface includes:
- Page-level labels: `pageTitle`, `formTitle`
- Form field labels: `name`, `email`, `phone`, `password`, `permissionGroup`, `accountStatus`
- Status labels: `statusActivated`, `statusDeactivated`
- Action labels: `createButton`, `cancelButton`
- Toast messages: `createSuccess`, `createError`
- Validation messages: `nameRequired`, `emailRequired`, `emailInvalid`, `emailExists`, `passwordRequired`, `passwordWeak`, `permissionGroupRequired`
- Business logic messages: `specializedGroupNotAllowed`, `permissionGroupNotFound`
- Section labels: `sections.userDetails`, `sections.permissions`

### Namespace Registration Pattern

Used `defineNamespace<CreateUserLabels>("dashboard.users.createUser", { load: { en, ar } })` — the exact pattern from `directory.namespace.ts`. The namespace ID `"dashboard.users.createUser"` follows the dot-separated convention for the browser translation cache.

### Translation Enum Registration

In `translation.ts`, the namespace is registered as `UsersCreateUser: DashboardUsersCreateUser` under the `Dashboard` object — matching the pattern of `UsersDirectoryParent`.

## Verification Results

All 12 files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene):

| File | Result |
|------|--------|
| `shared/locale/types/dashboard/users/createUser.ts` | ✅ All 6 checks passed |
| `shared/locale/en/dashboard/users/createUser.ts` | ✅ All 6 checks passed |
| `shared/locale/ar/dashboard/users/createUser.ts` | ✅ All 6 checks passed |
| `shared/locale/namespaces/dashboard/users/createUser.namespace.ts` | ✅ All 6 checks passed |
| `shared/locale/types/dashboard/users/index.ts` | ✅ All 6 checks passed |
| `shared/locale/en/dashboard/users/index.ts` | ✅ All 6 checks passed |
| `shared/locale/ar/dashboard/users/index.ts` | ✅ All 6 checks passed |
| `shared/locale/namespaces/dashboard/users/index.ts` | ✅ All 6 checks passed |
| `shared/locale/namespaces/translation.ts` | ✅ All 6 checks passed |
| `shared/locale/types/message.ts` | ✅ All 6 checks passed |
| `shared/locale/en/messages.ts` | ✅ All 6 checks passed |
| `shared/locale/ar/messages.ts` | ✅ All 6 checks passed |

## Semantic Review Checklist

- [x] No cross-layer imports — all imports within `shared/locale/` or from `@/shared/locale/`
- [x] All properties `readonly` on `CreateUserLabels` interface (matching `UsersDirectoryParentLabels` convention)
- [x] Barrel files use `./` relative paths (not `@/` aliases)
- [x] Barrel files contain only `export *` statements (no imports)
- [x] Max one `/` per `export *` path in barrel files
- [x] Namespace ID is stable dot-separated string `"dashboard.users.createUser"`
- [x] Lazy loading via dynamic `import()` for both `en` and `ar`
- [x] No hardcoded error strings — all user-facing text goes through the i18n system

## Exact Translation Enum Value

For Task 11 (ViewModel) and frontend components, the translation accessor is:

```typescript
Translation.Dashboard.UsersCreateUser
```

This accesses the `DashboardUsersCreateUser` namespace handle registered in `translation.ts`. Usage in client components:

```typescript
import { useAppTranslation } from "@/shared/locale/client";
const t = useAppTranslation("Dashboard.UsersCreateUser");
// Access: t.pageTitle, t.formTitle, t.name, t.sections.userDetails, etc.
```

## Exact Import Path for Labels Type

```typescript
import type { CreateUserLabels } from "@/shared/locale/types/dashboard/users/createUser";
```

Or via the barrel:
```typescript
import type { CreateUserLabels } from "@/shared/locale/types/dashboard/users";
```

## Carry-Forward Knowledge for Future Tasks

### 1. Translation Access Pattern
- **Enum path**: `Translation.Dashboard.UsersCreateUser` — note `UsersCreateUser` is a single camelCase key (NOT `Users.CreateUser`)
- **Client hook usage**: `useAppTranslation("Dashboard.UsersCreateUser")` — the string matches the path in the `Translation` object
- **Server component usage**: `getTranslations(locale, "Dashboard.UsersCreateUser")`
- **GraphQL resolver usage**: `ctx.t("Dashboard.UsersCreateUser")`

### 2. Available Label Keys
All 23 top-level keys + 2 nested under `sections`:
- `pageTitle`, `formTitle`, `name`, `email`, `phone`, `password`
- `permissionGroup`, `accountStatus`, `statusActivated`, `statusDeactivated`
- `createButton`, `cancelButton`, `createSuccess`, `createError`
- `nameRequired`, `emailRequired`, `emailInvalid`, `emailExists`
- `passwordRequired`, `passwordWeak`, `permissionGroupRequired`
- `specializedGroupNotAllowed`, `permissionGroupNotFound`
- `sections.userDetails`, `sections.permissions`

### 3. Barrel File Convention for `shared/locale/`
When creating barrel `index.ts` files in `shared/locale/` subdirectories, include ALL existing files in the directory (not just the new one). The existing `directory.ts` file had no barrel — the new barrel re-exports both `createUser` and `directory`.

### 4. Legacy Message Files Still Required
In addition to `translation.ts` (namespace registration) and `message.ts` (type wiring), the legacy `shared/locale/en/messages.ts` and `shared/locale/ar/messages.ts` files must also include the new namespace property. These files implement the `Translations` type and pass the actual locale data to SSR/getServerTranslations. Forgetting them causes `TS2741: Property 'usersCreateUser' is missing` errors.

### 5. Namespace ID Convention
The namespace ID follows the path structure: `dashboard.users.createUser` (dot-separated, camelCase). This must be stable for the browser translation cache (Service Worker + IndexedDB).

### 6. `defineNamespace` API
- **Import**: `import { defineNamespace } from "@/shared/locale/namespaces/define-namespace"`
- **Signature**: `defineNamespace<TLabels>(id: string, config: { load: Record<AppLocale, () => Promise<TLabels>> })`
- **Returns**: `NamespaceHandle<TLabels>` — a handle object registered in the namespace registry
- **Lazy loading**: Each locale's implementation is loaded on-demand via dynamic `import()`

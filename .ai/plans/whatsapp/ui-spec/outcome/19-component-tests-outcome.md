# Task 19: Component Tests — Dialogs, Tabs, Parity (Outcome)

## Summary

Created 8 component test files (60 tests total) covering WhatsApp UI dialogs, tab content, mobile parity, and URL tab navigation. All tests pass with `bun:test` + Happy DOM environment using `renderWithWrapper` with Apollo `MockLink`.

## Files Created

| # | File | Tests |
|---|------|-------|
| 0 | `test/ui/components/helpers/whatsappTestHelpers.ts` | (shared helpers) |
| 1 | `test/ui/components/whatsappCreateAccountDialog.test.tsx` | 9 |
| 2 | `test/ui/components/whatsappEditNameDialog.test.tsx` | 7 |
| 3 | `test/ui/components/whatsappDeleteConfirmDialog.test.tsx` | 3 |
| 4 | `test/ui/components/whatsappCredentialDialogs.test.tsx` | 5 |
| 5 | `test/ui/components/whatsappTemplatesTab.test.tsx` | 9 |
| 6 | `test/ui/components/whatsappOptInTab.test.tsx` | 10 |
| 7 | `test/ui/components/whatsappMobileParity.test.tsx` | 10 |
| 8 | `test/ui/components/whatsappUrlTabNav.test.tsx` | 7 |

**Total: 60 tests across 8 test files + 1 shared helper file.**

## Shared Helpers (`whatsappTestHelpers.ts`)

- `testLabels` — Full English `WhatsappLabels` object for use in tests
- `testSettingsLabels` — Grouped labels (page + notifications) for `NumbersTabSharedProps`
- `makeAccountRow(id, phone?, displayName?)` — Factory for mock `WhatsappAccountRow` (uses GraphQL enum values from `graphql-types.ts`, NOT string literals)
- `makeTemplateRow(id, name?)` — Factory for mock `WhatsappTemplateRow`
- `makeAuditEntry(id, action?)` — Factory for mock `WhatsappOptInAuditEntry`
- `makeAdminUser(id, userName?, optedIn?)` — Factory for mock `WhatsappOptInUserState`
- `firstCallArgRecord(mockFn)` — Type-guard-based extraction of first call arg as `Record<string, unknown>`
- `firstCallArgString(mockFn)` — Type-guard extraction of first arg as `string`
- `firstCallArgStringAt(mockFn, index)` — Type-guard extraction of arg at index as `string`
- `firstCallArgBoolean(mockFn)` — Type-guard extraction of first arg as `boolean`

## Verification Results

| Check | Result |
|-------|--------|
| tsgo | ✅ Clean (no errors in any WhatsApp test file) |
| biome:check | ✅ Clean |
| lint (ESLint) | ✅ Clean (all 9 files pass) |
| oxlint (no-unsafe-type-assertion) | ✅ Clean (all `as unknown as` casts replaced with type guards) |
| codescene (sub-loop --lifecycle codescene) | ✅ All 9 files pass |
| Tests (individual) | ✅ 60/60 pass |
| Tests (test:ui:components) | ✅ 60/60 WhatsApp tests pass (54 pre-existing failures in other files, none in WhatsApp tests) |

## Components That Were Difficult to Test

### DeleteConfirmDialog and CredentialEditDialog
- These are **internal components** inside `NumbersTabDesktop` — NOT exported as standalone components
- Tests must render `NumbersTabDesktop` with full `NumbersTabSharedProps` and interact with the action menu (click MoreVert icon → click "Edit Token"/"Edit Pin"/"Delete" menu item)
- This requires ~30 mock props in `baseProps` for NumbersTabDesktop
- The credential dialogs are controlled by `useCredentialMenuState` (internal hook), NOT by `dialogState` prop

### Mobile Components (MobileCardList Suspense)
- `MobileCardList` uses `next/dynamic` via `createLazyView` — suspends on first render
- Tests must use `findByText`/`waitFor` instead of synchronous `getByText`/`getByRole`
- The `next-dynamic-mock.ts` preload caches specific known views only (scheduleOverview, pendingReviews, searchSchedule, cron) — other dynamic imports return `null`

### GenericTabNav (next/dynamic)
- `GenericTabNav` dynamically imports `genericTabNav.mobile` and `genericTabNav.desktop` via `createLazyView`
- `next-dynamic-mock.ts` does NOT cache these → mock returns `null` → component fails to render
- **Fix**: Mock `GenericTabNav` directly with `mock.module("@/frontend/common/views/dashboard/components/GenericTabNav", ...)` in the test file

### URL Tab Navigation
- `useWhatsappTab` uses `useSearchParams` and `useRouter` from `next/navigation`
- Must mock `next/navigation` with a mutable `currentSearchParams` variable that each test can change before rendering
- `WhatsappTabConsumer` test wrapper component needed to test the hook in a component context

## Key Patterns and Carry-Forward Knowledge for Task 20

### bun:test Mock Call Type Issues
- `mock.calls` has type `readonly unknown[][]` in `bun:test` — accessing `mock.calls[0][0]` triggers TS2493 "Tuple type '[]' has no element at index '0'"
- **Solution**: Use type-guard helper functions like `firstCallArgString`, `firstCallArgRecord`, `firstCallArgBoolean` from `whatsappTestHelpers.ts` instead of casting with `as unknown as Type` (which oxlint `no-unsafe-type-assertion` flags)

### GraphQL Enum Values
- Generated GraphQL enums from `graphql-types.ts` are TypeScript **`enum` objects** (e.g., `WhatsappQualityRating.Green`), NOT string literals
- Test factories must import and use the enum members, NOT string literals like `"GREEN"`
- The string literal union types in `gql/graphql.ts` are separate from the `enum` types in `graphql-types.ts`; the actual fragment types use the `enum` versions

### NumbersTabSharedProps Mocking
- `NumbersTabDesktop` requires ~30 props — use a shared `baseProps` object with all defaults
- Key required props: `dialogState`, `accounts`, `onSetAccessToken`, `onSetTwoStepPin`, `onDeleteAccount`, `onOpenDeleteConfirmDialog`, `onOpenCreateDialog`, `onOpenEditNameDialog`, `onCloseDialog`, `onCreate`, `onEditName`, `onSyncFromMeta`, `onDismissSnackbar`, `validateDisplayName`, `validatePhoneNumberId`, `validateWabaId`, `validateAccessToken`, `validateTwoStepPin`

### renderWithWrapper Usage
- From `test/ui/components/TestWrapper.tsx`
- Props: `{ locale, themeMode, permissions, mocks, viewport }`
- Default locale is `"ar"` (Arabic/RTL) — pass `{ locale: "en" }` for English labels
- Pass `permissions: [AppPermission.WhatsappConfigManage]` for components gated by `RequirePermission`

### Test Runner Command
```bash
SIRAJ_TEST_RUNNER_OK=1 ~/.bun/bin/bun --env-file=.env.test test <file> --preload ./test/ui/test-env.ts --preload ./test/ui/components/happydom-preload.ts --preload ./test/ui/components/next-dynamic-mock.ts
```

### CodeScene Duplication Fix Strategy
- Extract test helper functions for repeated patterns: `fillField`, `clickSave`, `expectValidationError`, `openDialogAndExpect`, `submitCredentialDialog`
- CodeScene flags structural duplication in test bodies — extracting the action sequence into a named helper eliminates the warning
- Code health score of 10.0 is achievable for test files with proper helper extraction

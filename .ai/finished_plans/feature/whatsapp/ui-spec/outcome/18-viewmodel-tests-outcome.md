# Task 18: ViewModel Tests — Outcome

## Summary

Added 11 new tests (Q3.7–Q3.17) to `test/ui/components/useWhatsappSettingsViewModel.test.tsx` covering mutation flows, validation, loading states, dialog interactions, snackbar behavior, and opt-in toggle. All 17 tests (6 existing + 11 new) pass. The test file also received minor improvements: added `isWhatsappConfigured` mock to all 6 existing tests to eliminate Apollo MockLink "No more mocked responses" warnings, and consolidated imports from `@testing-library/react`.

## Files Modified (1)

### `test/ui/components/useWhatsappSettingsViewModel.test.tsx`

**Infrastructure changes:**

- Imported `act`, `fireEvent`, `screen` from `@testing-library/react` (consolidated with existing `cleanup`, `waitFor`)
- Imported `useEffect, type RefObject` from `react` (replaced deprecated `MutableRefObject`)
- Added `vmRef: RefObject<WhatsappSettingsViewModel | null>` — module-level ref that captures the full ViewModel instance for direct property assertions in tests
- `WhatsappSettingsConsumer` — moved `vmRef.current = vm` into `useEffect` (fixes `react-hooks/immutability` lint rule)
- Added `InteractiveConsumer` — consumer component with action buttons (`open-create`, `open-delete`, `close-dialog`, `close-snackbar`) for triggering handlers via `fireEvent.click` inside `act()`
- Added 7 new mock factories: `configuredMock`, `createAccountMock`, `updateAccountMock`, `deleteAccountMock`, `syncMock`, `setOptInMock`
- Added `baseMocks()` helper — returns `[accountsMock, optInMock, configuredMock]` for consistent query mocking
- Added `waitForLoaded()` helper — `waitFor(() => loading === false)`
- Added `configuredMock(true)` to all 6 existing tests (Q3.1–Q3.6) — eliminates Apollo MockLink "No more mocked responses for query isWhatsappConfigured" warning
- Re-exported `WhatsappSettingsViewModel` type from `whatsappSettingsTypes.ts` for `vmRef` typing

**New mock factories:**

| Factory | GraphQL Document | Variables |
|---------|-----------------|-----------|
| `configuredMock(configured)` | `isWhatsappConfiguredQueryDocument` | `{}` |
| `createAccountMock(account)` | `createWhatsappAccountMutationDocument` | `{ input: { displayName, phoneNumberId, wabaId, displayPhoneNumber: null, isActive: null, ... } }` |
| `updateAccountMock(accountId, displayName)` | `updateWhatsappAccountMutationDocument` | `{ id, input: { displayName: { en }, displayPhoneNumber: null, ... } }` |
| `deleteAccountMock(accountId)` | `deleteWhatsappAccountMutationDocument` | `{ id }` |
| `syncMock(result)` | `syncWhatsappAccountsFromMetaMutationDocument` | `{}` |
| `setOptInMock(enabled)` | `setUserWhatsappOptInMutationDocument` | `{ userId: "me", enabled, source: "graphql" }` |

## Tests Added (11)

| Test ID | Description | Key Assertions |
|---------|-------------|----------------|
| Q3.7 | Create account mutation flow | `handleCreate(validInput)` → snackbar severity "success", message "WhatsApp number saved successfully.", dialogState.type null |
| Q3.8 | Create with invalid input blocks mutation | `handleCreate("")` → `mutationError` not null, snackbar null (no mutation called) |
| Q3.9 | Update account name mutation flow | `handleEditName("acc-1", "Updated Name")` → snackbar severity "success" |
| Q3.10 | Edit name with invalid input blocks mutation | `handleEditName("acc-1", "")` → `mutationError` not null, snackbar null |
| Q3.11 | Delete dialog cancel — no mutation | `openDeleteConfirmDialog` → `closeDialog` → dialogState.type null, deletingId null, snackbar null |
| Q3.12 | Sync loading state | `handleSync()` → syncingId null after completion, snackbar severity "success" |
| Q3.13 | validateAccessToken returns error for short token | Short token → error; 50+ char token → null |
| Q3.14 | validateTwoStepPin returns error for wrong format | 5-digit PIN → error; letters → error; 6-digit → null |
| Q3.15 | Per-row loading states: deletingId | `handleDelete` → after completion deletingId null, snackbar success |
| Q3.16 | Snackbar close clears message | `closeSnackbar()` → snackbar null |
| Q3.17 | Opt-in toggle loading state | `handleToggleOptIn(true)` → optInLoading false after, snackbar success |

## Verification Results

### sub-loop.ts --lifecycle codescene

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

### Test execution

```
17 pass
0 fail
94 expect() calls
Ran 17 tests across 1 file. [3.11s]
```

### Global checks

- `bun tsgo` — ✅ passed (0 errors)
- `bun biome:check` — ✅ passed (No fixes applied)
- `bun run lint` — ✅ passed (exit 0)
- `bun run test:ui:components` — ✅ all 17 WhatsApp tests pass (54 pre-existing failures in unrelated test files: CalendarGridDesktop, ClassMeetingConfigsSection, MeetingProviderCredentialForm, etc.)

## Carry-Forward Knowledge for Task 19 (Component Tests)

### Mocking patterns shared with Task 19

1. **`renderWithWrapper`** from `TestWrapper.tsx` — renders with Apollo MockLink, theme, locale, viewport. Props: `{ locale, themeMode, permissions, mocks, viewport }`
2. **MockLink mocking pattern** — each mock is `MockLink.MockedResponse` with `{ request: { query, variables }, result: { data: {...} } }`
3. **`baseMocks()` helper** — reusable factory for the 3 query mocks (accounts, optIn, configured). Task 19 should import or replicate this.
4. **`mockNextNavigation`** — called with `await mockNextNavigation("/dashboard", { includeRouter: false, routingIncludeReplaceAndPrefetch: false })` at module scope before tests
5. **`afterEach`** — `cleanup()`, `captures = []`, `vmRef = { current: null }`, `mock.restore()`

### Consumer-component pattern (critical for Task 19)

Since `renderHook` is unavailable in `bun:test`:
- Render a component that calls the hook
- Capture state via `useEffect` → pushes to a `captures` array
- Use `latestCapture()` to read the last snapshot
- For calling handlers: use `vmRef.current?.handlerName(...)` wrapped in `act(async () => { ... })`
- The `vmRef.current` assignment MUST be inside `useEffect` (not in render body) to satisfy `react-hooks/immutability` ESLint rule

### Validation function testing

- Validation functions are exposed on the ViewModel: `validateDisplayName`, `validatePhoneNumberId`, `validateWabaId`, `validateAccessToken`, `validateTwoStepPin`
- They return i18n key strings (not null) on error, `null` on success
- `validateAccessToken("")` returns `null` (empty is optional), but `validateAccessToken("short")` returns error
- `validateTwoStepPin` requires exactly 6 digits (`/^\d{6}$/`)

### Mutation flow testing

- Mutations are mocked with `MockLink.MockedResponse` — the MockLink matches `request.query` + `request.variables`
- Variables must match EXACTLY — including nulls in input objects (e.g., `displayPhoneNumber: null, isActive: null`)
- After mutation, `refetchAccounts` is called → need a second `accountsMock` for the refetch response
- `toggleOptInAction` uses `source: "graphql"` (not `"settings"`) in the mutation variables

### Dialog state testing

- `dialogState.type` values: `"create"`, `"editName"`, `"editToken"`, `"editPin"`, `"deleteConfirm"`, `null`
- `openDeleteConfirmDialog(accountId, displayName)` takes TWO arguments
- `closeDialog()` sets `dialogState.type` to `null`

## Cross-File Dependencies Discovered

1. **`isWhatsappConfiguredQueryDocument`** — the ViewModel queries this in `useWhatsappQueries()` (line 160). All test mocks MUST include `configuredMock` or MockLink warns about missing response.
2. **`toggleOptInAction` uses `source: "graphql"`** — not `"settings"` or `"manual"`. The mutation variables must match exactly.
3. **`buildCreateInput` and `buildUpdateInput`** — include all nullable fields as `null` (`displayPhoneNumber`, `isActive`, `portfolioMessagingLimitTier`, `qualityRating`, `throughputLevel`). Mock variables must match.
4. **`RefObject` vs `MutableRefObject`** — React 19 deprecates `MutableRefObject`. Use `RefObject<T>` — its `current` property is mutable (`current: T`, not `current: readonly T`).
5. **`react-hooks/immutability`** — ESLint rule that flags assignments to variables defined outside a component in the render body. Fix: move the assignment into `useEffect`.

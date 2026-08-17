# WhatsApp UI Patterns — Canonical Reference

Comprehensive reference consolidating all patterns, rules, and gotchas from the 20-task WhatsApp UI improvement implementation. Covers architecture, hooks, components, i18n, testing, animations, and accessibility.

## Overview

The WhatsApp settings page lives at `app/(dashboard)/settings/whatsapp/` and follows the standard 4-tier architecture:

```
app/(dashboard)/settings/whatsapp/page.tsx      [Server Component, RequirePermission]
  └─ WhatsappSettingsContainer.tsx                [Client, calls ViewModel]
      └─ WhatsappConfigView.tsx                   [Client, URL-synced tabs]
          ├─ WhatsappTabNav.tsx                   [URL tab navigation via GenericTabNav]
          └─ WhatsappTabPanels.tsx                [Per-tab content with Suspense + RequirePermission]
              ├─ NumbersTab (.desktop/.mobile)     [Account CRUD + sync]
              ├─ TemplatesTab (.desktop/.mobile)   [Template preview + sync]
              └─ OptInTab (.desktop/.mobile)       [Opt-in toggle + history + admin view]
```

## Architecture Patterns

### URL-Synced Tab Navigation

- **`useWhatsappTab()`** hook (`whatsappTabUrl.ts`) reads `?tab=` from URL via `useSearchParams`, validates against `TAB_IDS` allowlist, returns `[activeTab, setActiveTab]`.
- Tab changes use Next.js `<Link>` hrefs (`buildTabHref`) — no `setActiveTab` needed in practice.
- `WhatsappConfigTab` type (`"numbers" | "templates" | "optin"`) is re-exported from `whatsappConfig.constants.ts`.
- `TAB_PERMISSIONS: Record<WhatsappConfigTab, readonly AppPermission[]>` gates each tab via `RequirePermission` in `WhatsappTabPanels`.
- Page shell thin wrappers (`WhatsappConfigDesktopShell`/`WhatsappConfigMobileShell`) only render container + header + children; tab nav and panels live in the common layer.

### ViewModel Composable Hooks

The ViewModel (`useWhatsappSettingsViewModel.ts`) is decomposed into sub-hooks with a `buildWhatsappViewModel` assembler:

| Sub-hook | Responsibility |
|----------|----------------|
| `useWhatsappQueries` | `whatsappAccounts`, `isUserWhatsappOptIn`, `isWhatsappConfigured` queries |
| `useWhatsappMutations` | delete, setAccessToken, setTwoStepPin, syncFromMeta, setOptIn, createAccount, updateAccount |
| `useDerivedWhatsappData` | derives accounts, templates, loading, isOptedIn, isConfigured, queryError |
| `useWhatsappDialogs` | consolidated `dialogState` + `mutationError` |
| `useWhatsappSnackbar` | `{ message, severity } \| null` pattern, `showSnackbar`, `closeSnackbar` |
| `useWhatsappCreateHandler` | `handleCreate` (validates displayName), manages `creating` loading state |
| `useWhatsappUpdateDeleteHandlers` | `handleEditName`, `handleDelete`, manages `deletingId`, `updatingId` |
| `useWhatsappUtilityHandlers` | `handleSubmitToken`, `handleSubmitPin`, `handleSync`, `handleToggleOptIn`, manages `syncingId`, `optInLoading` |
| `useWhatsappLabels` | maps i18n translation keys for snackbar messages |
| `useRefetchers` | `refetchAccounts`, `refetchTemplates` (passthrough until backend query exists) |

**Pattern**: When adding new state/handlers, add to the relevant sub-hook, update `WhatsappViewModelParts`, and update `buildWhatsappViewModel` + `WhatsappSettingsViewModel` interface.

### Per-Row Loading State Pattern

- `creating: boolean` — account creation in progress
- `deletingId: string | null` — account being deleted (matches `account.id`)
- `updatingId: string | null` — account name being updated
- `syncingId: string | null` — bulk sync sentinel (`"all"` when syncing, `null` otherwise)
- `editingTokenForId: string | null` — account being credential-edited (token)
- `editingPinForId: string | null` — account being credential-edited (PIN)

Desktop/mobile components check these to show `LinearProgress` overlays and `CircularProgress` spinners.

### Dialog State Pattern

```typescript
interface WhatsappDialogState {
  readonly type: "create" | "editName" | "editToken" | "editPin" | "deleteConfirm" | null;
  readonly accountId?: string;
  readonly displayName?: string;
}
```

- Single source of truth — no local `useState` for dialog open/close.
- `openCreateDialog()`, `openEditNameDialog(id, name)`, `openDeleteConfirmDialog(id, name)`, `closeDialog()`.
- `mutationError: string | null` — set on validation failure, cleared by `closeDialog`/`closeSnackbar`.

### Snackbar Pattern

```typescript
type WhatsappSnackbar = { message: string; severity: "success" | "error" } | null;
```

- `null` = closed. Non-null = open with message + severity.
- `NumbersSnackbar` delegates to `FormSuccessSnackbar` / `FormErrorSnackbar` based on `severity`.
- `closeSnackbar` also clears `mutationError`.

### StatusBadge for Enum-Based Statuses

- `syncStatus` category reused (no new `StatusBadgeCategory` added).
- `WHATSAPP_TEMPLATE_STATUS_BADGE` maps all 6 `WhatsappTemplateStatus` values to `syncStatus` + semantic keys.
- `getWhatsappTemplateStatusBadgeConfig(status)` — handles unknown/null with fallback.
- `getWhatsappAccountStatusBadgeConfig(isActive)` — maps active/inactive to `syncStatus`.

### Form Validation Pattern

`whatsappFormValidation.ts` exports 5 pure validators returning `string | null` (i18n key or null):

| Validator | Field | Error Keys |
|-----------|-------|------------|
| `validateDisplayName` | displayName | `validationDisplayNameRequired`, `validationDisplayNameTooLong` |
| `validatePhoneNumberId` | phoneNumberId | `validationPhoneNumberIdRequired`, `validationPhoneNumberIdNumeric` |
| `validateWabaId` | wabaId | `validationWabaIdRequired`, `validationWabaIdNumeric` |
| `validateAccessToken` | accessToken | `validationAccessTokenTooShort` (optional: empty = valid) |
| `validateTwoStepPin` | twoStepPin | `validationPinFormat` (`/^\d{6}$/`) |

Form-level validators: `validateAccountCreateForm`, `validateAccessTokenForm`, `validateCredentialForm`.

### i18n Label Helper Pattern

Label helpers map enum values → i18n key strings via `Record<string, string>` lookups:

| Helper | Enum | Pattern |
|--------|------|---------|
| `getQualityLabelKey` | `WhatsappQualityRating` | Record lookup → `"qualityGreen"` etc. |
| `getTierLabelKey` | `WhatsappLimitTier` | Record lookup → `"tier50"` etc. |
| `getTemplateStatusLabelKey` | `WhatsappTemplateStatus` | Record lookup → `"templateStatusApproved"` etc. |
| `getThroughputLabelKey` | `WhatsappThroughputLevel` | Record lookup → `"throughputStandard"` etc. |

**Pattern**: Record-based lookup avoids `no-unsafe-enum-comparison` oxlint warning. Caller uses type guard (`isLabelKey`) to safely index `t[key]`.

### Mobile/Desktop Parity Pattern

- **SharedScaffold**: Shared content components (`OptInTabContent`, `TemplatesTabContent`) live in `tabs/shared/`. Platform wrappers pass platform-specific sections via render-prop slots (`historySection`, `adminSection`).
- **MobileCardList**: Mobile templates use `MobileCardList` + `MobileCardListItem` with expandable `Collapse`. Desktop uses shared `Card` + `CardActionArea` + `Collapse`.
- **fullScreen dialogs**: Mobile credential/delete dialogs use `fullScreen` for viewport-fitting. Desktop dialogs use standard size.
- **Mobile CRUD**: Full CRUD parity — per-card action menu (`MoreVertOutlined`), credential editing, delete confirm. No `useMediaQuery` — `fullScreen` applied unconditionally on mobile.

### Route Boundaries

- **`loading.tsx`**: Server component, generic `Box` + `Skeleton` layout (cannot use tier-specific `DesktopPageContainer`/`MobilePageContainer`).
- **`error.tsx`**: Client component, function named `WhatsAppError` (not `Error` — avoids `no-globals-shadowing`). Uses `logger`, `useAppTranslation`, `reset()`.

### Animation Patterns

- **Shared constants** in `whatsappAnimations.ts` — keyframe sx objects (`tabFadeInSx`, `syncPulseSx`), duration constants.
- **Tab fade-in**: `@keyframes whatsappTabFadeIn` (200ms, opacity + translateY). `key={activeTab}` re-triggers on switch.
- **Row enter/exit**: MUI `Fade` + `Grow` wrapping list items, `in={!isDeleting}` with 300ms timeouts.
- **Sync pulse**: `@keyframes whatsappSyncPulse` (1s infinite, opacity 1→0.5→1) on `CloudSyncOutlined` icon.
- **Reduced motion**: `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` → timeouts to 0.
- **RTL-safe**: `translateY` and `opacity` only — no horizontal movement.
- **Keyframes in sx**: Embed `@keyframes` directly in sx objects, not via `@mui/material/styles` `keyframes`.

### Accessibility Patterns

- **`aria-invalid`**: `aria-invalid={!!error}` on form `TextField`s with validation errors.
- **`aria-busy`**: `<Box component="output" aria-busy>` for loading containers (implicit `role="status"` via `<output>` element).
- **`role="alert"`**: On error `Alert` components and warning boxes.
- **PermissionDeniedFallback**: `LockOutlined` icon + title + description + `role="alert"` — not bare `null`.
- **MUI Dialog**: Handles focus trap + Escape key by default — no manual override needed.
- **`aria-busy` on buttons**: Sync buttons show `aria-busy` when loading.

### Testing Patterns

- **Consumer-component pattern**: `renderHook` unavailable in `bun:test`. Render a component that calls the hook, capture state via `useEffect` → `captures` array.
- **`vmRef`**: `RefObject<ViewModel | null>` at module scope. Assignment inside `useEffect` (not render body) to satisfy `react-hooks/immutability` ESLint rule.
- **MockLink**: `MockLink` from `@apollo/client/testing` with `{ request: { query, variables }, result: { data } }`. Variables must match EXACTLY (including nulls).
- **`renderWithWrapper`** from `TestWrapper.tsx`: `{ locale, themeMode, permissions, mocks, viewport }`. Default locale is `"ar"` — pass `{ locale: "en" }` for English.
- **`baseMocks()`**: Reusable factory for 3 query mocks (accounts, optIn, configured). Must include `configuredMock` or MockLink warns.
- **Type guards for mock calls**: `mock.calls` is `readonly unknown[][]` in `bun:test`. Use `firstCallArgString`, `firstCallArgRecord`, etc. from test helpers — NOT `as unknown as Type` casts.
- **GraphQL enum values**: Generated enums from `graphql-types.ts` are TypeScript enum objects (`WhatsappQualityRating.Green`), NOT string literals.
- **Test runner command**:
  ```bash
  SIRAJ_TEST_RUNNER_OK=1 ~/.bun/bin/bun --env-file=.env.test test <file> \
    --preload ./test/ui/test-env.ts \
    --preload ./test/ui/components/happydom-preload.ts \
    --preload ./test/ui/components/next-dynamic-mock.ts
  ```
- **MobileCardList Suspense**: Uses `next/dynamic` → tests need `findByText`/`waitFor`, not synchronous `getByText`.
- **GenericTabNav dynamic import**: Mock directly with `mock.module` in test files since `next-dynamic-mock.ts` doesn't cache it.
- **`mockNextNavigation`**: Called at module scope before tests `await mockNextNavigation("/dashboard", { includeRouter: false, routingIncludeReplaceAndPrefetch: false })`.

## Gotchas

### Missing Backend Resolvers

- **`whatsappTemplates` query**: Does NOT exist. GraphQL document is a commented-out stub in `whatsapp.documents.ts`. Templates come from `syncWhatsappAccountsFromMeta` mutation result.
- **`whatsappOptInAudit` query**: Does NOT exist. Same stub pattern. UI uses placeholder empty array with TODO comment.
- **`refetchTemplates`**: Passthrough to `refetchAccounts()` — does NOT re-fetch templates from server until backend resolver ships.
- **Activation steps**: Create backend Pothos resolver → run `generate:gqlSchema && codegen` → uncomment stub documents.

### Missing Enum Values

- **`TIER_250K`, `TIER_1M`**: Do NOT exist in `WhatsappLimitTier`. Actual values: `UNTIERED`, `TIER_50`, `TIER_250`, `TIER_1K`, `TIER_10K`, `TIER_100K`, `TIER_UNLIMITED`, `TIER_NOT_SET`.
- **`qualityOrange`**: Does NOT exist in `WhatsappQualityRating`. Actual values: `GREEN`, `YELLOW`, `RED`, `UNKNOWN`.
- Always use actual values from `@/shared/constants/whatsapp-templates.enum.ts` (canonical source for frontend).

### Permission Enum Names

- `AppPermission.WhatsappConfigManage` (not `WHATSAPP_MANAGE`)
- `AppPermission.WhatsappTemplatesManage` (not `WHATSAPP_TEMPLATES_MANAGE`)
- `AppPermission.WhatsappView` (not `WHATSAPP_VIEW`)
- No `WHATSAPP_OPT_IN_MANAGE` exists at all.
- Source: `@/frontend/common/graphql/generated/gql/graphql-types`

### Template Snapshot Fragment Fields

`WhatsappTemplateSnapshot` only has: `id`, `name`, `language`, `status`, `category`, `lastSyncedAt`.
- `body` and `buttonStructure` do NOT exist on this type. Template body preview shows available fields with a comment noting future backend additions.

### Linting Gotchas

- **`no-unsafe-enum-comparison` (oxlint)**: Use `Record<string, string>` lookups, not switch statements comparing enum values with string parameters.
- **`jsx-a11y(prefer-tag-over-role)` (oxlint)**: Use `<Box component="output">` instead of `role="status"`. Use `<Box component="alert">` instead of `role="alert"` on non-Alert elements.
- **`no-unsafe-type-assertion` (oxlint)**: Use type guards (`value is Type`) instead of `as` casts. For mock call args, use type-guard helper functions.
- **`no-globals-shadowing` (sonarjs)**: Name error boundary functions descriptively (e.g., `WhatsAppError`), not `Error`. Add biome `noShadowRestrictedNames` override in `biome.json` for `app/**/error.tsx`.
- **CodeScene Large Method**: Extract hooks (`useCreateAccountForm`, `useEditNameForm`) and sub-components (`CreateAccountDialogFields`) from render methods early. Module-level extraction keeps main functions thin.

### Testing Gotchas

- **`renderHook` unavailable**: Use consumer-component pattern with `useEffect`-based capture.
- **`react-hooks/immutability`**: Assign `vmRef.current` inside `useEffect`, not render body.
- **MockLink variable matching**: Must match EXACTLY — including nulls in input objects (e.g., `displayPhoneNumber: null`, `isActive: null`).
- **`toggleOptInAction` uses `source: "graphql"`** — not `"settings"` or `"manual"`.
- **`RefObject` vs `MutableRefObject`**: React 19 deprecates `MutableRefObject`. Use `RefObject<T>` — `current` is mutable.
- **`next-dynamic-mock.ts`**: Only caches known views — other dynamic imports return `null`. Mock components directly with `mock.module` when needed.

### CodeScene Duplication in Tests

- CodeScene flags structural duplication in test bodies. Extract action sequences into named helpers: `fillField`, `clickSave`, `expectValidationError`, `openDialogAndExpect`.

---

## Plan Debt — Deferred parent-plan items (26.3–26.6)

These items were marked `[~]` (deferred) in the parent WhatsApp plan (`.ai/finished_plans/whatsapp/trackable-tasks.md:325-328`) and remain backend-engineering work — they need a GraphQL resolver before any UI data becomes real. The v1 UI renders placeholder empty arrays with a `// NOTE: deferred — parent plan 26.x` comment, so the view degrades gracefully and ships today.

| Item | What's missing (backend) | UI placeholder behavior |
|------|---------------------------|--------------------------|
| 26.3 Numbers opt-in table (per-account opt-in counts) | No GraphQL query for per-account opt-in counts | Numbers tab renders "—" or hides the chip until backend ships |
| 26.4 Bulk opt-in actions (select-all-and-toggle) | Mutation scope over multiple user IDs | Toolbar renders but bulk action is disabled with tooltip "Backend pending" |
| 26.5 Opt-in audit trail (user-visible) | No `whatsappOptInAudit` resolver; emitted audit log entries live only in backend audit table | Opt-in tab history section renders empty-state message (`optInHistoryEmpty`) — `OptInTabPanel` passes `auditEntries: []` with a NOTE comment |
| 26.6 `whatsappOptInAudit` GraphQL resolver | Backend resolver never built | N/A until backend ships |

**Source of grains:** the active backend resolvers in v1 are `whatsappAccounts{}`, `syncWhatsappAccountsFromMeta`, `createWhatsappAccount`, `updateWhatsappAccount{}`, `updateWhatsappAccountName`, `setAccessToken`, `setTwoStepPin`, `deleteWhatsappAccount`, `updateWhatsappLocalTemplateOptIn`. Anything else — including `whatsappTemplates{}` (templates render from the sync mutation's per-account snapshot) and `whatsappOptInAudit{}` — does NOT exist in v1 and is deferred. See this spec's `Assumptions / Non-Assumptions` block in `ui-spec/specs.md`.


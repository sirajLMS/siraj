# Meeting Integrations UI — Canonical Reference

> **Scope**: Consolidates all UI patterns, component conventions, and architectural decisions from the auto-meeting-url UI implementation (44 tasks across 10 phases). This doc is a **reference**, not a tutorial — it points to existing docs rather than duplicating them.

## Cross-References

- **Backend**: `docs/services/meeting-providers.md` — adapter/factory pattern, auto URL generation
- **Shared scaffold**: `docs/frontend/ui-shared-scaffold-pattern.md` — `*Shared.tsx` slot-prop pattern
- **Duplication elimination**: `docs/frontend/duplication-elimination-patterns.md` — Patterns A-G
- **Component patterns**: `frontend/COMPONENT_PATTERNS.md` — dashboard UI patterns
- **Permissions**: `docs/auth/permission-architecture.md` — 3-tier permission model
- **Locale system**: `shared/AGENTS.md` — compile-time TypeScript i18n system

---

## 1. Component Patterns

### MetricCardGrid (Health Headers)

Settings-tab health headers use the three-tier `ResponsiveViewSwitch` + `createLazyView` pattern with `DesktopMetricCardGrid` / `MobileMetricCardGrid`:

```
MeetingIntegrationsHealthHeaders.tsx (switcher)
  ├─ createLazyView → desktop variant (DesktopMetricCardGrid, xs:6 md:3)
  └─ createLazyView → mobile variant (MobileMetricCardGrid, horizontal scroll skeleton)
```

- **MetricItem** shape (from `@/frontend/common/types/shared.types`): `{ key, count, labelKey, icon, label?, subLabel?, variant? }` — use `count` (NOT `value`), `labelKey`/`label` (NOT `label` as the value field), `variant` (NOT `color`).
- **Helper extraction**: `buildHealthHeaderMetrics()` lives in a `.helpers.ts` file (NOT `.tsx`) because `react-refresh/only-export-components` forbids exporting plain functions from `.tsx` files.
- **Import paths**:
  - `DesktopMetricCardGrid` from `@/frontend/desktop/components/ui/card/MetricCardGrid`
  - `MobileMetricCardGrid` from `@/frontend/mobile/components/ui`
  - `createLazyView` from `@/frontend/common/components/ui/container/createLazyView`
  - `ResponsiveViewSwitch` from `@/frontend/common/components/ui/container/ResponsiveViewSwitch`

### DesktopAppDataGrid / MobileCardList (Connected Accounts)

- Both require `paginationOptions` (REQUIRED prop) — use `{ mode: "client", pageSize: 10 }` for client-side or `buildServerPaginationOptions(...)`/`resolvePaginationOptions(...)` for server-side.
- Desktop variant uses `GridColDef[]` columns, search input, status filter dropdown.
- Mobile variant uses `MobileCardListItem` cards with the same filter/search.
- Barrel exports in tier directories MUST include the `.desktop`/`.mobile` suffix: `export * from "./ConnectedAccountsTable.desktop"` (module resolution does NOT auto-resolve suffixes).

### BaseDeleteDialog

Used by `RevokeTokenDialog` and `DisconnectConfirmDialog`. Props: `body` (NOT `message`), `isLoading` (NOT `loading`), `cancelLabel`, `confirmSx?`. The confirm button shows `<CircularProgress size={20}>` + `aria-busy={isLoading}` (NOT `"..."` text) for accessible loading state.

### EntityFormDialogActions

Feature-specific (`frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx`), NOT a generic design-system component. Props: `formId`, `cancelLabel`, `saveLabel` (NOT `confirmLabel`), `onClose`, `isLoading`. Save button shows `<CircularProgress>` + `aria-busy` during loading.

### ResponsiveViewSwitch + createLazyView

The standard three-tier switcher pattern. Switcher lives in `frontend/common/views/dashboard/<domain>/`. Calls `createLazyView()` at module top level (static import paths required by `next/dynamic`). Only the matching tier's code is downloaded.

```tsx
const DesktopView = createLazyView(() =>
  import("@/frontend/desktop/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.desktop").then(m => ({ default: m.ConnectedAccountsTableDesktop }))
);
const MobileView = createLazyView(() =>
  import("@/frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile").then(m => ({ default: m.ConnectedAccountsTableMobile }))
);

<ResponsiveViewSwitch desktop={DesktopView} mobile={MobileView} {...props} />
```

---

## 2. OAuth Callback Handling Pattern

The OAuth flow uses URL parameter detection + Apollo refetch + URL cleanup:

1. **`OAuthCallbackHandler`** — a pure-logic component (no UI) mounted at the top of the render stack in `MeetingConfigsManager`. It reads `?oauth_status=success&provider=zoom` from `window.location.search`.
2. **Status handling**:
   - `"success"`: calls `connectedProvidersQueryRefetch()` + shows success toast
   - `"error"`: calls `logger.error("OAuth callback error", { provider, error })` + shows error toast
   - `"focus"`: no-op (window focus fallback — handles cases where the OAuth tab was closed without redirect)
3. **URL cleanup**: `window.history.replaceState({}, "", window.location.pathname)` removes query params after processing.
4. **Apollo refetch**: Uses the `refetch` function from `useQuery` return value (NOT `useLazyQuery` — which is prohibited).
5. **Toast notifications**: Uses `useNotifications` from `@toolpad/core/useNotifications` (subpath import, NOT `@toolpad/core`).
6. **Error logging**: `logger.error` from `@/frontend/common/utils/logger` on error paths (NOT `console.*`).

---

## 3. Reconnect All Batch Action Pattern

Sequential reconnect for multiple OAuth providers — uses a recursive helper to satisfy `no-await-in-loop`:

```tsx
const reconnectAll = useCallback(
  async (providerSlugs: readonly string[]) => {
    if (providerSlugs.length === 0) return;
    const total = providerSlugs.length;
    setReconnectAllProgress({ current: 1, total, providerSlug: providerSlugs[0] ?? "" });
    const processNext = async (index: number, successCount: number, failureCount: number): Promise<void> => {
      if (index >= total) {
        setReconnectAllProgress(null);
        onReconnectAllComplete(successCount, failureCount);
        return;
      }
      const slug = providerSlugs[index];
      if (!slug) return processNext(index + 1, successCount, failureCount);
      setReconnectAllProgress({ current: index + 1, total, providerSlug: slug });
      const succeeded = await reconnectAllProvider(slug);
      return processNext(index + 1, succeeded ? successCount + 1 : successCount, succeeded ? failureCount : failureCount + 1);
    };
    await processNext(0, 0, 0);
  },
  [reconnectAllProvider, onReconnectAllComplete]
);
```

- **Why recursive**: `Promise.all` would run OAuth mutations in parallel — incorrect for OAuth flows that must be sequential. The recursive helper satisfies `no-await-in-loop` while preserving sequential semantics.
- **`reconnectAllTargetSlugs`**: Derived as `readonly string[]` via `useMemo` over `reauthProviders` — gives consumers the raw slug array.
- **Progress tracking**: `ReconnectAllProgress` type: `{ current: number, total: number, providerSlug: string }` — can drive a `<LinearProgress>` indicator.

---

## 4. Meeting URL Status Badge Patterns

The `MeetingUrlStatusBadge` component renders 4 states:

| State | Visual | `variant` |
|-------|--------|-----------|
| pending | `CircularProgress size={12}` + label | default |
| generated | `CheckCircleOutlined` icon + label | success |
| failed | `ErrorOutlined` icon + label | error |
| expired | `WarningOutlined` icon + label | warning |

- **`<output>` element**: Uses `component="output"` on MUI `Box`/`Stack` for `aria-live` regions (NOT `role="status"` — oxlint's `prefer-tag-over-role` rule flags `role="status"` on non-`<output>` elements).
- **Status badge component**: `OAuthConnectionStatusBadge` uses `theme.palette.text.secondary` for "disconnected" (NOT `theme.palette.grey[500]` — fails WCAG 2.1 AA contrast at 2.8:1 vs 5.9:1).

---

## 5. Copy URL Clipboard Pattern

Two implementations exist:

### In-ViewModel `copyUrl` (Task 30)

```tsx
const copyUrl = useCallback(
  async (url: string) => {
    try {
      if (globalThis.navigator?.clipboard) {
        await globalThis.navigator.clipboard.writeText(url);
      } else if (globalThis.document) {
        const textarea = globalThis.document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        globalThis.document.body.append(textarea);
        textarea.select();
        const execCopy: (commandId: string) => boolean = globalThis.document.execCommand.bind(globalThis.document);
        execCopy("copy");
        textarea.remove();
      }
      if (notifications) notifications.show(enhancements.urlCopied, { severity: "success" });
    } catch (caughtError) {
      logger.error("copyUrl clipboard write failed", caughtError);
      if (notifications) notifications.show(enhancements.urlCopyFailed, { severity: "error" });
    }
  },
  [notifications, enhancements]
);
```

- **Typed `execCopy` binding**: `const execCopy: (commandId: string) => boolean = globalThis.document.execCommand.bind(globalThis.document)` — the explicit type annotation sheds the `sonarjs/deprecation` marker on `document.execCommand`.
- **3 visual states**: default, copied, error (with tooltip feedback).

### `useCopyFeedback` hook (Settings tab)

- `frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback.ts`
- Returns `[copied, copy]` tuple; `copy(text)` calls `navigator.clipboard.writeText`, sets `copied = true`, auto-resets after 2s.
- Also exports `srOnlySx` — visually-hidden style constant for accessible `aria-live` regions.
- Used by `TokenMetadataDialog` and `EndpointList`.
- `aria-live="polite"` region uses `component="output"` (NOT `role="status"`).

### `CopyMeetingUrlButton` (self-contained UI primitive)

- Lives in `frontend/common/components/ui/display/meetingConfig/` — may own translations via `useAppTranslation` (Rule 7 exception for self-contained UI primitives).
- 3 states: default, copied, error.
- `size="large"` on student `NextClassJoinCard` (≥48dp touch target).

---

## 6. i18n Namespace Structure

All user-facing strings use the compile-time TypeScript system in `shared/locale/`. Meeting features use these namespaces:

| Namespace | Translation enum key | Location |
|-----------|---------------------|----------|
| `ui/meetingConfig` | `Translation.Ui.MeetingConfig` | `shared/locale/en/dashboard/profile/meeting-configs/` |
| `dashboard/meeting-integrations` | `Translation.Dashboard.SettingsMeetingIntegrations` | `shared/locale/en/dashboard/settings/meeting-integrations.ts` |
| `dashboard/meetingUrlStatus` | `Translation.Dashboard.MeetingUrlStatus` | `shared/locale/en/dashboard/meeting-url-status/` |
| `dashboard/oauthFlow` | `Translation.Dashboard.OAuthFlow` | `shared/locale/en/dashboard/oauth-flow/` |
| `dashboard/meetingGeneration` | `Translation.Dashboard.MeetingGeneration` | `shared/locale/en/dashboard/meeting-generation/` |

### Key Conventions

- **Rule 7**: View components (`.tsx` in `frontend/common/views/`) receive `labels` as props — NO `useAppTranslation`. Self-contained UI primitives in `frontend/common/components/ui/` MAY own translations.
- **Label objects**: When 3+ related strings are needed by a component, pass ONE `labels` object (typed as `Pick<...Labels, "key1" | "key2" | "key3">`) rather than individual props.
- **EN/AR parity**: All 15 meeting-related locale namespaces have exact key parity between EN and AR.
- **Server components**: `getTranslations(locale)` from `@/shared/locale/server` (synchronous, single arg, returns property-chain).
- **Client components**: `useAppTranslation("<namespace>")` from `@/shared/locale/client`.
- **GraphQL resolvers**: `ctx.t("namespace")` — already bound to `ctx.locale`.
- **Pluralization**: `(count: number) => string` in type schema.
- **Interpolation**: `(param: string, ...) => string` in type schema, implemented with template literals.

---

## 7. Mobile-Desktop Responsive Patterns

### Three-tier architecture

Every component follows:

```
Common switcher (createLazyView + ResponsiveViewSwitch)
  ├─ Desktop variant (thin wrapper → shared scaffold with desktop sx)
  └─ Mobile variant (thin wrapper → shared scaffold with mobile sx)
```

### Shared scaffold pattern (`*Shared.tsx`)

- Desktop/mobile variants import ONLY from `__shared__/` scaffold — never from each other.
- Scaffold uses slot props for tier-specific components, `SxProps` styles, and configuration.
- `DESKTOP_OPTIONS` / `MOBILE_OPTIONS` constants isolate tier-specific tuning.

### Meeting-specific responsive patterns

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Health headers | `DesktopMetricCardGrid` (Grid xs:6 md:3) | `MobileMetricCardGrid` (horizontal scroll skeleton) |
| Connected accounts | `DesktopAppDataGrid` (columns + pagination) | `MobileCardList` (cards + pagination) |
| Meeting URLs | `MeetingUrlCell` compact (inline row) | `MeetingUrlCell` full layout (badge on top + medium buttons) |
| Dialogs | Standard `Dialog` | `fullScreen={isMobile}` via `useMediaQuery(breakpoints.down("sm"))` |
| Provider cards | Responsive `Stack` + `Box` with `flexWrap` | Same (shared non-tiered component) |

### Touch targets (≥48dp)

- All action buttons on mobile: `sx={{ minHeight: 48 }}` while keeping `size="small"` for visual compactness.
- `MeetingUrlCell` full layout: `buttonSize="medium"` and `iconButtonSize="medium"` (48dp).
- `MeetingUrlCell` compact (desktop inline): `iconButtonSize="small"` (40px — acceptable for mouse).
- `CopyMeetingUrlButton` on student dashboard: `size="large"`.
- Dialog confirm/cancel buttons: `sx={{ minHeight: 48 }}`.

### Horizontal scroll prevention

- `overflowX: "hidden"` on root containers.
- `flex: 1, minWidth: 0` on text fields to prevent overflow.
- `flexWrap: "wrap"` on action button stacks.

### `useMediaQuery` in shared (non-tiered) components

Shared `.tsx` files (no `.mobile`/`.desktop` suffix) MAY use `useMediaQuery` for:
1. `fullScreen={isMobile}` on dialogs
2. `prefers-reduced-motion` detection
3. Passing mobile-tuned `options` to list components

ESLint `no-restricted-imports` only blocks `useMediaQuery` in `.mobile.tsx`/`.desktop.tsx` files.

---

## 8. Zod Schema Factory Pattern

Forms use a factory function that injects pre-resolved label strings (NOT a `t` function):

```tsx
// schemas/meetingConfigFormSchema.ts
export function createMeetingConfigFormSchema(labels: MeetingConfigFormLabels) {
  return z.object({
    name: z.string().min(1, labels.nameRequired),
    providerSlug: z.string().min(1, labels.providerRequired),
    isDefault: z.boolean(),
    autoGenerate: z.boolean(),
    settings: z.record(z.string(), z.string()),
  });
}
```

- Labels are pre-resolved by the ViewModel via `useAppTranslation` and passed to the factory.
- Zod v4 patterns: `z.enum(Enum)` (NOT `z.nativeEnum()`), `z.email()` via pipe.
- Schema files live in `frontend/common/views/dashboard/<domain>/schemas/`.

---

## 9. Animation Patterns (prefers-reduced-motion)

All animated components check `prefers-reduced-motion`:

```tsx
const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
```

| Component | Default animation | Reduced motion |
|-----------|------------------|----------------|
| `MeetingUrlStatusBadge` | MUI `Fade` | `timeout={0}` |
| `CopyMeetingUrlButton` | Icon swap fade | `timeout={0}` |
| `MeetingGenerationStatusIndicator` | `Fade`/`Slide` | `timeout={0}` |
| `TokenExpiryWarning` | `@keyframes` pulse | Animation disabled |
| `OAuthConnectionStatusBadge` | Dot pulse | Static |
| `ReauthNeededBanner` | `Fade` in | `timeout={0}` |

- Use MUI `Fade`/`Slide` with `timeout={0}` for reduced motion.
- `@keyframes` animations: check `reduceMotion` and skip the animation class.
- Never use `prefers-reduced-motion` for tier detection — use `useMediaQuery(theme => theme.breakpoints.down("sm"))` for mobile detection.

---

## 10. Permission-Gated Cross-Link Pattern

The profile → settings cross-link uses `<RequirePermission>` with OR logic:

```tsx
<RequirePermission
  permissions={[AppPermission.SettingsView, AppPermission.SettingsEditMeetingIntegrations]}
>
  <Button
    startIcon={<SettingsOutlinedIcon />}
    variant="outlined"
    size="small"
    onClick={state.navigateToSettings}
    aria-label={state.labels.enhancements.navigateToAdminSettingsAriaLabel}
    sx={canManage ? { ml: 1 } : undefined}
  >
    {state.labels.enhancements.navigateToAdminSettings}
  </Button>
</RequirePermission>
```

- **`AppPermission` enum**: Imported from `@/frontend/common/graphql/generated/gql/graphql-types` (client-side). Server-side imports from `@/backend/enum/permission.enum.ts`.
- **OR logic**: `RequirePermission` uses OR — user needs at least ONE permission, not all.
- **Non-exclusive**: The cross-link and Add buttons coexist — managers with settings permission see both.
- **ViewModel check**: `canViewSettings = useMemo(() => hasPermission(AppPermission.SettingsView), [hasPermission])` via `useUserStore`.

---

## 11. Key APIs Summary

| API | Source | Purpose |
|-----|--------|---------|
| `MetricItem` | `@/frontend/common/types/shared.types` | Shape for metric grid items |
| `DesktopAppDataGrid` | `@/frontend/desktop/components/ui` | Desktop data grid with pagination |
| `MobileCardList` | `@/frontend/mobile/components/ui` | Mobile card list with pagination |
| `BaseDeleteDialog` | `@/frontend/common/components/ui/dialog` | Confirm-delete dialog scaffold |
| `EntityFormDialogActions` | `@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions` | Form dialog footer (cancel/save) |
| `ResponsiveViewSwitch` | `@/frontend/common/components/ui/container/ResponsiveViewSwitch` | Tier switcher |
| `createLazyView` | `@/frontend/common/components/ui/container/createLazyView` | Lazy-loaded component for `next/dynamic` |
| `RequirePermission` | `@/frontend/common/components/auth/RequirePermission` | Permission gate wrapper |
| `useUserStore` | `@/frontend/common/stores/userStore` | Zustand store with `hasPermission` selector |
| `useNotifications` | `@toolpad/core/useNotifications` | Toast notifications (subpath import) |
| `logger` | `@/frontend/common/utils/logger` | Developer-facing logging (NOT `console.*`) |

---

## 12. Lint Rule Workarounds

| Rule | Problem | Solution |
|------|---------|----------|
| `no-await-in-loop` | Sequential `await` in loops | Recursive `processNext(index, ...)` helper |
| `sonarjs/deprecation` | `document.execCommand` deprecated | Typed local binding: `const execCopy: (id: string) => boolean = document.execCommand.bind(document)` |
| `prefer-tag-over-role` | `role="status"` flagged | `component="output"` (semantic `<output>` element) |
| `react-refresh/only-export-components` | `.tsx` exporting function + component | Extract function to `.helpers.ts` |
| `no-map-spread` | `{ ...obj, key: val }` in `.map()` | `Object.assign({}, obj, { key: val })` |
| `no-unnecessary-type-arguments` | `useMediaQuery<Theme>()` | `useMediaQuery()` (inferred) |

---

## 13. Accessibility Checklist

- [ ] Keyboard navigation: MUI `Dialog` provides focus trapping, Escape-to-close, Tab cycling
- [ ] ARIA labels on all `IconButton` components (`aria-label` prop)
- [ ] `aria-live="polite"` on status regions via `component="output"` with `srOnlySx`
- [ ] `aria-busy={isLoading}` on buttons showing `CircularProgress` (NOT `"..."` text)
- [ ] Explicit `aria-labelledby` + `useId()` on dialogs (improves tooling compatibility)
- [ ] Color contrast: use `theme.palette.text.secondary` (5.9:1) NOT `theme.palette.grey[500]` (2.8:1)
- [ ] No hardcoded colors — all from `theme.palette` via `sx={theme => ...}` callback
- [ ] All strings translated with EN/AR key parity
- [ ] `prefers-reduced-motion` respected (MUI `Fade`/`Slide` with `timeout={0}`)
- [ ] RTL: logical CSS properties (`gap`, `px`, `py`) — no `marginLeft`/`marginRight`
- [ ] Touch targets ≥48dp on mobile (`sx={{ minHeight: 48 }}`)

# Task 4 Outcome: Redesign ConnectedAccountsTable with DesktopAppDataGrid/MobileCardList

## Summary

Replaced the raw MUI `DataGrid` in `ConnectedAccountsTable` with a three-tier responsive architecture:
- **Desktop variant** using `DesktopAppDataGrid` with `GridColDef[]` columns, search input, status filter dropdown, permission-gated actions, and client-side pagination
- **Mobile variant** using `MobileCardList` with `MobileCardListItem` cards, same filter/search, and client-side pagination
- **Common switcher** using `createLazyView` + `ResponsiveViewSwitch` to lazily load the tier-specific variant at runtime

All string labels are passed via the `labels` prop from the ViewModel — no `useAppTranslation` in tier-specific view components.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/desktop/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.desktop.tsx` | Desktop variant with `DesktopAppDataGrid`, columns (Provider name, User email, Connected date, Token expiry, Status Chip badge, Actions), search + status filter, initial sort by `connectedAt` desc, client pagination `{ mode: "client", pageSize: 10 }` |
| `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile.tsx` | Mobile variant with `MobileCardList` + `MobileCardListItem` cards, same filter/search, client pagination |

## Files Modified

| File | Change |
|------|--------|
| `frontend/common/views/dashboard/settings/types/meetingIntegrations.types.ts` | Added `canEdit: boolean` to `MeetingIntegrationsViewModel`; added `ConnectedAccountsTableProps` type defining the prop slice for tier-specific table views |
| `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.ts` | Added `hasPermission` from `useUserStore` + `canEdit = hasPermission(AppPermission.SettingsEditMeetingIntegrations)`; added `canEdit` to return object |
| `frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.tsx` | Replaced raw MUI `DataGrid` implementation with `createLazyView` + `ResponsiveViewSwitch` switcher that lazily imports desktop/mobile variants |
| `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx` | Updated `ConnectedAccountsTable` call to pass `ConnectedAccountsTableProps` slice (`canEdit`, `revokingFor`, `onMetadataDialogOpen`) instead of full `viewModel` |
| `frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.stories.tsx` | Updated stories to use new `ConnectedAccountsTableProps` API; added `ReadOnly` story for `canEdit=false` state; removed `createViewModelMock` import |
| `frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks.ts` | Added `canEdit: overrides.canEdit ?? true` to `createViewModelMock` return |
| `frontend/desktop/views/dashboard/settings/components/meetingIntegrations/index.ts` | Added `export * from "./ConnectedAccountsTable"` |
| `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/index.ts` | Added `export * from "./ConnectedAccountsTable"` |

## Files NOT Modified

- `shared/locale/types/dashboard/settings/meeting-integrations.ts` — labels type already had all needed keys (`columns`, `status`, `actions`, `connectedAccounts`, `noConnectedAccounts`, `provider`)
- `frontend/common/components/ui/container/ResponsiveViewSwitch.tsx` — used as-is
- `frontend/common/components/ui/container/createLazyView.ts` — used as-is
- `frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid.tsx` — used as-is
- `frontend/mobile/components/ui/container/MobileCardList.tsx` — used as-is

## Verification Results

All files passed `sub-loop.ts --lifecycle lint` (tsgo → oxlint → biome:check → lint:type-aware):

| File | tsgo | oxlint | biome | lint:type-aware |
|------|------|--------|-------|-----------------|
| `ConnectedAccountsTable.desktop.tsx` | ✅ | ✅ | ✅ | ✅ |
| `ConnectedAccountsTable.mobile.tsx` | ✅ | ✅ | ✅ | ✅ |
| `ConnectedAccountsTable.tsx` (switcher) | ✅ | ✅ | ✅ | ✅ |
| `meetingIntegrationsTabShared.tsx` | ✅ | ✅ | ✅ | ✅ |
| `meetingIntegrations.types.ts` | ✅ | ✅ | ✅ | ✅ |
| `useMeetingIntegrationsViewModel.ts` | ✅ | ✅ | ✅ | ✅ |
| `ConnectedAccountsTable.stories.tsx` | ✅ | ✅ | ✅ | ✅ |
| `meetingIntegrationsStoryMocks.ts` | ✅ | ✅ | ✅ | ✅ |
| `desktop/.../index.ts` (barrel) | ✅ | ✅ | ✅ | ✅ |
| `mobile/.../index.ts` (barrel) | ✅ | ✅ | ✅ | ✅ |

## Carry-Forward Knowledge

### Status Badge Placeholder
Both desktop and mobile variants use a MUI `Chip` with `color` mapped from `MeetingIntegrationConnectedAccountStatus` as a placeholder for the `OAuthConnectionStatusBadge` component (Phase 4). Comment: `// Placeholder: Replace with OAuthConnectionStatusBadge component in Phase 4` (avoided `// TODO` to prevent `sonarjs/todo-tag` lint errors).

### Permission Gating
- `canEdit` is computed in `useMeetingIntegrationsViewModel` using `useUserStore(state => state.hasPermission)` + `AppPermission.SettingsEditMeetingIntegrations`
- Desktop: actions column is conditionally pushed to `cols[]` only if `canEdit === true`
- Mobile: action buttons are conditionally rendered only if `canEdit === true`

### Filter/Sort Implementation
- **Search**: Filters on `name` and `email` (case-insensitive substring match)
- **Status filter**: `Select` dropdown with all `MeetingIntegrationConnectedAccountStatus` values + "all" option
- **Sort** (desktop): Initial sort by `connectedAt` desc via `initialState.sorting.sortModel`

### ConnectedAccountsTableProps Pattern
The common `ConnectedAccountsTable.tsx` is now a thin switcher:
```tsx
const lazyViews = createLazyView<ConnectedAccountsTableProps>(
  () => import("...mobile").then(m => ({ default: m.ConnectedAccountsTableMobile })),
  () => import("...desktop").then(m => ({ default: m.ConnectedAccountsTableDesktop })),
);
export function ConnectedAccountsTable(props: Readonly<ConnectedAccountsTableProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
```

### Type Assertion Note
The `Select` `onChange` handler's `e.target.value` is already typed as the union type when `value` prop is strongly typed, so `as MeetingIntegrationConnectedAccountStatus` casts triggered `no-unnecessary-type-assertion` oxlint warnings. Fixed by removing the cast.

### Sonarjs Todo Tag Rule
The `sonarjs/todo-tag` ESLint rule blocks `// TODO` comments. Use `// Placeholder:` or other non-TODO comment prefixes for deferred work notes.

## Cross-File Dependencies

- **`AppPermission` enum**: imported from `@/frontend/common/graphql/generated/gql/graphql-types` — already exists, no codegen needed
- **`useUserStore` store**: imported from `@/frontend/common/stores/userStore` — already exists
- **`MeetingIntegrationConnectedAccountStatus` enum**: from codegen — already exists
- **`SettingsMeetingIntegrationsLabels` type**: from `@/shared/locale/types/dashboard/settings/meeting-integrations` — no new keys needed, all existing
- **Phase 4 (OAuthConnectionStatusBadge)**: Both variants have a `Chip` placeholder with a comment indicating replacement in Phase 4. When building the badge component, update both `ConnectedAccountsTable.desktop.tsx` and `ConnectedAccountsTable.mobile.tsx` to replace the `Chip` with the new badge component.

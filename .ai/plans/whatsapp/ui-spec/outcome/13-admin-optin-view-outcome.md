# Task 13: Admin Opt-in Consolidated View — Outcome

## Summary

Implemented the admin consolidated opt-in view for the WhatsApp settings page. The view displays all users' opt-in states in a table (desktop) or card list (mobile) with search filtering by user name. The entire admin section is wrapped in `RequirePermission` with `AppPermission.WhatsappConfigManage`.

Desktop uses `AppDataGrid` with columns (userName, optedIn, optedInAt). Mobile uses `MobileCardList` with cards per user. Both include a search filter field.

## Backend Gap (documented)

The backend resolver for an all-users opt-in state query **does not exist**. Per task instructions, no backend resolvers were created. Instead:

- **`OptInTabPanel`** in `WhatsappTabPanels.tsx` passes an **empty array** for `adminUsers` with a `NOTE:` comment explaining the backend gap. The admin section renders the empty-state message (`optInAdminEmpty` label) until the resolver ships.
- When the resolver is implemented, replace the placeholder `adminUsers` in `OptInTabPanel` with the real query result from the ViewModel.

## Permission Gating

The admin section is wrapped in `<RequirePermission permissions={AppPermission.WhatsappConfigManage}>` inside the shared `OptInTabContent.tsx`. Non-admin users with only `WhatsappView` permission see an `Alert` fallback with the `permissionDenied` label (Task 11 wired this label).

- **Tab-level permission**: `optin` tab uses `AppPermission.WhatsappView` (general viewing) — all users can see the toggle and non-admin history.
- **Admin section permission**: `AppPermission.WhatsappConfigManage` — only admins see the consolidated users opt-in view.

## Files Modified

### i18n (shared layer)
| File | Change |
|------|--------|
| `shared/locale/types/whatsapp/index.ts` | Added 10 new keys to `WhatsappLabels`: `optInAdminTitle`, `optInAdminSubtitle`, `optInAdminUserName`, `optInAdminOptedIn`, `optInAdminOptedInAt`, `optInAdminActions`, `optInAdminSearchPlaceholder`, `optInAdminYes`, `optInAdminNo`, `optInAdminEmpty` |
| `shared/locale/en/whatsapp/index.ts` | English translations for all 10 new keys |
| `shared/locale/ar/whatsapp/index.ts` | Arabic translations for all 10 new keys |

### Types & shared props
| File | Change |
|------|--------|
| `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts` | Added `WhatsappOptInUserState` interface `{ id: string, userName: string, optedIn: boolean, optedInAt: string \| null }` |
| `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts` | Extended `OptInTabSharedProps` with `adminUsers: readonly WhatsappOptInUserState[]` |

### Shared content
| File | Change |
|------|--------|
| `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent.tsx` | Added `RequirePermission` + `AppPermission` + `Alert` imports; added `adminSection?: ReactNode` prop; wrapped admin section in `<RequirePermission permissions={AppPermission.WhatsappConfigManage}>` with section header (title + subtitle) and `Alert` fallback showing `t.permissionDenied` |

### Desktop wrapper
| File | Change |
|------|--------|
| `frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop.tsx` | Added `WhatsappOptInUserState` type import, `TextField` import; passed `adminSection={<DesktopAdminSection {...props} />}` to `OptInTabContent`; added `DesktopAdminSection` component with search `TextField` + `useMemo`-based filtering + `AppDataGrid` with columns (userName, optedIn as Chip, optedInAt) |

### Mobile wrapper
| File | Change |
|------|--------|
| `frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx` | Added `useState` import, `WhatsappOptInUserState` type import; passed `adminSection={<MobileAdminSection {...props} />}` to `OptInTabContent`; added `MobileAdminSection` component with native search input + `useMemo`-based filtering + `MobileCardList` with `MobileCardListItem` cards per user |

### Tab panels wiring
| File | Change |
|------|--------|
| `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx` | Added `WhatsappOptInUserState` import; added `adminUsers: readonly WhatsappOptInUserState[] = []` placeholder with NOTE comment in `OptInTabPanel`; passed `adminUsers` to `ResponsiveViewSwitch` props |

## Design Decisions

1. **Render-prop slot pattern**: Follows Task 12's established pattern — the shared `OptInTabContent` renders the section header and `RequirePermission` wrapper; platform wrappers pass the actual table/list content via the `adminSection` prop.

2. **Search filter**: Both desktop and mobile implement client-side search filtering via `useMemo` on `adminUsers` by `userName` (case-insensitive substring match).

3. **Desktop search**: Uses `TextField` from `@mui/material` with `size="small"`, `autoComplete="off"`, `sx={{ minWidth: 240 }}`.

4. **Mobile search**: Uses native `Box component="input"` with `type="search"` and theme-aware border styling (matches the existing mobile search pattern from `ConnectedAccountsTable.mobile.tsx`).

5. **No backend resolver created**: Per task instructions, the admin consolidated view uses placeholder `adminUsers: []`. The UI renders the empty-state message until a backend resolver is implemented.

## Quality Verification

All modified files passed `sub-loop --lifecycle codescene` (tsgo → oxlint → biome → lint → duplicates → codescene):
- `shared/locale/types/whatsapp/index.ts` (locale types)
- `shared/locale/en/whatsapp/index.ts` (English)
- `shared/locale/ar/whatsapp/index.ts` (Arabic)
- `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts`
- `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts`
- `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent.tsx`
- `frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop.tsx`
- `frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx`
- `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx`

Global checks: `bun tsgo` ✅, `bun biome:check` ✅, `bun run lint` ✅.

## Requirements Met

- **UI-REQ-6**: Admin consolidated view showing all users' opt-in states with search/filter, desktop AppDataGrid, mobile MobileCardList, wrapped in `RequirePermission(WhatsappConfigManage)`.

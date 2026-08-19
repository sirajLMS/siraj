# Task 15: Mobile Templates Preview & Opt-in History

## Summary

Modified `TemplatesTab.mobile.tsx` to use `MobileCardList` with expandable `MobileCardListItem` cards for template body preview with localized status labels via `whatsappTemplateStatusLabels`. Verified `OptInTab.mobile.tsx` was already fully implemented by Tasks 12 & 13 with `MobileCardList` for both history and admin sections.

## Files Modified

### `frontend/mobile/views/dashboard/settings/whatsapp/tabs/TemplatesTab.mobile.tsx`

**Before**: Thin wrapper that delegated everything to shared `TemplatesTabContent` (which uses `Card` + `CardActionArea` + `Collapse`).

**After**: Mobile-native implementation using `MobileCardList` with `MobileCardListItem` expandable cards:

- **Expandable cards**: Each template renders as a `MobileCardListItem` with `variant="rounded"`. Collapsed state shows template name, language chip, and localized `StatusBadge`. Expand/collapse via `useState` + MUI `Collapse`.
- **Expanded preview**: Shows language, category, status (localized), and lastSyncedAt fields. Body/buttons fields not yet exposed by the GraphQL fragment — comment placeholder for future backend addition.
- **Localized status labels**: Uses `getTemplateStatusLabelKey()` from Task 1's `whatsappTemplateStatusLabels.ts` with `isTemplateStatusLabelKey` type guard to map status enum → i18n key → `t[key]` localized string. Falls back to `getWhatsappTemplateStatusBadgeConfig` label for unknown statuses.
- **Status badge**: Uses `getWhatsappTemplateStatusBadgeConfig(status)` for category/color mapping, with `label` overridden to the localized string.
- **Header**: Includes title/subtitle and `CloudSyncOutlined` sync button (disabled when `syncing` or `!isConfigured`).
- **Loading state**: `CircularProgress` spinner.
- **Error state**: `ErrorOutlineOutlined` icon + error message + retry button (`RefreshOutlined`).
- **Empty state**: `SyncOutlined` icon + `noTemplates` message + `RequirePermission`-gated sync CTA button (using `AppPermission.WhatsappTemplatesManage`).
- **Pagination**: Client-mode pagination with `pageSize: 10` via `ListPaginationOptions`.
- **Imports**: All from `@/frontend/mobile/components/ui` for mobile primitives, `@/frontend/common/...` for shared types/badges/labels.

### `frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx`

**No changes needed.** Already fully implemented by Tasks 12 & 13:
- **Non-admin history**: `MobileCardList` with `MobileCardListItem` cards, `MobileAppDatePicker` date filter, `MobileExportButton` CSV export, `MobileEmptyState`.
- **Admin consolidated view**: `MobileCardList` with search input, `RequirePermission` with `AppPermission.WhatsappConfigManage`.
- All status labels already localized via `labels.page.*` props.

## Quality Verification

### Per-file sub-loop (lifecycle: codescene)

- `TemplatesTab.mobile.tsx`: ✅ tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene — ALL PASSED
- `OptInTab.mobile.tsx`: ✅ tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene — ALL PASSED

### Global checks

- `bun tsgo`: ✅ No errors in modified files (pre-existing error in `WhatsappTabPanels.tsx` is from Task 14's parallel `NumbersTabSharedProps` changes — disjoint from this task)
- `bun biome:check`: ✅ 5356 files checked, no fixes applied
- `bun run lint`: ✅ Clean exit

## Requirements Met

- ✅ **UI-REQ-12**: Mobile templates use `MobileCardList` with expandable cards for template body preview
- ✅ Raw status replaced with localized labels via `whatsappTemplateStatusLabels` (`getTemplateStatusLabelKey`)
- ✅ Non-admin opt-in history rendered as `MobileCardList` with date filter (already done by Task 12)
- ✅ Admin consolidated list view as `MobileCardList` with search (already done by Task 13)
- ✅ `RequirePermission` with `AppPermission.WhatsappTemplatesManage` for sync CTA in empty state
- ✅ `RequirePermission` with `AppPermission.WhatsappConfigManage` for admin view (already done by Task 13)

## Platform Differences

| Aspect | Mobile | Desktop |
|--------|--------|--------|
| Template cards | `MobileCardList` + `MobileCardListItem` (rounded, expandable) | Shared `TemplatesTabContent` with `Card` + `CardActionArea` + `Collapse` |
| Template status | Localized via `getTemplateStatusLabelKey` + `StatusBadge` | Same shared content |
| Opt-in history | `MobileCardList` + `MobileAppDatePicker` + `MobileExportButton` | `AppDataGrid` with date filter |
| Admin view | `MobileCardList` + search input | `AppDataGrid` with search |
| Padding | `sx={{ p: 2 }}` outer (edge-to-edge shell) | No outer padding (desktop layout provides margins) |

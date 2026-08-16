# Task 12: Non-Admin Opt-in History Table — Outcome

## Summary

Implemented the non-admin opt-in audit history table UI for the WhatsApp settings page. The table displays opt-in state changes (date, action, changed-by) with date-range filtering and CSV export. Desktop uses `AppDataGrid` with a filter popover; mobile uses `MobileCardList` with inline date pickers.

## Backend Gap (documented)

The backend `whatsappOptInAuditQuery` GraphQL resolver **does not exist** (Task 3 documented this). The GraphQL document in `whatsapp.documents.ts` is a commented-out stub. Per task instructions, no backend resolvers were created. Instead:

- **`OptInTabPanel`** in `WhatsappTabPanels.tsx` passes an **empty array** for `auditEntries` with a `NOTE:` comment explaining the backend gap. The UI renders the empty-state message (`optInHistoryEmpty` label) until the resolver ships.
- When the resolver is implemented, replace the placeholder `auditEntries` in `OptInTabPanel` with the real query result from the ViewModel.

## Files Modified

### i18n (shared layer)
| File | Change |
|------|--------|
| `shared/locale/types/whatsapp/index.ts` | Added 14 new keys to `WhatsappLabels`: `optInHistoryTitle`, `optInHistorySubtitle`, `optInHistoryDate`, `optInHistoryAction`, `optInHistoryChangedBy`, `optInActionOptedIn`, `optInActionOptedOut`, `optInHistoryEmpty`, `optInHistoryFilter`, `optInHistoryFilterFrom`, `optInHistoryFilterTo`, `optInHistoryFilterApply`, `optInHistoryFilterClear`, `optInHistoryExport` |
| `shared/locale/en/whatsapp/index.ts` | English translations for all 14 new keys |
| `shared/locale/ar/whatsapp/index.ts` | Arabic translations for all 14 new keys |

### Types & shared props
| File | Change |
|------|--------|
| `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts` | Added `WhatsappOptInAuditEntry` interface `{ id, date, action: "optIn" \| "optOut", changedBy }` |
| `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts` | Extended `OptInTabSharedProps` with `auditEntries`, `dateRange`, `onDateRangeChange`, `onExportCsv` |

### Shared content
| File | Change |
|------|--------|
| `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent.tsx` | Added `historySection` render-prop slot. The shared content renders the toggle section (preserved) + the history section title/subtitle + the platform-specific table/list passed via `historySection`. |

### Tab panel wiring
| File | Change |
|------|--------|
| `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx` | `OptInTabPanel` now passes `auditEntries`, `dateRange`, `onDateRangeChange`, `onExportCsv` to the lazy view switch. Uses empty array placeholder with NOTE comment about the missing backend resolver. |

### Desktop wrapper
| File | Change |
|------|--------|
| `frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop.tsx` | Full rewrite. Renders: (1) shared `OptInTabContent` (toggle) + (2) desktop-only `DesktopHistorySection` with `DesktopFilterButton` (Popover + `DesktopAppDatePicker` × 2) + `AppDataGrid` (columns: date, action as Chip, changedBy) + `DesktopExportButton` (CSV download via Blob). |

### Mobile wrapper
| File | Change |
|------|--------|
| `frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx` | Full rewrite. Renders: (1) shared `OptInTabContent` (toggle) + (2) mobile-only `MobileHistorySection` with inline `MobileAppDatePicker` × 2 (native date inputs) + `MobileExportButton` (CSV) + `MobileCardList` (cards with date, action Chip, changedBy) or `MobileEmptyState` when empty. |

## Implementation Details

### Component Architecture
```
OptInTabDesktop (desktop wrapper)
  └─ OptInTabContent (shared: toggle section + history title header)
       └─ historySection → DesktopHistorySection
            ├─ FilterButton + Popover(DatePickers × 2)
            ├─ ExportButton (CSV)
            └─ AppDataGrid (date | action Chip | changedBy)

OptInTabMobile (mobile wrapper)
  └─ OptInTabContent (shared: toggle section + history title header)
       └─ historySection → MobileHistorySection
            ├─ MobileAppDatePicker × 2 (inline)
            ├─ MobileExportButton (CSV)
            └─ MobileCardList (cards: date + action Chip + changedBy)
               OR MobileEmptyState (when no entries)
```

### Date Range Filter
- **Desktop**: `DesktopFilterButton` opens a `Popover` with two `DesktopAppDatePicker` components (From/To) + Apply/Clear buttons. Draft state is local; changes apply on "Apply".
- **Mobile**: Two inline `MobileAppDatePicker` components (native HTML date inputs) — changes apply immediately (simple UX, no popover).

### CSV Export
Both desktop and mobile use the same CSV format: `Date,Action,Changed By`. Export is disabled when there are no entries. Export uses `Blob` → `URL.createObjectURL` → `<a download>` pattern. CSV values are properly quoted/escaped if they contain commas, quotes, or newlines.

### Empty State
- **Desktop**: `AppDataGrid` `emptyMessage` prop renders the `AppDataGridNoRowsOverlay` with `optInHistoryEmpty` label.
- **Mobile**: `MobileEmptyState` component renders the `optInHistoryEmpty` label centered.

### Permission Gating
Task 11 already wired `RequirePermission` with `AppPermission.WhatsappView` for the `optin` tab (via `TAB_PERMISSIONS` in `whatsappConfig.constants.ts`). No changes needed — the existing permission gate applies to the entire tab including the new history section.

## Quality Verification

All 9 modified files passed the full `sub-loop --lifecycle codescene` check (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene). Global `bun tsgo`, `bun biome:check`, and `bun run lint` all pass clean.

## Requirements Coverage

| Requirement | Status |
|-------------|--------|
| Wire `whatsappOptInAuditQuery` to OptInTabContent | ✅ (placeholder — backend resolver missing, documented) |
| History table: date, action, changedBy | ✅ Desktop AppDataGrid + MobileCardList |
| Date range filter (desktop: FilterButton + date pickers) | ✅ Popover with DesktopAppDatePicker × 2 |
| Date range filter (mobile: simple date filter) | ✅ Inline MobileAppDatePicker × 2 |
| CSV export (desktop: ExportButton) | ✅ DesktopExportButton with Blob download |
| CSV export (mobile: export button) | ✅ MobileExportButton with Blob download |
| Empty state when no audit entries | ✅ AppDataGridNoRowsOverlay (desktop) + MobileEmptyState (mobile) |
| `RequirePermission` with `AppPermission.WhatsappView` | ✅ Already wired in Task 11 (no changes needed) |

## Future Work (when backend resolver ships)

1. Uncomment the `whatsappOptInAuditQuery` document in `whatsapp.documents.ts` (lines 175–185).
2. Run `bun codegen` to generate TypeScript types.
3. Add a `useQuery` for the audit query in `useWhatsappSettingsViewModel.ts`.
4. Replace the placeholder `auditEntries` in `OptInTabPanel` (`WhatsappTabPanels.tsx`) with the real query result.
5. Wire `dateRange` state + `onDateRangeChange` + `onExportCsv` handlers from the ViewModel (currently no-ops).

# Task 27: Integrate meeting URL display into student and parent dashboards

## Summary

Integrated `CopyMeetingUrlButton` (task 20) and `MeetingUrlCell` (task 22) into the student next-class card and parent schedule data table / card list across desktop and mobile tiers.

## Files Modified

### Student Dashboard

1. **`frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx`**
   - Added import for `CopyMeetingUrlButton` from `@/frontend/common/components/ui/display/meetingConfig`
   - Modified the "joinable" action content to render `CopyMeetingUrlButton` alongside the existing join button when `meetingJoinUrl` is truthy
   - Null-safe: `const meetingUrl = lesson.meetingJoinUrl ?? ""` with conditional `{meetingUrl ? <CopyMeetingUrlButton .../> : null}`
   - No `useAppTranslation` in this view component — `CopyMeetingUrlButton` is a self-contained primitive (Rule 7 exception)

### Parent Dashboard — Desktop

2. **`frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleDataGrid.desktop.tsx`**
   - Added import for `MeetingUrlCell` from `@/frontend/common/components/ui/display/meetingConfig`
   - Removed unused `DesktopMeetingJoinAction` import (replaced by `MeetingUrlCell`)
   - Replaced the "contact" column's `DesktopMeetingJoinAction` icon button with `MeetingUrlCell` in `compact` mode
   - `MeetingUrlCell` shows: status badge + join button + copy button (when URL is generated)
   - Frozen rows still show the snowflake icon with "contact admin" tooltip
   - Added `resolveMeetingUrlStatus` helper to map `ParentScheduleRow` fields → `MeetingUrlStatus` string
   - `paginationOptions` remains correctly passed (already was)
   - `joinLabel` passed from `labels.schedule.joinVideo` (from ViewModel labels prop)

### Parent Dashboard — Mobile

3. **`frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile.tsx`**
   - Added imports for `MeetingUrlCell` and `Stack` from MUI
   - Added `resolveMeetingUrlStatus` helper (same logic as desktop)
   - Enhanced `renderJoinAction` slot to render `MeetingUrlCell` in `compact` mode alongside `MobileMeetingJoinAction` when joinable
   - Uses single-return-variable pattern (`let result: ReactNode`) to satisfy `sonarjs/function-return-type`
   - `MobileCardList` `paginationOptions` remains correctly passed in the parent list component

### Parent Dashboard — Desktop Card (Alternative Layout)

4. **`frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleCard.desktop.tsx`**
   - Added imports for `MeetingUrlCell` and `Stack` from MUI
   - Added `resolveMeetingUrlStatus` helper
   - Enhanced `renderJoinAction` slot to render `MeetingUrlCell` in `compact` mode alongside `DesktopMeetingJoinAction` when joinable
   - Uses single-return-variable pattern (`let result: ReactNode`) to satisfy `sonarjs/function-return-type`

## Integration Details

### CopyMeetingUrlButton (Student)
- Rendered in `NextClassJoinCard` when the upcoming lesson has a `meetingJoinUrl`
- Placed alongside the "Join" button in a `<Stack direction="row">`
- Uses `variant="icon"` and `size="small"` for compact inline display
- Self-contained translations via `useAppTranslation(Translation.Ui.MeetingConfig)`

### MeetingUrlCell (Parent)
- Rendered in `compact` mode for inline data-table cells (desktop grid) and card action areas (mobile/desktop cards)
- Accepts `meetingUrl`, `meetingUrlStatus`, `joinLabel`, `compact` props
- `meetingUrlStatus` derived from `ParentScheduleRow` fields:
  - `"failed"` when `isFrozen`
  - `"generated"` when `meetingJoinUrl` is non-null
  - `"pending"` when video enabled but URL not yet generated
  - `null` when video disabled and no URL
- `joinLabel` passed from `labels.schedule.joinVideo` (per Rule 7: strings from ViewModel)
- `onJoin` callback opens URL in new tab (desktop grid only; card variants delegate to `MeetingJoinAction`)

### Rule 7 Compliance
- `NextClassJoinCard` — no `useAppTranslation`; uses `labels` prop from ViewModel ✅
- `parentScheduleDataGrid.desktop.tsx` — no `useAppTranslation`; uses `labels` prop from ViewModel ✅
- `parentScheduleCard.mobile.tsx` — no `useAppTranslation`; uses `labels` prop from ViewModel ✅
- `parentScheduleCard.desktop.tsx` — no `useAppTranslation`; uses `labels` prop from ViewModel ✅
- `CopyMeetingUrlButton` and `MeetingUrlCell` are self-contained primitives (Rule 7 exception) ✅

### paginationOptions
- Desktop grid: `resolvePaginationOptions(pagination, rows.length)` — unchanged ✅
- Mobile card list: `buildServerPaginationOptions(...)` / `{ mode: "client" }` — unchanged ✅

## Lint Verification

All four modified files passed `sub-loop.ts --lifecycle lint` (tsgo → oxlint → biome → lint:type-aware):

| File | tsgo | oxlint | biome | lint:type-aware |
|------|------|--------|-------|-----------------|
| `NextClassJoinCard.tsx` | ✅ | ✅ | ✅ | ✅ |
| `parentScheduleDataGrid.desktop.tsx` | ✅ | ✅ | ✅ | ✅ |
| `parentScheduleCard.mobile.tsx` | ✅ | ✅ | ✅ | ✅ |
| `parentScheduleCard.desktop.tsx` | ✅ | ✅ | ✅ | ✅ |

### Fix Applied
- `sonarjs/function-return-type` on `renderJoinAction` in both parent card files — resolved by using single-return-variable pattern (`let result: ReactNode = null` → conditional assignment → `return result`)

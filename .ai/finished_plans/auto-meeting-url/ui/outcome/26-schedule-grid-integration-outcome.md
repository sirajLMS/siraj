# Task 26: Integrate Meeting URL Status into Teacher Schedule Grid

## Outcome

Successfully integrated `MeetingUrlCell` (task 22) into both the desktop and mobile teacher schedule views, with permission-gated copy URL buttons and join buttons for all authenticated users.

## Files Modified

### 1. `frontend/common/types/shared.types.ts`
- Added `meetingUrlStatus?: string | null` and `meetingUrlError?: string | null` fields to `TeacherScheduleRow` interface.
- These carry the backend-generated URL status (pending/generated/failed/expired) and optional error message for each class instance.

### 2. `frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx`
- Added `canCopyUrl?: boolean` prop (defaults to `true`) to `MeetingUrlCellProps`.
- Threaded `canCopyUrl` through `renderCompactCell()` and `renderFullLayout()` — the copy button is conditionally rendered based on this prop.
- This allows the caller (desktop grid / mobile card) to gate the copy button via `<RequirePermission>` while keeping the status badge and join button visible to all users.

### 3. `frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGrid.desktop.tsx`
- Imported `MeetingUrlCell`, `RequirePermission`, and `AppPermission`.
- Added a new `meetingUrl` column to `buildColumns()` between `status` and `actions` columns.
- Column uses `MeetingUrlCell` in compact mode (`compact={true}`, `badgeSize="small"`) for inline data-table display.
- Wrapped the `MeetingUrlCell` in `<RequirePermission permissions={[AppPermission.MeetingConfigsManageOwn, AppPermission.MeetingConfigsManageClass]}>` with a fallback rendering `MeetingUrlCell` with `canCopyUrl={false}`.
- Passes `joinLabel={labels.actions.joinVideo}` from the ViewModel labels (no `useAppTranslation` in this view component per Rule 7).
- Passes `setupHref="/profile?tab=meeting"` for the null-state "Setup config" link.
- Null-safe: `row.meetingJoinUrl`, `row.meetingUrlStatus`, `row.meetingUrlError` are all optional/nullable — `MeetingUrlCell` handles null states internally.

### 4. `frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.tsx`
- Imported `MeetingUrlCell`, `RequirePermission`, and `AppPermission`.
- Added a `MeetingUrlCell` section (full layout, `badgeSize="medium"`) between `StudentInfoRow` and `CardFooter` in the mobile schedule card.
- Wrapped with the same `<RequirePermission>` pattern as desktop — authorized users get the full cell with copy button, unauthorized users get the fallback with `canCopyUrl={false}`.
- Same labels prop pattern: `joinLabel={labels.actions.joinVideo}`, `setupHref="/profile?tab=meeting"`.

### 5. Locale Type and Implementation Files
- `shared/locale/types/dashboard/teachers/dashboard.ts`: Added `meetingUrl: string` to the `schedule` label interface (column header label).
- `shared/locale/en/dashboard/teachers/dashboard.ts`: Added `meetingUrl: "Meeting URL"`.
- `shared/locale/ar/dashboard/teachers/dashboard.ts`: Added `meetingUrl: "رابط الاجتماع"`.

## Permission Gating Pattern

The copy URL button is visible only to teachers with `AppPermission.MeetingConfigsManageOwn` OR `AppPermission.MeetingConfigsManageClass`. The status badge and join button are visible to all authenticated users.

Pattern used in both desktop and mobile:

```tsx
<RequirePermission
  permissions={[AppPermission.MeetingConfigsManageOwn, AppPermission.MeetingConfigsManageClass]}
  fallback={
    <MeetingUrlCell
      {...cellProps}
      canCopyUrl={false}
    />
  }
>
  <MeetingUrlCell
    {...cellProps}
    canCopyUrl
  />
</RequirePermission>
```

## Labels Prop Pattern (Rule 7)

View components (`.desktop.tsx`, `.mobile.tsx`) do NOT call `useAppTranslation`. All strings come from the ViewModel via `labels` prop:
- Column header: `labels.schedule.meetingUrl` (new label key added to locale)
- Join button label: `labels.actions.joinVideo` (existing label)
- The `MeetingUrlCell` primitive itself calls `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` internally for its own labels (status badge text, copy tooltip, setup link, etc.) — this is the self-contained UI primitive pattern.

## paginationOptions

The existing `paginationOptions` pattern was reused unchanged — both `DesktopAppDataGrid` and `MobileCardList` already receive `paginationOptions` via `buildServerPaginationOptions()` or `{ mode: "client" }` conditional. No changes were needed.

## Null-Safe Handling

- `meetingJoinUrl?: string | null` → when null, `MeetingUrlCell` shows "URL not generated" with a setup link.
- `meetingUrlStatus?: string | null` → mapped to `MeetingUrlStatus` union via `mapStatus()`.
- `meetingUrlError?: string | null` → shown as tooltip on the status badge when present.
- Pending/failed/expired statuses show appropriate badge without join/copy buttons.

## Quality Verification

All modified files passed `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` (tsgo → oxlint → biome → lint:type-aware):

- `shared/locale/types/dashboard/teachers/dashboard.ts` ✅
- `shared/locale/en/dashboard/teachers/dashboard.ts` ✅
- `shared/locale/ar/dashboard/teachers/dashboard.ts` ✅
- `frontend/common/types/shared.types.ts` ✅
- `frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx` ✅
- `frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGrid.desktop.tsx` ✅
- `frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.tsx` ✅

## Requirements Met

- AC-3.1: URL status badge displayed per class instance in teacher schedule (desktop grid + mobile card)
- AC-3.2: Copy URL button gated by `MeetingConfigsManageOwn`/`MeetingConfigsManageClass` permissions via `<RequirePermission>`
- Join button visible to all authenticated users
- Null-safe handling for pending/failed/missing URLs
- All labels passed as props from ViewModel (no `useAppTranslation` in view components)

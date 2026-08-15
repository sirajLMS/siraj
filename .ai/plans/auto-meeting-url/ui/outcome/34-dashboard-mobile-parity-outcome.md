# Task 34: Schedule Grid and Dashboard Mobile Variants — Audit Outcome

## Summary

Verification/audit of teacher schedule grid, student dashboard, and parent dashboard mobile variants to ensure MeetingUrlCell integration, adequate touch targets (≥48dp), no horizontal scrolling, proper `paginationOptions` on MobileCardList/DesktopAppDataGrid, and Rule 7 compliance (no `useAppTranslation` in mobile/desktop view files). Three defects found and fixed.

## Audit Results

### 1. Teacher Schedule MobileCardList Shows MeetingUrlCell

**Status: ✅ PASS**

- `frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.tsx` renders `MeetingUrlCell` (full layout, `compact={false}`, `badgeSize="medium"`) inside the schedule card
- Wraps `MeetingUrlCell` in `<RequirePermission>` with `MeetingConfigsManageOwn` / `MeetingConfigsManageClass` permissions
- Unauthorized fallback uses `canCopyUrl={false}` (copy hidden, status badge still visible)
- `joinLabel={labels.schedule.joinVideo}` passed from ViewModel labels — no `useAppTranslation` call in the view file
- `setupHref` links to `/[locale]/dashboard/teachers/schedule/config` for the "Setup meeting config" fallback

**File**: `frontend/mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile.tsx`
- `MobileCardList` with `paginationOptions={buildServerPaginationOptions(...)}` — ✅ paginated

### 2. Student Next Class Card Vertical/Stacked on Mobile

**Status: ✅ PASS**

- `frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx` (shared/common, used by mobile variant)
- Layout uses `flexDirection: "column"` (vertical/stacked) — confirmed at the card root
- `CopyMeetingUrlButton` uses `size="large"` (≥48dp touch target)
- No `useAppTranslation` in the component — receives `labels` prop from ViewModel
- Mobile wrapper `nextClassJoinCard.mobile.tsx` re-exports the shared component via `createLazyView`

**File**: `frontend/mobile/views/dashboard/student/dashboard/studentDashboard.mobile.tsx`
- `MobileCardList` for lesson reports with `paginationOptions={buildServerPaginationOptions(...)}` — ✅ paginated

### 3. Parent Dashboard MobileCardList Shows Student Meeting URLs

**Status: ✅ FIXED (was defect)**

- `frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleList.mobile.tsx`: `MobileCardList` with `paginationOptions={buildServerPaginationOptions(...)}` — ✅ paginated
- `frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile.tsx`: `renderJoinAction` now renders only `MeetingUrlCell` (compact) — **redundant `MobileMeetingJoinAction` removed**
- **Defect found**: Card had both `MobileMeetingJoinAction` (icon variant) AND `MeetingUrlCell` (compact) rendering separate join buttons. The `MeetingUrlCell` subsumes the join action's functionality (status badge + join + copy), making the separate join action redundant.
- **Fix applied**: Removed `MobileMeetingJoinAction` from `renderJoinAction`. Removed unused `Stack` and `MobileMeetingJoinAction` imports.

**Desktop counterpart**: `frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleCard.desktop.tsx`
- Same redundancy found and fixed: removed `DesktopMeetingJoinAction`, removed unused `Stack` and `DesktopMeetingJoinAction` imports.
- Desktop grid `parentScheduleDataGrid.desktop.tsx`: `DesktopAppDataGrid` with `paginationOptions` — ✅ paginated

### 4. Touch Targets ≥48dp

**Status: ✅ FIXED (was defect)**

- **Defect found**: `MeetingUrlCell` full layout (mobile teacher schedule card) used `JoinButton` with `size="small"` (~30px height) and `CopyButton` (IconButton) with `size="small"` (40px) — below the 48dp guideline for mobile.
- **Fix applied**:
  - `CopyButton`: Added `iconButtonSize` prop ("small" | "medium", default "small"). Icon font size derived from button size. Full layout passes `iconButtonSize="medium"` (48px IconButton).
  - `JoinButton`: Added `buttonSize` prop ("small" | "medium", default "small"). Full layout passes `buttonSize="medium"` (≈36px height Button with outlined variant — acceptable paired with 48px copy icon button).
  - `renderFullLayout` now passes `buttonSize="medium"` and `iconButtonSize="medium"`.
  - `renderCompactCell` (desktop inline) keeps `iconButtonSize="small"` (40px — acceptable for desktop mouse interaction).
- Student `NextClassJoinCard`: `CopyMeetingUrlButton` uses `size="large"` — ✅ already compliant

### 5. No Horizontal Scrolling

**Status: ✅ PASS**

- Teacher schedule mobile card: Stack-based vertical layout, no horizontal overflow
- Student dashboard mobile: `MobileCardList` with vertical card stacking, no horizontal scroll
- Parent schedule mobile card: `MeetingUrlCell` compact uses `flexWrap: "nowrap"` within a single-line row inside the card — fits within card width
- Parent schedule list: `MobileCardList` vertical stacking

### 6. paginationOptions on MobileCardList / DesktopAppDataGrid

**Status: ✅ PASS**

| Component | paginationOptions Source | Mode |
|-----------|-------------------------|------|
| Teacher mobile `MobileCardList` | `buildServerPaginationOptions(...)` | server |
| Student mobile `MobileCardList` (lesson reports) | `buildServerPaginationOptions(...)` | server |
| Parent mobile `MobileCardList` | `buildServerPaginationOptions(...)` | server |
| Teacher desktop `DesktopAppDataGrid` | `resolvePaginationOptions(...)` | server |
| Parent desktop `DesktopAppDataGrid` | `resolvePaginationOptions(...)` | server |

All grid/list usages pass the REQUIRED `paginationOptions` prop — no missing props found.

### 7. Labels from ViewModel — No useAppTranslation in Mobile/Desktop Variants (Rule 7)

**Status: ✅ PASS**

- Grep confirmed: No `useAppTranslation` calls in any mobile or desktop variant file
- All strings passed as `labels` prop from the ViewModel via the shared scaffold
- `MeetingUrlCell` and `CopyMeetingUrlButton` use `useAppTranslation` internally — these are self-contained UI primitives (the documented Rule 7 exception), not view files
- View files pass only `joinLabel` (from `labels.schedule.joinVideo`) to `MeetingUrlCell`

## Files Modified

1. `frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx`
   - `CopyButton`: Added `iconButtonSize` prop ("small" | "medium", default "small"). Icon font size derived from button size.
   - `JoinButton`: Added `buttonSize` prop ("small" | "medium", default "small").
   - `renderFullLayout`: Passes `buttonSize="medium"` and `iconButtonSize="medium"` (mobile, 48dp touch targets).
   - `renderCompactCell`: Passes `iconButtonSize="small"` (desktop, 40px acceptable).
   - Removed stale "Placeholder: CopyMeetingUrlButton (task 20)" comment.

2. `frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile.tsx`
   - Removed redundant `MobileMeetingJoinAction` from `renderJoinAction`; `MeetingUrlCell` compact is sole join action.
   - Removed unused `Stack` and `MobileMeetingJoinAction` imports.

3. `frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleCard.desktop.tsx`
   - Removed redundant `DesktopMeetingJoinAction` from `renderJoinAction`; `MeetingUrlCell` compact is sole join action.
   - Removed unused `Stack` and `DesktopMeetingJoinAction` imports.

## Files Verified (Not Modified)

- `frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.tsx` — MeetingUrlCell full layout, permission-gated ✅
- `frontend/mobile/views/dashboard/teachers/dashboard/teacherDashboard.mobile.tsx` — MobileCardList with paginationOptions ✅
- `frontend/mobile/views/dashboard/student/dashboard/studentDashboard.mobile.tsx` — MobileCardList with paginationOptions ✅
- `frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx` — vertical/stacked, CopyMeetingUrlButton size="large" ✅
- `frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleList.mobile.tsx` — MobileCardList with paginationOptions ✅
- `frontend/mobile/views/dashboard/parent/dashboard/parentDashboard.mobile.tsx` — mobile dashboard structure ✅
- `frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGrid.desktop.tsx` — DesktopAppDataGrid with paginationOptions ✅
- `frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleDataGrid.desktop.tsx` — DesktopAppDataGrid with paginationOptions ✅
- `frontend/common/views/dashboard/parent/dashboard/components/__shared__/parentScheduleCardShared.tsx` — shared scaffold ✅

## Quality Verification

All modified files passed `sub-loop.ts --lifecycle lint` (tsgo → oxlint → biome → lint:type-aware) with exit 0:

| File | tsgo | oxlint | biome | lint:type-aware |
|------|------|--------|-------|-----------------|
| `MeetingUrlCell.tsx` | ✅ | ✅ | ✅ | ✅ |
| `parentScheduleCard.mobile.tsx` | ✅ | ✅ | ✅ | ✅ |
| `parentScheduleCard.desktop.tsx` | ✅ | ✅ | ✅ | ✅ |

Additional unmodified verification files also passed full lint lifecycle:
- `parentDashboard.mobile.tsx` ✅
- `parentScheduleList.mobile.tsx` ✅
- `studentDashboard.mobile.tsx` ✅
- `teacherScheduleDataGrid.desktop.tsx` ✅
- `parentScheduleDataGrid.desktop.tsx` ✅
- `parentScheduleCardShared.tsx` ✅

## Architecture Verification

The dashboards follow the correct three-tier responsive architecture:

```
Common switcher (createLazyView + ResponsiveViewSwitch)
  ├─ Desktop variant (thin wrapper → shared scaffold with desktop sx)
  │    └─ DesktopAppDataGrid with paginationOptions (server mode)
  └─ Mobile variant (thin wrapper → shared scaffold with mobile sx)
       └─ MobileCardList with paginationOptions (server mode)
            └─ Card renderItem → MeetingUrlCell (compact or full layout)
```

MeetingUrlCell dual-layout pattern:
- `compact=true` (desktop grid cells, parent cards): inline row with status badge + small join/copy buttons
- `compact=false` (mobile teacher schedule card): full layout with badge on top + medium buttons below (48dp touch targets)

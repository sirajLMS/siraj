# Visual Fix 1 — Student Credits LIST page outcome

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Scope**: `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` only. Test file unchanged (existing assertions still match the DOM contract).

## Per-finding resolution

### 1. [HIGH] Grid area clipped / dead space — FIXED

Root cause: the grid was wrapped in `<Box sx={{ height: 520 }}>` (`DESKTOP_GRID_HEIGHT`),
so the DataGrid got a hard viewport-independent height — short data left dead space,
tall data clipped rows at the container edge.

Fix: dropped the fixed-height wrapper (and the `DESKTOP_GRID_HEIGHT` constant) and
switched `AppDataGrid` to `autoHeight` — the pattern used by the overwhelming majority
of sibling grids (`studentDirectoryDataGrid.desktop.tsx`, `ScheduleOverviewDataGrid.tsx`,
`studentCreditsDataGrid.desktop.tsx`, etc.). The grid now sizes to its rendered rows +
pagination footer; overflow is handled by the page scroll, so last rows and the pager
can never be clipped.

### 2. [HIGH] Mobile column priority — FIXED

Columns were converted from fixed `width` to **flex + minWidth** budgets sized so all
three priority columns fit a 390px viewport (~356px of grid width inside the
`SectionPanel` gutter):

- `name`: flex 1.6, minWidth 132 (was flex 1.4 / minWidth 220)
- `teacherName`: flex 1.2, minWidth 148, **hidden via responsive CSS below `md`**
  (`& .MuiDataGrid-[columnHeader|cell][data-field='teacherName'] { display: { xs: "none", md: "flex" } }` —
  the sibling pattern from `ScheduleOverviewDataGrid.tsx`; no `useMediaQuery`, keeping
  this common view viewport-hook-free)
- `classesRemaining`: flex 0.6, minWidth 88, maxWidth 128 (was fixed 150)
- `actions`: flex 1, minWidth 112, maxWidth 168 (was fixed 160); the row button switches
  to an icon-only chevron below `md` (see findings 3/4), so it needs little space

On mobile: student + balance chip + action are all visible with no vertical space
stolen by the em-dash-only teacher column.

### 3. [MEDIUM] Row affordance on mobile — FIXED

`AdjustAction` now renders a trailing `ChevronRightOutlined` (RTL-mirrored via the
shared `rtlFlipIconSx` util, composed with breakpoint styles via `mergeSx`) that is
visible below `md`, paired with the text label which is hidden below `md`. The button
stays outlined and full-opacity, so the row affordance is consistent on all sizes.

### 4. [MEDIUM] Muted row action buttons — FIXED

`adjustActionSx` (typed `SxProps<Theme>`) restores a confident treatment:
full-strength `borderColor: theme.palette.primary.main` (outlined variant's default
50%-alpha border was what read as disabled), full-opacity label, `&:hover` border in
`primary.dark`. No hardcoded colors; minimum chroma change consistent with the
contained header action.

### 5. [LOW] Column-header accent ticks — FIXED LOCALLY + X-FILE REPORT

Root cause (verified in `node_modules/@mui/x-data-grid@9.x`): each column header
renders a `.MuiDataGrid-iconSeparator` (the column-resize handle icon) colored by the
DataGrid CSS var `--DataGrid-t-color-border-base`, which MUI derives from
`palette.TableCell.border` ← `palette.divider`. The scale-bordered theme presets with
tinted dividers (emerald/ocean) make those separators read as thin **green** bars; on
touch devices MUI X forces resizable separators always-visible
(`@media (hover: none) { opacity: 1 }`), which is why they were constant on the tablet
screenshot. This is shared `AppDataGrid` behavior — **every** grid in the app shows
them. Local fix applied: `& .MuiDataGrid-iconSeparator { display: "none" }` in the
grid-level `gridSx`. See CROSS-FILE DEPENDENCY below.

### 6. [LOW] Teacher empty cells — FIXED

No suitable "Unassigned" key exists in `dashboard.billing.creditAdjustment` (checked —
keys are title/actions/carryover/validation/success only, and `dashboard.students.*`
has none either), so no string was added. The dash is now rendered by `TeacherCell`
(centered, `theme.palette.onSurfaceVariant` muted tone) instead of the raw
`valueFormatter` output, so it reads as intentional absence.

### 7. [LOW] Mobile toolbar/grid rhythm — FIXED

The content area now uses a single `<Stack spacing={2}>` (alert / capped-hint / grid)
instead of ad-hoc `mb` values on individual items, giving one consistent spacing token
between the header actions row and the grid at all breakpoints.

### Bottom-fixed mobile nav overlap — verified NON-issue

`frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx` already adds
`pb: calc(theme.layout.bottomNavHeight + env(safe-area-inset-bottom) + spacing(2))`
to the page `<main>` whenever the bottom nav renders. The credits page gets bottom
clearance from the shared layout; no page-level change needed.

## CROSS-FILE DEPENDENCY

The header accent ticks (finding 5) originate in shared code and affect every
AppDataGrid:

- Target file: `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx`
- Blocked by: `frontend/common/components/ui/dataGrid/appDataGridSharedUtils.tsx`
  (`defaultGridSx`) and/or `frontend/common/providers/theme/components.ts`
  (`getMuiDataGrid` overrides)
- Rule/behavior: MUI X v9 renders `.MuiDataGrid-iconSeparator` per header boundary,
  tinted via `palette.divider` (green in the emerald preset) and forced visible on
  touch devices.
- Recommended fix: move `"& .MuiDataGrid-iconSeparator": { display: "none" }` into
  `defaultGridSx` so all grids drop the artifact consistently — currently suppressed
  only in this grid, so other views still show the ticks until shared code is updated.

Additional observation (not blocking): CSS-hiding a column via `display: none` keeps
its reserved width inside the grid's flex distribution (MUI X does not re-measure on
CSS breakpoints). It was mitigated here by low `minWidth`s, so nothing scrolls or
clips at 390px; true removal would need a conditional `columns`/`columnVisibilityModel`
requiring viewport detection, which this common (unsplit) view layer forbids.

## Files changed

- `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` ✏️ (only file)
- `test/ui/components/accounting/StudentCreditsList.test.tsx` — NOT changed (all
  assertions hold against the new DOM)

## Verification

- `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx --lifecycle codescene`
  → exit 0 (tsgo, oxlint, biome, lint:type-aware, duplicates, codescene). One
  intermediate tsgo failure (`sx={[rtlFlipIconSx, {...}]}` array-of-`SxProps` typing)
  resolved by composing with the shared `mergeSx` util.
- `bun run test/scripts/run-test.ts test/ui/components/accounting/StudentCreditsList.test.tsx`
  → **6 pass / 0 fail / 18 expects** (rows render, capped hint, empty state, error
  alert, row adjust navigation, debounced search refetch).

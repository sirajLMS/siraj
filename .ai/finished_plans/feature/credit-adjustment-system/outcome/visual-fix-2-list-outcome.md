# Visual Fix 2 — Student Credits LIST page outcome

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Scope**: `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` only. Test file unchanged.
- **Verification method**: live page against the dev server via `agent-browser` DOM measurements (session `verify-4e6bfa581bd6`) at 390×844 (phone), 834×1194 (tablet), and 1440×900 (desktop) — no screenshots.

## Per-finding resolution

### 1. [MEDIUM] Header→table gap (~60px) — VERIFIED ALREADY FIXED (no change)

Live DOM measurement at all three viewports shows exactly **24px** between the
toolbar row (title + search + ADJUST CREDITS) and the grid
(`gap = gridTop - toolbarRowBottom = 24`). That is the single
`<Stack spacing={3}>` (8px × 3) rhythm inside the `SectionPanel` body
(`px {xs:2,md:3}, py: 2.5`). The 60px dead band predates the pass-1 refactor that
moved the toolbar into the panel body; nothing left to collapse.

### 2. [MEDIUM] ACTIONS header/cell misalignment — VERIFIED ALREADY FIXED (no change)

Both `align: "center"` and `headerAlign: "center"` are already set on the actions
column, matching sibling grids. Measured at 1440px: header-title center = 1302,
button center = 1302 — one shared axis. At tablet/mobile the button is centered
inside its cell the same way.

### 3. [MEDIUM] Action affordance below md — FIXED

The pass-1 breakpoint was wrong for tablets: the label was hidden below `md`
(900px), so at 834px the row showed only the bare chevron. Verified live:
`label display: none`, `icon display: flex` at 834px.

Fix: all three breakpoints moved from `md` to `sm` (600px), matching the
project's phone/tablet tier split (`ViewportProvider`: mobile = below `sm`):
- label `<Box component="span">`: `display: { xs: "none", sm: "inline" }`
- chevron `sx`: `display: { xs: "inline-flex", sm: "none" }` (still composed via
  `mergeSx(rtlFlipIconSx, …)`)
- `adjustActionSx`: `minWidth: { xs: 40, sm: 64 }`, `px: { xs: 0.5, sm: 1.5 }`

Verified live at 834px: button renders the full labeled outline
(`span display: inline`, icon hidden, 94px wide, text "Adjust Credits").
At 390px it stays the 40px icon-only chevron.

### 4. [MEDIUM] Mobile column widths — FIXED

Measured at 390px before: balance header title container `sw=124 vs cw=100`
(visible "Classes Left"/"CLASSES LEFT" ellipsis), actions column 80px wide for a
40px chevron.

Column budget changed (`columns` array):
- `classesRemaining`: `minWidth: 148`, `maxWidth: 160` (was 120/140) — the
  header title container now measures `sw=91, cw=91`, no truncation.
- `actions`: `flex: 0.6`, `minWidth: 64`, `maxWidth: 168` (was 0.8/80) — the
  flex distributes surplus on desktop; on phones MUI X clamps to the 64px
  minimum, which is exactly the icon button's footprint plus padding.

Two layout artifacts exposed by the narrower columns were suppressed in
`gridSx` (both scoped inside the existing `theme.breakpoints.down("md")` block,
and only used because MUI X's JS width model still counts the CSS-hidden
teacher column and therefore reports phantom horizontal overflow):
- `& .MuiDataGrid-filler, & .MuiDataGrid-scrollbar--horizontal { display: "none" }`
  — the always-visible-but-empty horizontal scrollbar shim.
- `& .MuiDataGrid-cellEmpty { display: "none" }` — MUI X renders this
  `flex: 1` filler div at the end of every row; it was pushing each row's
  content 10px past the row width (`rowWidth sw=364 vs cw=354`).

New breakpoint block added to `gridSx` (`theme.breakpoints.down("sm")`):
the actions column header title is hidden on phones, since its column is an
icon affordance there and the 57px "Actions" text cannot fit the 64px column
(it previously clipped to `cw=44`).

Verified at 390px after the fix: `docHScroll = 0`, no in-grid horizontal
overflow (only the sort-icon reservation inside the balance header container,
which spills into its own 10px padding and truncates nothing), no horizontal
scrollbar element, no clipped header titles.

On desktop (≥ `md`) the only "overflow" left is the empty `cellEmpty` filler
(Σ columns = viewport width; the overflowed 20px is the invisible filler) —
inherent MUI X behavior shared by every autoHeight `AppDataGrid`, left alone
since nothing visible is clipped.

### 5. [MEDIUM] Mobile bottom-nav clipping — VERIFIED NON-ISSUE (no change)

At 390×844 with 10 rows: the `<main>` scroll container has
`padding-bottom: 80px`
(`calc(theme.layout.bottomNavHeight + env(safe-area-inset-bottom) + spacing(2))`
from `frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx`),
`scrollHeight 1060 > clientHeight 780` (scrollable). Scrolled to the bottom:
last row bottom = 662, grid footer (pagination) bottom = 726, fixed bottom nav
starts at 780 — **54px of clearance for the pagination and 118px for the last
row**. Nothing lands inside a nested scroll container on this page; the page
inherits the shell padding like every other grid page. No change needed.

### 6. [LOW] Identical-tone avatar initials — INFO ONLY (cross-file)

Originates from the shared `BaseAvatar` in
`frontend/common/components/ui/avatar/`; not touched per instructions. Reported
as cross-file only.

## CROSS-FILE DEPENDENCY (unchanged from pass 1, still open)

`.MuiDataGrid-iconSeparator` suppression and the phantom-width rebasing are
still local to this grid. The header accent ticks affect every `AppDataGrid`:
- Blocked by: `frontend/common/components/ui/dataGrid/appDataGridSharedUtils.tsx`
  (`defaultGridSx`) — recommended shared fix is moving the
  `iconSeparator { display: none }` rule there.

## Files changed

- `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` ✏️ (only file)
- `test/ui/components/accounting/StudentCreditsList.test.tsx` — NOT changed
  (assertions are DOM-behavioral and unaffected by breakpoint/width changes)

## Verification results

- Live DOM via `agent-browser` (dev :3000, admin session):
  - 390×844: no doc/grid horizontal scroll, "Classes Left" title not truncated,
    actions = 40px icon-only chevron, teacher column CSS-hidden, footer bottom
    726 < bottom-nav top 780.
  - 834×1194: actions = labeled "Adjust Credits" outlined button, chevron
    hidden, teacher column hidden, balance header fits.
  - 1440×900: ACTIONS header center == button center (1302 == 1302), labeled
    button, all columns visible, header→grid gap = 24px.
- `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx --lifecycle codescene`
  → exit 0 (tsgo, oxlint, biome, lint:type-aware, duplicates, codescene).
- `bun run test/scripts/run-test.ts test/ui/components/accounting/StudentCreditsList.test.tsx`
  → **6 pass / 0 fail / 18 expects**.

## Constraints honored

Theme tokens only (no hardcoded colors), no physical direction properties
(RTL-safe; chevron still mirrored via `rtlFlipIconSx`), comments describe the
*what/why* with no plan references.

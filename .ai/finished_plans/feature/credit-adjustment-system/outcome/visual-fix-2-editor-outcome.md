# Visual Fix #2 Outcome — RichTextEditor corner/radius/contrast pass

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Scope**: `frontend/common/components/ui/input/richText/RichTextEditor.tsx` only
  (test file unmodified — all 11 tests unchanged and green).

## Root cause behind findings 1 + 2 (one shared bug)

MUI v9's sx system multiplies numeric `borderRadius` by
`theme.shape.borderRadius` (`@mui/system/borders` uses
`createUnaryUnit(theme, "shape.borderRadius", …)`; verified in
`node_modules/@mui/system/borders/borders.js` and documented in
`frontend/common/providers/theme/theme.ts`). The surface passed
`borderRadius: theme.shape.borderRadius` (= 8) → computed **64px**, which
both made the editor read ~8x rounder than the Hours/Student
OutlinedInputs and drove the toolbar band's square corners through the
huge arc on desktop and tablet.

Fixes in `buildEditorSurfaceSx` / `toolbarRowSx`:

- Surface root radius is now `borderRadius: 1` → 8px, byte-identical to
  MUI OutlinedInput's own styleOverride (`shape.borderRadius`, no sx
  multiplier there). The fieldset's `borderRadius: "inherit"` picks it up
  unchanged; geometry (`inset: "-5px 0 0 0"`, legend notch) untouched, so
  the notch stays aligned with the shrunken label.
- Toolbar band carries its own top corner radii
  (`borderStartStartRadius` / `borderStartEndRadius:
  "${theme.shape.borderRadius}px"`, logical props so LTR/RTL render
  identically) so the band background is clipped by a matching 8px arc and
  can never stripe outside the outline border it sits under. The band's
  arc sits ~0.6px inside the border arc — the residual transparent sliver
  is sub-pixel and shows the page background, matching how MUI outlined
  inputs leave the arc interior transparent.

## Finding 3 — Toolbar band contrast & notch crowding

- Band background switched `surfaceVariant` → `surfaceContainerLow`:
  reads as a clearly darker recessed header against the paper content
  area in the active dark theme (computed `rgb(5, 14, 26)` on the adjust
  page) and as a subtle `#F8FAFC` band in the light palette; the
  `borderBlockEnd: divider` hairline stays, so the header row is
  unmistakable without a strong fill.
- Notch crowding was inherited from the 64px arc cutting through the
  label/band area; with the 8px radius the arc no longer intersects the
  band. Verified in the live DOM: the shrunken label has `z-index: 1`
  and paints above the band, and `elementFromPoint` probes down the
  label's lower edge return the label (then the first IconButton) — the
  band never covers the notch text.

## Browser verification (live dev server, not reasoning only)

- Reused agent-browser session `verify-4e6bfa581bd6` on
  `localhost:3000/accounting/credits/adjust?studentId=…` (re-injected
  auth via `bun run scripts/browser-login.ts --inject` after an HMR
  logout bounce).
- Computed styles confirm: surface `border-radius: 8px`, fieldset
  `border-radius: 8px` + `top: -5px`, band `border-start-start/end-radius:
  8px`, `background-color: rgb(5 14 26)`, divider border-bottom.
- Screenshots (saved under `scratch/screenshots/rte-fix2*.png`):
  desktop 1280×900 crop shows the "Reason *" notch clean in the top
  border, the band arcs matching the container corners, no bumps at the
  left/right seams; mobile 390px capture shows the same. Corner zoom
  crop confirms no background bleed outside the arc.
- Height regression check: surface computes to 113px (41px band + 72px
  content area) — the ~3-row compact default is unchanged.

## Files

| File | Change |
|---|---|
| `frontend/common/components/ui/input/richText/RichTextEditor.tsx` | sx numeric-radius multiplier fix (64px → 8px), band top corner radii (logical props), band bg `surfaceVariant` → `surfaceContainerLow` |
| `test/ui/components/ui/RichTextEditor.test.tsx` | unchanged — 11 tests kept |

## Verification

- `bun run test/scripts/run-test.ts test/ui/components/ui/RichTextEditor.test.tsx`
  → **11 pass / 0 fail / 42 expect()**.
- `bun run scripts/health/sub-loop.ts frontend/common/components/ui/input/richText/RichTextEditor.tsx --lifecycle codescene`
  → **exit 0** (tsgo → oxlint → biome → lint:type-aware → duplicates →
  codescene all green).
- Live browser verification on desktop + mobile viewports as detailed
  above (computed styles + screenshots).
- Public API untouched (`value, onChange, label, error, helperText,
  required, disabled, id, minRows`); aria wiring unchanged. No hardcoded
  colors (theme tokens only), RTL logical props used, no plan tags in
  comments, no files outside scope.

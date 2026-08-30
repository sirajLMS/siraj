# Visual Fix Pass 2 — CreditAdjustForm, AdjustmentTypeRadioGroup

- **Status**: ✅ Done
- **Date**: 2026-08-30

Pass 1 outcome (`visual-fix-1-form-outcome.md`) was read first, then every
finding was reproduced against the live dev server (`localhost:3000`,
authenticated super-admin, `?studentId=0162cb8d-...7`) with agent-browser
computed-style evaluation — no guesswork on rendered output.

## Per-finding resolution

1. **[HIGH] Selected card rendered as a solid saturated fill / unselected
   Add card appeared green — confirmed and fixed.**
   DOM-evaluated before the edit: the selected card computed to
   `rgb(20, 83, 45)` (`#14532D`, the dark `successContainer`) with an
   `rgb(74, 222, 128)` border; when carryover was selected, the carryover
   card computed to `rgb(120, 53, 15)` (`#78350F`, `warningContainer`). The
   dark `*Container` tokens are strong fills, so the "solid green Add" capture
   was the *selected* Add state — unselected cards were already flat
   (`surface #0A1929` + `outlineVariant` border, verified).
   Fix in `AdjustmentTypeRadioGroup.tsx` (`buildCardSx`): selected cards now
   use a translucent family tint `alpha(family.main, 0.10)` + single
   `family.main` border; unselected stay flat `surface`. Re-verified with
   carryover selected: carryover card = `rgba(251, 191, 36, 0.1)` bg +
   `rgb(251, 191, 36)` border; Add/Subtract = `rgb(10, 25, 41)` +
   `divider` border.
   Keyboard focus ring: `:has(.Mui-focusVisible)` from round 1 was
   re-verified in the DOM (focus radio → ring on card; mouse click leaves
   no residual outline).

2. **[MEDIUM] Carryover icon "bare glyph" — structural divergence NOT
   reproduced.** All three cards render an identical badge:
   40×40, `border-radius: 50%`, family-tinted bg, family-main 24px icon
   (verified per-card in the live DOM). The inspector's reading was almost
   certainly the badge blending into the card because both used the same
   container tone when selected. `buildIconBadgeSx` now uses
   `alpha(family.main, 0.16)` for the badge bg so the disc is visually
   distinct from both the flat unselected card and the 0.10-selected card.
   The `container` field was dropped from `AccentTones` (no longer used).

3. **[MEDIUM] "ADJUSTMENT TYPE" label teal in one capture — token-driven,
   not a state bug.** Live evaluation shows the label's computed color is
   `onSurfaceVariant` in every state — including while `.Mui-focused` is on
   the FormLabel (keyboard-focused the radio and computed the label color,
   both states identical). In the **ocean** dark preset
   `onSurfaceVariant` IS cyan (`#80DEEA`); in the default/slate dark palette
   it is neutral (`#CBD5E1`). Round 1's base+`&.Mui-focused` pin covers the
   only interaction state MUI recolors (`&:hover`/filled never touch label
   color). No code change; the per-capture difference is the active theme
   preset, not a regression.

4. **[LOW] Unselected borders too faint — fixed.** Unselected
   `borderColor` is now `theme.palette.divider` (the full-strength divider
   tone) instead of the subtler `outlineVariant`. Verified in DOM:
   `rgba(38, 198, 218, 0.14)` (ocean divider).

5. **[LOW] Mobile cards too tall — fixed.** `buildCardSx` mobile: card
   `alignItems: center`, `py: 1.5` (`sm` keeps `flex-start`/`py: 2`); the
   content stack is a row on phones (`flexDirection: { xs: "row",
   sm: "column" }`, badge left / label right, gap 1.5). Verified at 390×844:
   each card computes to **66px** high, inner layout `row`, badge 40×40 —
   down from ~95px with dead space. Desktop layout unchanged (verified at
   1440×900: inner stack still `column`).

6. **[MEDIUM] Mobile bottom clearance — fixed in the form container.**
   The page-level layout (`dashboardLayout.mobile.tsx`, out of scope) already
   pads scroll content by the nav height, but this form page now adds its own
   outer `pb: { xs: 6, md: 3 }` (matching the sibling payment form's `pb: 6`
   convention on mobile; desktop keeps the prior 3-unit padding). Verified at
   390×844 with carryover expanded and scrolled to the bottom: the lowest
   field (submit button at 679px bottom, lowest input 478px) sits **~100px
   above** the bottom nav top (779px); nothing clips behind the nav in either
   submit-state. (The one stray button below the nav edge is the off-canvas
   sidebar Drawer's Logout button — invisible, not content clipping.)

## Files touched

| File | Change |
|---|---|
| `frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.tsx` | selected = `alpha(main, .10)` tint; unselected border = `divider`; badge = `alpha(main, .16)`; mobile row layout + compact padding; `container` tone removed |
| `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx` | outer container `py: 3` → `pt: 3` + `pb: { xs: 6, md: 3 }` for mobile bottom-nav clearance |

`CarryoverBanner.tsx` and `creditAdjust.constants.ts` needed no change.
`test/ui/components/accounting/CreditAdjustForm.test.tsx` unchanged — no
asserted DOM/roles/text changed. No new locale keys; no `locale:snapshots`
run required.

## Verification

- Live DOM evaluation (agent-browser, authenticated, dark ocean preset):
  all findings 1–6 computed styles re-checked before and after the edit —
  results quoted above.
- `bun run scripts/health/sub-loop.ts …AdjustmentTypeRadioGroup.tsx
  --lifecycle codescene` → **exit 0** (first attempt)
- `bun run scripts/health/sub-loop.ts …CreditAdjustForm.tsx
  --lifecycle codescene` → **exit 0** (first attempt)
- `bun run test/scripts/run-test.ts
  test/ui/components/accounting/CreditAdjustForm.test.tsx` → **12 pass /
  0 fail / 52 expects** (pre-existing `act()` warnings unchanged)
- Reference screenshots saved for the orchestrator:
  `scratch/screenshots/form-fix-2/carryover-desktop.png`,
  `scratch/screenshots/form-fix-2/carryover-mobile-390.png`.

## Notes / non-blockers

- Finding 3 left intentionally unchanged (verified token-correct); if the
  product decision is that `onSurfaceVariant` should never read accent-saturated
  under any preset, that is a theme-palette change in
  `frontend/common/providers/theme/presets/ocean/` — outside this scope.

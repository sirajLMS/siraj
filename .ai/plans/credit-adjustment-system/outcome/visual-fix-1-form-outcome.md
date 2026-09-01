# Visual Fix Pass 1 — CreditAdjustForm, AdjustmentTypeRadioGroup, CarryoverBanner

- **Status**: ✅ Done
- **Date**: 2026-08-30

## Per-finding resolution

1. **[HIGH] Radio card selection language** — All three cards now share one
   selection language: `<family>Container` background + single `<family>.main`
   border + `on<Family>Container` label; unselected cards stay
   `surface` + `outlineVariant`. The apparent "double ring" on the last-clicked
   card came from the `&:focus-within` accent outline sticking after a mouse
   click (clicking the card focuses its visually-hidden `Radio`). The outline
   now renders only for keyboard focus via `&:has(.Mui-focusVisible)`; the card
   border itself stays a single 1px rule in both states. Palette tokens
   (`successContainer`/`onSuccessContainer`, `errorContainer`, `warningContainer`,
   …) verified as registered in `frontend/common/providers/theme/palette/paletteDefaults.ts`.

2. **[MEDIUM] Icon parity** — every option icon now sits in an identical
   circular badge (`buildIconBadgeSx`: 40×40, `borderRadius: "50%"`, centered via
   grid, `backgroundColor: tones.container`, `color: tones.main`). Same geometry
   and full-opacity family color in both selected and unselected states.

3. **[MEDIUM] "Adjustment Type" label color** — the green tint was MUI's
   default `FormLabel &.Mui-focused { color: primary.main }`, triggered whenever
   the radiogroup held focus. The label now pins
   `&.Mui-focused: { color: onSurfaceVariant }`, so the section heading stays
   neutral (`labelUppercase` + `onSurfaceVariant`) in every state.

4. **[MEDIUM] Banner tablet grid** — breakpoints lowered from `md` to `sm`, so
   ≥600px (incl. 834px tablets) renders 2 columns: teacher spans the full first
   row (`gridColumn: { xs: "1 / -1", xl: "auto" }`), from/to dates share a row,
   payment date takes the next row; `xl` keeps the 4-column row. No more
   single-stacked column with dead space at tablet width.

5. **[MEDIUM] Banner tone** — the stock `severity="success"` alert surface
   (which goes muddy-dark in dark mode) is overridden with the explicit pair
   `successContainer` background + `onSuccessContainer` text; the alert icon
   uses `success.main`. Same token family as the Add card's container tone.

6. **[MEDIUM] Hours input** — `fullWidth` removed; `sx={{ width: "100%",
   maxWidth: 240 }}` caps it compactly. Label behavior unchanged: the standard
   outlined floating notch label, matching the Student autocomplete convention.

7. **[LOW] Reason editor size** — `RichTextEditor` exposes no min-height prop
   and was left untouched (owned by another agent). The form wraps it in a `Box`
   whose `"& .ProseMirror.ProseMirror"` selector (doubled class for specificity
   over the editor's internal rule) sets `minHeight: theme.spacing(9)` ≈ 3 rows.
   The actions row already sits at the standard section gap (`Stack gap: 3`) —
   the perceived extra whitespace came from the taller editor body, now reduced.

8. **[LOW] Cancel button** — `FilterButton` kept as the primitive but its
   primary-teal styling is overridden via `sx` to a neutral outlined treatment
   (`outline` border, `text.secondary` label, `action.hover` hover), visually
   distinct from the contained teal `PrimaryPageAction`.

9. **[HIGH-ish] Preselected-student composition** — the summary row is now a
   bordered "selected student" card (surface background, `outlineVariant`
   border, radius, padding): `BaseAvatar` (40px) + name + teacher name as the
   secondary line (the `studentById` document carries `teacherName` but no
   `email`, so email could not be included without touching the shared document)
   + the balance `Chip` (`remaining / total`, chip text unchanged). The student
   autocomplete stays rendered above as the "change student" affordance — no
   shared component touched, no new locale keys needed.

## Files touched

| File | Change |
|---|---|
| `frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.tsx` | focus ring only on keyboard focus; circular icon badges; neutral focused FormLabel |
| `frontend/common/views/dashboard/accounting/credits/CarryoverBanner.tsx` | grid 1→2 (`sm`)→4 (`xl`) cols; teacher full-row below `xl`; success-container alert tones |
| `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx` | selected-student card; hours max-width 240; editor min-height wrapper; neutral Cancel |

`creditAdjust.constants.ts` needed no change. No test-file changes were needed:
no asserted DOM/roles/classes/text changed (radio names, chip text, field
labels, banner title all identical). No new locale keys; no `locale:snapshots`
run required.

## Verification

- `bun run scripts/health/sub-loop.ts …AdjustmentTypeRadioGroup.tsx --lifecycle codescene` → **exit 0** (first attempt)
- `bun run scripts/health/sub-loop.ts …CarryoverBanner.tsx --lifecycle codescene` → **exit 0** (first attempt)
- `bun run scripts/health/sub-loop.ts …CreditAdjustForm.tsx --lifecycle codescene` → **exit 0** (2 attempts: first flagged `TS2304 theme` — a child `Typography` mistakenly read the outer sx callback's `theme` param, which only scopes inside the callback; fixed with its own sx callback)
- `bun run test/scripts/run-test.ts test/ui/components/accounting/CreditAdjustForm.test.tsx` → **12 pass / 0 fail / 52 expects** (pre-existing `act()` warnings from shared autocompletes remain; not introduced here)

## Notes / non-blockers

- Secondary line on the selected-student card uses `teacherName`; if email is
  wanted, `studentByIdQueryDocument` must gain the `email` field (shared doc +
  codegen) — cross-file, out of this scope.
- No screenshots captured (orchestrator re-captures visuals).

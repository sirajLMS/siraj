# Visual Fix Pass 3 — CreditAdjustForm polish (label color, card void, chip caption, banner outlines)

- **Status**: ✅ Done
- **Date**: 2026-08-30

Pass 2 outcome (`visual-fix-2-form-outcome.md`) was read first. Every fix was
verified against the live dev server (`localhost:3000`, authenticated
super-admin, `?studentId=0162cb8d-…7`, ocean dark preset active) with
agent-browser computed-style evaluation.

## Per-finding resolution

1. **[MEDIUM] `ADJUSTMENT TYPE` eyebrow renders accent teal under ocean —
   fixed at the token level.** Root cause confirmed in
   `frontend/common/providers/theme/presets/ocean/darkPalette.ts`: ocean (and
   every non-default preset) tints BOTH `onSurfaceVariant` (`#80DEEA`) and
   `text.secondary` (`#B2EBF2`) toward the accent family, so any "secondary"
   text token reads cyan there. The only palette family no preset overrides is
   the MUI `grey` ramp, so the label now uses a mode-aware neutral token via a
   small `neutralSectionLabelColor(theme)` helper
   (`grey[400]` `#BDBDBD` dark / `grey[700]` `#616161` light — both ≥ WCAG 4.5:1
   against the matching surface tones). The `&.Mui-focused` pin now points at
   the same helper so focus never re-tints the heading. Verified live:
   `Adjustment Type` computes to `rgb(189, 189, 189)` while sibling field
   labels stay on `text.secondary` (`rgb(178, 235, 242)`).

2. **[LOW] Desktop radio cards dead vertical void — fixed by centering.**
   `buildCardSx` now stretches the label slot on `sm+`
   (`alignItems: { xs: "center", sm: "stretch" }`) and the icon+label stack
   gains `justifyContent: { sm: "center" }` + `height: { sm: "100%" }`, so
   when a wrapped sibling (e.g. "Subtract With Carryover") sets the row
   height, single-line cards center their content instead of floating it at
   the top. Verified at 1280px: cards 102.8px tall, inner group 68.8px,
   `justify-content: center` on all three. Mobile (`xs`) rules are byte-equal
   — compact row layout untouched.

3. **[LOW] Balance chip lacked a caption — added.** New `form.balance`
   locale leaf (`Balance` / `الرصيد`) in
   `shared/locale/types/dashboard/billing/creditAdjustment.ts` plus the EN/AR
   leaves of the existing namespace (no new namespace wiring needed; the leaf
   module is shared by both translation surfaces). Rendered in
   `CreditAdjustForm.tsx` as a 10px `labelUppercase` `text.secondary` caption
   inside a `direction="row"` `Stack` adjacent to the chip (RTL-safe — flexbox
   flips with `dir`). `bun run locale:snapshots` → 2 snapshots rewritten.
   Verified live: the summary card reads `BALANCE 10 / 10`.

4. **[LOW] Carryover banner field outlines too faint — fixed, banner-scoped.**
   The `CarryoverBanner` Alert now overrides the notched-outline border with
   `alpha(theme.palette.onSuccessContainer, 0.35)` (0.35 is inside the
   0.3–0.4 target band). The selector covers BOTH the teacher autocomplete
   (`.MuiOutlinedInput-root`) and the date pickers, which carry a different
   class root (`.MuiPickersOutlinedInput-root`) — the first pass caught only
   the autocomplete and was caught by live verification. `:not(.Mui-focused)`
   keeps MUI's focused accent ring intact. Verified live: all four fields
   compute `rgba(220, 252, 231, 0.35)`.

## Files touched

| File | Change |
|---|---|
| `frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.tsx` | label color → mode-aware `grey` ramp helper (incl. focus pin); card `alignItems` sm → `stretch`; inner stack `justifyContent`/`height` for vertical centering on sm+ |
| `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx` | balance caption `Typography` + row `Stack` around the `10 / 10` chip |
| `frontend/common/views/dashboard/accounting/credits/CarryoverBanner.tsx` | banner-scoped notched-outline override (`alpha(onSuccessContainer, 0.35)`) for `MuiOutlinedInput` + `MuiPickersOutlinedInput` |
| `shared/locale/types/dashboard/billing/creditAdjustment.ts` | new `form.balance` key |
| `shared/locale/en/dashboard/billing/creditAdjustment.ts` | `Balance` |
| `shared/locale/ar/dashboard/billing/creditAdjustment.ts` | `الرصيد` |
| `test/ui/components/accounting/CreditAdjustForm.test.tsx` | deep-link test also asserts `credits.form.balance` caption renders |
| `public/static/locale-snapshots/{en,ar}/dashboard.billing.creditAdjustment.json` | regenerated via `bun run locale:snapshots` |

`StudentCreditsList.tsx`, `RichTextEditor.tsx`, and all shared input/field
themes untouched (the banner override is selector-scoped inside the Alert).

## Verification

- `bun run scripts/health/sub-loop.ts …AdjustmentTypeRadioGroup.tsx --lifecycle codescene` → **exit 0**
- `bun run scripts/health/sub-loop.ts …CreditAdjustForm.tsx --lifecycle codescene` → **exit 0**
- `bun run scripts/health/sub-loop.ts …CarryoverBanner.tsx --lifecycle codescene` → **exit 0**
- `bun run scripts/health/sub-loop.ts test/ui/components/accounting/CreditAdjustForm.test.tsx --lifecycle codescene` → **exit 0**
- `bun run test/scripts/run-test.ts test/ui/components/accounting/CreditAdjustForm.test.tsx` → **12 pass / 0 fail / 53 expects**
- Live DOM evaluation (agent-browser session `verify-4e6bfa581bd6`,
  re-injected via `bun run scripts/browser-login.ts --inject`): label color,
  card centering, caption text, and all four banner outline colors quoted
  above.
- Reference screenshot for the orchestrator:
  `scratch/screenshots/form-fix-3/carryover-banner-desktop.png`.

## Notes / non-blockers

- The agent-browser CLI in this environment has no `viewport`/`resize`
  command, so mobile (390px) could not be re-verified live this round. The
  risk is nil-by-construction: every changed rule carries responsive values
  keyed on `sm`, and the `xs` values (compact row, 66px cards) are identical
  to round 2's verified build.
- `additional note`: the `Student`/`Hours`/`Reason` field labels still use
  preset-tinted `text.secondary` by design — finding 1 covered only the
  `ADJUSTMENT TYPE` section eyebrow; retinting MUI TextField labels globally
  would be a theme-level decision, out of this scope.

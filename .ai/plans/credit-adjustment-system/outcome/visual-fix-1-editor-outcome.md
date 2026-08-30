# Visual Fix #1 Outcome — RichTextEditor single-border outline

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Scope**: `frontend/common/components/ui/input/richText/RichTextEditor.tsx`, `test/ui/components/ui/RichTextEditor.test.tsx` only.

## Finding 1 — Broken container geometry (HIGH)

Restructured the control into the MUI OutlinedInput geometry so the toolbar and
the content live inside ONE bordered surface:

- The surface root is now a `position: relative` Box carrying only radius,
  disabled background, cursor, and the focus-within border-color switch; it no
  longer draws the border itself.
- The single rounded border is drawn by an `aria-hidden` `<fieldset>` overlay
  (`position: absolute; inset: "-5px 0 0 0"; padding: 0 8px; borderRadius:
  inherit; overflow: hidden`) — exact port of MUI v9's `NotchedOutline`
  geometry (verified against `node_modules/@mui/material/OutlinedInput/*`).
- A hidden `<legend>` (11px height, `0.75em` font, `visibility: hidden` span
  with `opacity: 0` and 5px inline padding) reserves the native border gap the
  shrunken floating label occupies — the browser splits the border behind the
  legend, so **nothing is painted over the border** (no background-color fake
  notch, no stray corner artifact). The fieldset spreads
  `theme.typography.body1` so the legend's `0.75em` resolves against the same
  base as the 0.75-scaled label.
- When `required`, the legend content is `${label}\u2009*` — byte-identical to
  OutlinedInput's `label` + `"\u2009"` + `"*"` and to `FormLabel`'s asterisk
  span, so the notch width matches the visible label exactly. (The thin space
  is written as the `\u2009` escape; a literal U+2009 trips
  `no-irregular-whitespace`.)
- The visible label stays the existing `<InputLabel shrink id={labelId}>`
  inside the `FormControl`, which MUI already places at
  `translate(14px, -9px) scale(0.75)` for the outlined variant — it now
  notches the single border instead of floating above a misplaced arc.
- Focus styling moved from `&:focus-within` on the bordered box to
  `&:focus-within fieldset` on the root (the editable is no longer a
  descendant of the border-drawing element).
- A11y wiring from the 7.2 pass is untouched: `aria-required` /
  `aria-invalid` / `aria-describedby` sync effect, `aria-labelledby` /
  fallback `aria-label` in `editorProps.attributes`, toolbar `role="toolbar"`
  + `aria-label`, `aria-pressed` toggles — all unchanged and re-verified by
  tests (incl. a new `aria-required="true"` assertion).

## Finding 2 — Toolbar polish (MEDIUM)

- Toolbar padding-inline is `theme.spacing(1.25)` (10px); plus the new 6px
  button padding the first icon now starts at 16px — aligned with the 2-unit
  content padding below (was 8px vs 16px).
- Button padding `theme.spacing(0.75)` (6px) around the 20px small icon →
  32px touch targets.
- Active-state clarity: `action.selected` background behind the
  `primary.main` icon (inactive stays `text.secondary`); hover uses
  `action.hover` / keeps `action.selected` when active.
- Toolbar is now the header row of the single container: `surfaceVariant`
  background + `borderBlockEnd` divider that terminates at the enclosing
  border (no gap/offset drift).

## Finding 3 — Body height (MEDIUM)

- Content area defaults to ~3 text rows: `minHeight: theme.spacing(rows * 2.5
  + 3)` = 2.5 units (20px, one `bodyMd` row) per row + 3 units of vertical
  padding → 84px at the default (was a fixed 96px).
- New **optional** `minRows` prop (default 3) for callers needing a taller
  default; all previously public props are unchanged and the form's usage is
  unaffected.

## Files

| File | Change |
|---|---|
| `frontend/common/components/ui/input/richText/RichTextEditor.tsx` | single-border fieldset+legend outline, aligned toolbar header, 32px targets, active-state bg, `minRows` prop, ~3-row default |
| `test/ui/components/ui/RichTextEditor.test.tsx` | label queries now use `selector: "label"` (legend holds an identical hidden copy); +2 structural tests (toolbar/editor under one surface + legend notch, required asterisk reserved in notch and mirrored on label) |

Public API: `value, onChange, label, error, helperText, required, disabled,
id` unchanged; only **additive** optional `minRows`.

## Verification

- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` — **exit 0
  on both files** (tsgo → oxlint → biome → lint → duplicates → codescene).
  One sub-loop iteration needed: ESLint `no-irregular-whitespace` on the
  literal U+2009 → switched to the `\u2009` escape (same output).
- `bun run test/scripts/run-test.ts test/ui/components/ui/RichTextEditor.test.tsx`
  → **11 pass / 0 fail / 42 expect()** (was 9/31; +2 structural/a11y tests).
- axe compatibility: the overlay fieldset+legend is `aria-hidden` with no
  interactive descendants; the accessible name still comes from the visible
  `<label>` via `aria-labelledby` (assoc test green).
- No palette-hardcoded colors (theme callbacks only), RTL: logical props
  (`paddingInline`, `borderBlockEnd`, `textAlign: "start"`); symmetric MUI
  offsets (14px/8px/5px) flip with MUI's own transforms.
- No plan tags in comments; no files outside the two in scope touched.

# Visual Fix 3 — Student Credits LIST + RichTextEditor polish outcome

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Scope**: `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` (one change);
  `frontend/common/components/ui/input/richText/RichTextEditor.tsx` inspected but **not changed**
  (its finding verified already-fixed in the live DOM — see finding D).
- **Verification method**: live page via `agent-browser` DOM measurements (session
  `verify-4e6bfa581bd6`, dev server :3000, admin login re-injected via
  `bun run scripts/browser-login.ts --inject`) at 390×844 and 834×1194 — no images viewed.

## Per-finding resolution

### A. [MEDIUM] list-mobile name truncation — FIXED

Measured at 390px before: name column 132px wide; cell padding 10px×2 + avatar 32px +
gap 10px left the name `Typography` at **70px** (`sw=172` for the longest seeded name →
"GroupSim…").

Fix in `StudentCell`: the row `BaseAvatar` now carries
`sx={{ display: { xs: "none", sm: "flex" } }}` — the avatar drops out on phones and the
freed width flows to the name text. `sm` rather than `md`: even the longest seeded
name fully fits at 834px (`sw=242, cw=242`), so hiding it on tablets would only remove
the visual anchor.

Verified live at 390×844: avatar `display: none`, name `cw` **70 → 102**, email bears the
same gain, CLASSES LEFT chip + chevron untouched, `docHScroll = 0` (round-2 no-phantom-scrollbar
fixes intact). At 834×1194: avatar back at 32px, name fully visible, no horizontal scroll.

### B. [LOW] ACTIONS header axis on tablet — VERIFIED ALREADY FIXED (no change)

Live DOM at 834×1194: header title center = **531**, button center = **531** (header cell
x=474 w=114, title x=502.7 w=56.5, button x=484 w=94 — every axis coincides). The reported
~15px offset matches the pre-round-2 state; `align` + `headerAlign: "center"` on the
column already hold. No change.

### C. [LOW] CLASSES LEFT header/chip axis on mobile — VERIFIED ALREADY FIXED (no change)

Live DOM at 390×844: header title center = **223**, value chip center = **224** — same axis
within 1px (sub-pixel rounding of the chip's padding). Both the column's `align` and
`headerAlign` are `"center"`, so header text and chips share the vertical axis. No change.

### D. [LOW] RichTextEditor toolbar icon size — VERIFIED ALREADY FIXED (no change)

Source leaves no room for a 24px box: `padding: theme.spacing(0.75)` (= 6px) around a
`fontSize="small"` 20px icon, `box-sizing: border-box` → 32px. Live DOM on the adjust page
(`[role=toolbar] .MuiIconButton-root`, all 5 buttons): **32 × 32 computed box**,
`padding: 6px`, icon 20px. The inspector's ~24px measurement was the pre-fix cached bundle.
`RichTextEditor.tsx` untouched; its test suite untouched and not re-run (no code change).

### E. [LOW] Mobile bottom-nav clearance — VERIFIED NON-ISSUE (no change)

Re-measured at 390×844 fully scrolled: `<main>` `padding-bottom: 80px`,
`scrollHeight 1060 / clientHeight 780`; last row bottom = 662, grid footer bottom = 726,
fixed bottom nav starts at y=779 → **53px of clearance** below the pagination, 117px below
the last row. The grid is not its own scroll container, so no extra wrapper `pb` was added.

## Files changed

- `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` ✏️ (one edit:
  responsive `sx` on the row avatar in `StudentCell`)
- `frontend/common/components/ui/input/richText/RichTextEditor.tsx` — NOT changed
- Both test files — NOT changed

## Verification results

- `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx --lifecycle codescene`
  → exit 0 (tsgo, oxlint, biome, lint, duplicates, codescene).
- `bun run test/scripts/run-test.ts test/ui/components/accounting/StudentCreditsList.test.tsx`
  → **6 pass / 0 fail / 18 expects**.
- Live DOM (`agent-browser`, session `verify-4e6bfa581bd6`):
  - 390×844: avatar hidden, names widened 70→102px, chip/header axis shared, no doc or
    in-grid horizontal scroll, footer clears the bottom nav by 53px.
  - 834×1194: avatar present, longest name unclipped, ACTIONS header/button centered on
    one axis (531 == 531), no horizontal scroll.

## Constraints honored

Theme tokens only (the single change is a display toggle with `theme.breakpoints` keys),
no physical direction properties, RTL-safe, comments describe the what/why with no plan
tags, form/banner/radio files untouched (owned by another agent this round).

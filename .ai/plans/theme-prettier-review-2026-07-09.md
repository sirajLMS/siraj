# Theme + Prettier Review Plan

**Date**: 2026-07-09
**Scope**: Theme audit (hardcoded colors + THEME_PALETTE.md coverage + ThemeProvider setup) + prettier removal
**Focus**: Comprehensive — fix all 11 theme findings + remove prettier/eslint-config-prettier

## Summary

Two-track plan:
- **Track 1 (Prettier)**: Remove `prettier` + `eslint-config-prettier` deps from package.json, remove 2 `prettier --write` entries from lint-staged, delete `.prettierrc` + `.prettierignore`. Biome config (`biome.json`) already has equivalent settings (lineWidth:120, trailingCommas:es5, arrowParentheses:asNeeded, quoteProperties:asNeeded, lineEnding:lf, bracketSpacing:true, bracketSameLine:false, quoteStyle:double). Zero formatting-behavior loss.
- **Track 2 (Theme)**: 3 CRITICAL color-violation fixes (TagInput rgba, ImpersonationBanner contrastText), 5 WARNING fixes (doc 4 families in THEME_PALETTE.md, remove dead `next-themes` dep, migrate ThemeProvider to CssVarsProvider), 4 SUGGESTION fixes.

## Track 1: Prettier Removal (4 findings)

- [ ] [DONE] Remove `"prettier": "^3.9.4"` from `package.json` devDependencies
- [ ] [DONE] Remove `"eslint-config-prettier": "^10.1.8"` from `package.json` devDependencies
- [ ] [DONE] Remove the 2 `"prettier --write"` entries from `lint-staged` config in `package.json` (lint-staged config shrinks to empty — keep or remove husky entirely based on need; for now, keep an empty lint-staged with no formatters OR fully delete the lint-staged block)
- [ ] [DONE] Delete `.prettierrc`
- [ ] [DONE] Delete `.prettierignore`

## Track 2: Theme Fixes (11 findings)

### CRITICAL (3)
- [ ] **A** `frontend/components/ui/input/TagInput.tsx:23` — Hardcoded `rgba(255,255,255,0.23)` / `rgba(0,0,0,0.23)` → replace via `sx={(theme) => ({ borderColor: theme.palette.divider })}` (or `theme.palette.outlineVariant`)
  → Fix: TBD
- [ ] **A** `frontend/components/ui/input/TagInput.tsx:25` — Hardcoded `rgba(255,255,255,0.05)` / `rgba(0,0,0,0.02)` → replace via `sx={(theme) => ({ backgroundColor: theme.palette.action.hover })}`
  → Fix: TBD
- [ ] **B** `frontend/components/auth/ImpersonationBanner.tsx:31` — `theme.palette.warning.contrastText` → `theme.palette.onWarning` (AGENTS.md mandates `on<Color>` siblings, NOT `contrastText`)
  → Fix: TBD
- [ ] **B** `frontend/components/auth/ImpersonationBanner.tsx:47` — Same `contrastText` → `onWarning` swap
  → Fix: TBD

### WARNING (5)
- [ ] **B** `frontend/THEME_PALETTE.md` — Document the `text` family (`text.primary`, `text.secondary`, `text.disabled` — used 269 times but undocumented)
- [ ] **B** `frontend/THEME_PALETTE.md` — Document the `action` family (`action.hover`, `action.selected`, `action.disabled` — used 27+ times but undocumented)
- [ ] **B** `frontend/THEME_PALETTE.md` — Document `divider` (32 uses) + `common.white` (1 use) MUI-standard families
- [ ] **C** `package.json` — Remove dead `next-themes` dependency (declared but never imported per grep across `frontend/` and `app/`)
- [ ] **C** `frontend/providers/theme/ThemeProvider.tsx` — Migrate from legacy `ThemeProvider` + manual `useState` mode to MUI v9 `CssVarsProvider` + `useColorScheme()` pattern. Non-trivial refactor — preserve existing cookie-based initial theme + `ThemeSwitcher` toggle behavior + RTL setup. **Read `node_modules/next/dist/docs/` for the canonical Next.js 16 + MUI v9 CssVarsProvider pattern first per AGENTS.md.**

### SUGGESTION (3)
- [ ] **A** `frontend/components/ui/card/MetricCard/MetricCard.stories.tsx:49` — Stale Storybook assertion `#98D1D0` / `rgb(152, 209, 208)` doesn't match current palette (likely `#2DD4BF` or M3 secondary token). Update to match current `theme.palette.secondary.main` value.
- [ ] **A** `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView.tsx:49` — `theme.palette.common.white` → `theme.palette.onSurface` (M3 convention; especially for Arabic-first app where "white" is the surface in dark mode and the contrast pair is onSurface)
- [ ] **C** `frontend/providers/theme/ThemeProvider.tsx:18` — Hardcoded default `"dark"` mode; verify matches design intent (or make it null and rely on system/cookie fallback)

## Layer Compliance Notes

- Track 1 (prettier removal) — Biome already configured as equivalent, zero formatting behavior change. ✓ Compliant with AGENTS.md "Biome only" intent.
- Track 2 — `frontend.instructions.md` M3 rules (no `contrastText`, use `on<Color>` siblings) — fixes directly restore compliance.
- ThemeProvider migration to CssVarsProvider requires consulting `node_modules/next/dist/docs/` per root AGENTS.md before writing Next.js code. Subagent must do this.
- No entity types touched, no GraphQL documents touched — fully contained in frontend theme + docs.

## Fix Status

- Total findings: 15 (Track 1: 4 + Track 2: 11)
- Fixed: 0 / 15
- Remaining: 15

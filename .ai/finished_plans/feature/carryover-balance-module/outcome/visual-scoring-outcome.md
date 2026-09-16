# Visual Scoring Outcome — Carryover Balance Module

- Date: 2026-09-07
- Plan: .ai/plans/carryover-balance-module/ (prototype/ present — comparison phase executed)
- Capture rig: dev server @ localhost:3000 via agent-browser (sessions `verify-4e6bfa581bd6`, `final-4e6bfa581bd6`); auth via `scripts/browser-login.ts --inject` / cookie-set fallback
- Inspector model: kimi-k3 subagents (isolated, one image per context)
- Locales captured: en, ar (RTL)
- Dark-mode pass: yes (all list captures in both dark and light; discovered the app default theme is dark via `theme-mode` cookie)

## Surfaces covered

| Surface | Route / trigger | Viewports | States |
|---|---|---|---|
| carryover-list | `/accounting/carryover` (sidebar → Finance → Carryover Balances) | 1440×900, 390×844 | default (dark/light), empty, selected, AR |
| carryover-form (Add) | list → ADD NEW | 1440×900 | dialog open, validation (submit-empty), AR |
| bulk-to-expense modal | list → select rows → BULK TO EXPENSE | 1440×900 | modal open |
| detail drawer | row Actions → View Sessions (drawer route `/accounting/carryover/[id]`) | 1440×900 | paid (footer/Unpay) and unpaid |
| unpay-confirm | row Actions → Unpay; also drawer footer Unpay (verified live E2E) | 1440×900 | dialog open |
| audit bulk-carryover confirm | `/accounting/reports` → select audited rows → CARRYOVER BALANCE | 1440×900 | dialog open |

All prototype views exist and are reachable via navigation/actions (verified live, not just by code reading). CSV export verified (HTTP 200 `text/csv` from `/api/carryover/export`).

## Score history

Pass 1 = baseline captures; pass 4/5 = final. (Scores are inspector means over the 6 rubric axes.)

| Pass | Surface | Viewport | Total | Verdict |
|---|---|---|---|---|
| 1 | list default (dark) | 1440×900 | 7.33 | NEEDS FIXES |
| 1 | list default (light) | 1440×900 | 8.10 | NEEDS FIXES |
| 1 | list empty | 1440×900 | 8.40 | NEEDS FIXES |
| 1 | list mobile | 390×844 | 8.30 | NEEDS FIXES |
| 1 | form add | 1440×900 | 8.60 | NEEDS FIXES |
| 1 | bulk-to-expense | 1440×900 | 9.22 | NEEDS FIXES |
| 1 | detail drawer | 1440×900 | 8.60 | NEEDS FIXES |
| 1 | unpay confirm | 1440×900 | 9.70 | READY |
| 1 | audit bulk confirm | 1440×900 | 8.25 | NEEDS FIXES |
| 1 | list AR | 1440×900 | 8.67 | NEEDS FIXES |
| 1 | form add AR | 1440×900 | 8.75 | NEEDS FIXES |
| final | list AR | 1440×900 | 9.92 | READY |
| final | list mobile | 390×844 | 9.92 | READY |
| final | unpay confirm | 1440×900 | 9.80 | READY |
| final | detail drawer | 1440×900 | 9.50 | READY |
| final | list default (light) | 1440×900 | 9.60 | READY |
| final | list default (dark) | 1440×900 | 9.50 | READY |
| final | audit bulk confirm | 1440×900 | 9.50 | READY |
| final | list empty | 1440×900 | 9.40 | LOW-only accepted debt (see below) |
| final | form add | 1440×900 | 9.20 | LOW-only accepted debt |
| final | bulk-to-expense | 1440×900 | 9.38 | LOW-only accepted debt |
| final | form add AR | 1440×900 | 9.42 | LOW-only accepted debt |

## Pre-check gate failures found (and fixed)

| Surface | Check | Observation | Resolution |
|---|---|---|---|
| all | console | Script substring heuristic counts `[apollo.utils.errorLink]` channel names + benign refresh-token info lines | Filtered for real `[error]`-level entries each round: zero. (One genuine sibling-plan compile error — WhatsApp `NumbersHeaderShared` — appeared transiently; unrelated, in-flight elsewhere, self-resolved.) |
| list pages | offscreen | MUI DataGrid virtualized header columns beyond the grid's internal scroll width | Known artifact; overflow check (page-level) PASS; not user-visible. |
| all | a11y | unnamed icon-only sidebar `toggle-button` | Pre-existing app-shell issue, not carryover-owned; left for a shell-level fix. |
| drawer | (visual) | drawer header occluded by app bar — z-index 1200 modal < 1201 appbar | FIXED in `CarryoverDetailDrawer.tsx` (zIndex drawer+2 → 1202). |

## Fix waves

| Wave | Files | Findings addressed | Per-file sub-loop | Tests |
|---|---|---|---|---|
| locale | `shared/locale/{types,en,ar}/dashboard/accounting/carryover.ts` (+ `dashboard/admin` leafs for `rowsPerPage`) | WAITING_PAID enum leak; 12 new keys (subtitle, empty state, selectedCount, recordsCount, grouped summary/consequence, convert banner+hint, studentsAutoFilled helper, expenseLabel, drawer title reuse) | exit 0 all | none run (user constraint) |
| grid | `CarryoverDataGrid.tsx` | column overflow → fitted widths + persistent scrollbar cue + header wrap; teacher ellipsis+tooltip; enriched empty overlay; muted em-dash cells; period-cell line-height 51px→1.3 vertical bleed (two waves of forensics); From–To 120→130px; bidi isolation on date spans; full-width teacher zone; "1 selected" chip; aggregate footer record count | exit 0 all | none run |
| container/filter | `CarryoverFilterBar.tsx`, `carryover.desktop.tsx`, `carryover.mobile.tsx`, `PaidStatusChip.tsx` | triple title → single H1 + subtitle; dead filter band → one balanced row (fit at 1440px EN+AR); RTL radio order; toolbar mirroring verified correct; record count + emphasized totals; mobile meta dangling dash; mobile bottom-nav padding (pb 11); CLEAR icon-button when active; amber Unpaid semantics | exit 0 all | none run |
| form | `CarryoverFormDialog.tsx` (+`useCarryoverFormViewModel.ts` verified-only) | premature currency error (root cause: `CurrencyAutocompleteShared` eager `required` error — removed `required` prop per sibling pattern); auto-filled helper; students list full-width; currency endAdornment | exit 0 all | none run |
| drawer | `CarryoverDetailDrawer.tsx` | header (title+close) z-index occlusion fix; dedupated PAID field; students count derivation (split on `[,;،؛]`); pinned footer w/ Unpay (live-verified mutating path: convert → unpay from drawer) | exit 0 all | none run |
| dialogs | `BulkToExpenseModal.tsx`, `UnpayCarryoverDialog.tsx`, `CarryoverConfirmScaffold.tsx`, `CarryoverBulkCreateDialog.tsx` | consequence warning Alert; date format prop; fill-required caption; note label shrink+placeholder; expense reference row in unpay recap; grouped summary sentence; per-teacher breakdown TABLE + totals row (built from already-returned payload — Typography-as-cell regression fixed with real thead/tbody/tfoot, live-verified column alignment) | exit 0 all | none run |
| shared pagination | `PaginationControlsShared.tsx`, `PaginationControls.tsx` | 0-row footer collapses to single No-data indicator; rows-per-page selector wired through plumb + new `rowsPerPage` locale key | exit 0 all | none run |

**Known test risk (user forbade running UI tests):** `CarryoverContainer.test.tsx` may assert the removed section-panel title; and the form/dialog structural changes may affect component-test selectors. Deliberately left for the next test-allowed pass — no test files were touched.

## Accepted cosmetic debt

| Item | Score impact | Why it can't reach 10 | Why acceptable |
|---|---|---|---|
| Teacher filter placeholder truncates ("Select a teac…") | list ~0.1 | One-row filter budget at 1440px vs fixed locale copy | Floating "Teacher" label sits above; standard MUI ellipsis convention |
| Empty-state pagination simplification beyond No-data collapse; empty overlay composition | empty = 9.4 | LOW-only list remaining | Functional and composed (icon+heading+hint); residual items are density preference |
| Form: "This field is required" (via shared `ui.userSelect`) vs "Currency is required." phrasing split | form 9.2/9.42 | Phrasing split lives in a cross-module shared namespace used by every screen | Field-named-with-period is the dominant repo pattern; carryover side already conforms; a namespace-wide unification is a separate shared-locale decision |
| Bulk modal date format hint only reveals on interaction | bulk 9.38 | MUI picker convention (mask on focus) | Picker enforces valid input; repo-wide DatePicker pattern deliberately followed |
| Currency select search magnifier | form AR 9.42 | Shared `CurrencyAutocompleteShared` genuinely supports filter-as-you-type | Adornment is honest; shared primitive is out of scope |
| Unpay `Reason` stays optional (prototype wanted required + audit-log note) | — | spec (`docs/billing/carryover-balances.md`) keeps reason optional — prototype over-promised | Spec wins per plan rules; recorded as accepted prototype delta |
| Drawer Edit action not duplicated into drawer footer | — | Row-level Edit exists and stays reachable; wiring drawer→container dialog state is cross-file scope | Prototype-only surface; recorded delta, not a regression |
| Unpay body lacks session-count interpolation | — | needs a new parameterized locale key (`warningWithCount(count)`) | Recorded as a future-plan i18n amendment |

## Prototype comparison

| Screen | Better | Still missing vs prototype | Decision |
|---|---|---|---|
| list default (light) | impl 9.5–10/10 | — | parity-or-better; gaps (subtitle, selection chip, rows-per-page) all implemented |
| list alt (student-centric) | impl 10/10 | n/a — prototype depicts off-spec student-grain accounting; spec wins | recorded as prototype divergence, not a gap |
| list dark | impl 10/10 | — | parity (all 10 columns + scroll cue + selection chip verified) |
| list empty | impl 9/10 → enriched further this run | — | icon + heading + hint overlay implemented |
| list mobile | impl 10/10 | — | hours/record-count/disabled-chip all verified present |
| form add | parity-or-better | — | helper texts + currency adornment added |
| bulk-to-expense | parity-or-better | — | consequence banner restored (was the one real missing region) |
| detail drawer | parity-or-better | Edit button (prototype-only) | recorded accepted delta; Unpay added + functionally verified |
| audit bulk confirm | TIE → impl 9.5/10 | — | breakdown table + totals + grouped sentence + consequence line added |
| unpay confirm | parity | required Reason + audit-log helper | spec keeps optional — accepted delta |

## Capture lessons → evolution-log candidates

- Drawer/modal painted under the app bar (z-index 1200 vs 1201) is invisible to per-element visibility checks — only `elementsFromPoint`/`elementFromPoint` hit-testing catches cross-sibling occlusion. → promote to objective-prechecks (modal-over-appbar probe) + fix-patterns (drawer z-index recipe).
- `.MuiDataGrid-cell { line-height: calc(var(--height) - 1px) }` inherits into multi-line cell content: N lines × ~row height each → center-clipped slivers painting at the header band/scrollbar. `scrollWidth==clientWidth` CANNOT see vertical overflow — measure span `getBoundingClientRect`s against the cell rect. → promote to fix-patterns (grid multiline cell recipe).
- MUI `Typography component="td"/"th"` (or any theme setting Typography display) silently breaks table layout (cells stack vertically). Structural table elements must be plain/containers; Typography only nested inside cells. → fix-patterns.
- Shared agent-browser sessions get contaminated by concurrent agents (stray overlays/mid-capture navigation) producing false "regression" findings (the phantom scrim loss). Final captures in a dedicated clean session; re-run precheck after ANY interleaved agent activity. → capture-protocol.
- `scripts/visual-precheck.sh` console check is a substring heuristic — `[apollo.utils.errorLink]` channel names and benign `refreshToken` info lines always trip it. Until the script filters to real `[error]`-level entries, budget one manual filtered re-check per capture. → objective-prechecks (documented workaround).
- Resume-of-image-inspectors across many rounds eventually kills the upstream stream (image accumulation) — round 3+ inspectors should be FRESH subagents given the final capture path, not resumes with 4 prior image reads in context. → skill workflow note (rubric/Phase 4-6).

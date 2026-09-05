# Visual Scoring Outcome — session-event-audit

- Date: 2026-09-05
- Plan: .ai/plans/session-event-audit/
- Capture rig: storybook @ localhost:6006 (iframe, `globals=locale:en|ar`)
- Inspector model: task subagents (one image per inspector)
- Locales captured: en, ar
- Dark-mode pass: no (app shell dark already; theme is uniform)

## Surfaces covered

| Surface | Story id / route | Viewports | States |
|---|---|---|---|
| Session Audit Reports | `views-dashboard-accounting-sessionauditreportscontainer--populated-desktop` | 1440×900, 834×1112, 390×844 | populated, en + ar |
| Session Audit Reports (empty) | `…--empty-state` | 1440×900 | empty, en |
| Session Audit Reports (filtered) | `…--filtered-state` | 1440×900 | filters active, en |
| Class audit + Override dialog | `views-dashboard-classes-audit-classauditcontainer--override-dialog-from-deep-link` | 1440×900 | dialog open, en + ar |

Stories created/maintained: `frontend/stories/dashboard/accounting/SessionAuditReportsContainer.stories.tsx` (5 stories); `ClassAuditContainer.stories.tsx` gained the override-dialog story (plus a pre-existing Default-story navigation-params fix).

## Score history

| Pass | Surface | Viewport | Result |
|---|---|---|---|
| 1 | populated en | 1440 | 7.5 NEEDS FIXES |
| 1 | populated ar | 1440 | 7.6 NEEDS FIXES |
| 1 | populated en | 834 | 6.8 NEEDS FIXES |
| 1 | populated en | 390 | 7.7 NEEDS FIXES |
| 1 | empty en | 1440 | 7.4 NEEDS FIXES |
| 1 | filtered en | 1440 | 7.8 NEEDS FIXES |
| 1 | override en | 1440 | 7.5 NEEDS FIXES |
| 1 | override ar | 1440 | 8.8 NEEDS FIXES |
| 2 | populated en | 1440 | 8.25 NEEDS FIXES |
| 2 | populated ar | 1440 | 9.17 NEEDS FIXES |
| 2 | populated en | 834 | 9.0 NEEDS FIXES |
| 2 | populated en | 390 | 6.8 NEEDS FIXES |
| 2 | empty en | 1440 | 8.0 NEEDS FIXES |
| 2 | filtered en | 1440 | 7.7 NEEDS FIXES |
| 2 | override en | 1440 | 9.5 READY |
| 2 | override ar | 1440 | 9.0 NEEDS FIXES |
| 3 | populated en | 1440 | 6.8 NEEDS FIXES (width regression diagnostics) |
| 3 | populated ar | 1440 | 9.3 NEEDS FIXES |
| 3-4 | (diagnostics: stale-bundle suspicion disproved; measured real widths) | — | — |
| 6 | populated en | 1440 | 9.33 NEEDS FIXES (actions header mid-clip) |
| 6 | populated ar | 1440 | 9.3 NEEDS FIXES (fixture-note i18n — reclassified as fixture data) |
| 6 | populated en | 834 | 9.7 READY |
| 6 | populated en | 390 | 9.75 READY |
| 6 | empty en | 1440 | 8.83 NEEDS FIXES (same actions header) |
| 6 | filtered en | 1440 | 9.0 NEEDS FIXES (same actions header) |
| 7 | populated en | 1440 | 9.5 READY |
| 7 | populated ar | 1440 | 9.67 READY |
| 7 | filtered en | 1440 | 9.5 READY |
| 7 | empty en | 1440 | 8.83 → root-caused to 14px overhang, fixed, re-captured |
| 8 | empty en | 1440 | 9.5 READY |

**All 8 surfaces READY.**

## Pre-check gate failures found (and fixed)

| Surface | Check | Detail | Fix |
|---|---|---|---|
| (all) | console | MUI-X `:first-child` Emotion SSR warning — environment-wide baseline noise in RTL stories | recorded as known-ignored (originates in MUI X stylesheet via the Storybook RTL Emotion cache, not app code) |
| — | title guard | iframe document.title is the story id, not "Storybook" — gate adaptation | title matched against story id instead |

## Fix waves

| Wave | Files | Findings addressed | Per-file sub-loop | Tests |
|---|---|---|---|---|
| W1 (5 fixers) | grid, container+tier views, filter bar+aggregate card, stories+`.storybook/preview-head.html`, OverrideDialog+audit card | duplicate title; orphaned export button; column truncation; RTL bidi leading-char clip; muted placeholders; tablet filter dead zone; AR currency bidi; serif fonts (Storybook font loading missing); dialog fixture data + required-note hint; audit header time-range bidi | codescene exit 0 per file | UI tests updated, not run (policy) |
| W2 (4 fixers) | grid (compact datetimes, widths, scrollbar cue, status→col 3, name tooltips), filter bar (label/pairing), container+view-model (neutral empty copy `emptyState.titleNoFilters`, export disabled at 0 rows), OverrideDialog note bidi | pass-2 findings | codescene exit 0 | not run (policy) |
| Orch direct | grid widths ×3 rounds, actions icon button + ellipsized header, paid-amount LTR isolate; CSV serializer reordered to grid order (AC-8.3) + both CSV-affected backend tests updated and RUN green (14 + 25 pass) | pass 3–8 leftovers | codescene exit 0 | serializer + route tests RUN green |

## Accepted cosmetic debt

| Item | Current score impact | Why it can't reach 10 | Why acceptable |
|---|---|---|---|
| Headless screenshots never paint scrollbars | none on real product | capture-platform behavior | verified elements exist (opacity 1, 14px); real users see the cue; the persistent-track cue styling also shipped |
| Ellipsized headers ("SCHED… START") at tight widths | minor | 14 columns can't all spell out on 1440 | ellipsis + word-boundary wrap, never mid-glyph; matches payroll wide-grid precedent |
| Pager triple-restatement ("1–6 of 6" + page box + "Page 1 of 1") | minor | `AppDataGrid` pagination slot is deliberately sealed | platform-wide convention, not this page |
| Page title flush to iframe edge | none in app | stories render `layout: fullscreen` without the dashboard shell | real app renders inside DashboardLayoutIsland padding; verified to be the shared story convention |
| Fixture mixed currencies + one English note in AR story | none | story fixtures | fixture data only; production rows are user content |
| Override CTA uses error-red emphasis (تجاوز) | none | Plan 3 design decision (deliberate gravity signal) | consistent across locales; spec never prescribed primary |

## Prototype comparison

| Screen | Better | Still missing vs prototype | Decision |
|---|---|---|---|
| EN grid (proto 01) | IMPLEMENTATION (8/10 → 9.5+) | none | implemented |
| AR grid (proto 02) | IMPLEMENTATION (8/10 → 9.67) | none | implemented |
| Audit + override (proto 03) | IMPLEMENTATION for the dialog itself | prototype's session-timeline card + in-page payroll panel (hourly rate, payment date, system note) are richer context than the implemented page shows | **user decision / spec amendment** — a structural addition to the audit page, deliberately NOT implemented silently |

## Capture lessons → evolution-log candidates

- Headless Chromium never paints scrollbars in screenshots → "missing scrollbar" findings are always capture artifacts; verify `document.querySelector('.MuiDataGrid-scrollbar--horizontal')` + computed style instead.
- Storybook iframe captures inherit no app fonts unless `.storybook/preview-head.html` loads them (next/font CSS vars are absent); serif fallback in captures = missing preview-head font wiring, not product.
- Storybook dev server needs a RESTART to pick up `preview-head.html`; running story actually requires restart, not HMR.
- `agent-browser` needs `set viewport W H` before EVERY navigation when alternating sizes; bare `viewport` silently keeps the old size.
- Title guard in Storybook iframes: `document.title` is the story id, not "Storybook".
- Storybook HMR left a stale-looking bundle for one file mid-loop; verify live DOM (`scrollWidth`/computed styles) before trusting a "fix didn't land" conclusion from screenshots.
- Grid width budgets: `-N px` arithmetic must account for MUI's late filler (~20px); measure `virtualScroller.scrollWidth` vs `clientWidth` directly instead of summing declared widths.

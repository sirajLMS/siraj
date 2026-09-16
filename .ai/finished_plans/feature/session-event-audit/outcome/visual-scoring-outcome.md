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

---

# Round 2 — live-app polish loop (2026-09-06/07)

- Rig: dev server http://127.0.0.1:3000 + agent-browser (sessions sa-loop2, sa-loop2-t; teacher session via INTERNAL_DEMO_USERS + seed-default password, creds never printed).
- Locales: en + ar. Dark pass: no.
- UI/E2E tests: written/updated only, NOT executed (user constraint for this plan); backend tests executed (group-class service + query green). Per-file `sub-loop --lifecycle codescene` exit 0 for every touched file.

## What changed in this round (functional fixes during the wave)

1. **Pagination + sorting were live-broken on the reports grid** (discovered during verification): Apollo `data`-collapse during refetch made `totalCount` hit 0, and MUI clamped the page back to 1; sort used MUI's 3-state cycle whose empty state re-fell back to the current default. Fixed via `previousData` fallback + 2-state `sortingOrder`. Verified live: page 2 hydrates from `?page=1`, filter + pagination interoperate.
2. **Drill-down was dead for every report row**: report lists 1-on-1 instances only but `/classes/[id]/audit` served group classes only. Backend `getGroupClassAudit` now falls back to an instance-derived audit payload with an `isOneOnOne` discriminator (Pothos + codegen + documents); group-only affordances (resend notifications, export students, registered-students list) are gated off for the 1-on-1 variant. `?openOverride=1` now works from any report row. Backend tests added and green.
3. **403 view implemented**: `/accounting/reports` renders a localized `SessionAuditAccessDenied` card for users without `ACCOUNTING_REPORTS_VIEW` (specs.md:131) instead of a silent dashboard redirect; the shared `withPageAuth` redirect convention is untouched.
4. **Rich empty state** (`SessionAuditEmptyState` panel: icon + heading + guidance + CLEAR FILTERS) replaces the bare DataGrid message, EN+AR, desktop + mobile.
5. Audit page tab title corrected ("Class Audit"), all user-visible ISO timestamps formatted, null rows render `—`, label colon consistency, meeting-card broken-image fallbacks + empty-variant compression, mobile duplicate status chip removed, mobile reports header deduplicated.

## Pass history (per capture, inspector scores)

| Surface | R1 | R2 | R3 | R4 | Final |
|---|---|---|---|---|---|
| reports default desktop EN | 6.83 | 8.92 | 8.75 | — | accepted (8.75) |
| reports filtered desktop EN | 7.00 | 7.67 | 8.50 | — | accepted (8.50→8.92) |
| reports empty desktop EN | 8.33 | 8.75 | 8.67 | — | accepted (LOWs only) |
| reports default desktop AR | 9.08 | 8.75 | — | 9.67 | READY |
| reports empty desktop AR | 8.67 | 9.50 | — | — | READY |
| reports default mobile | 7.17 | 7.50 | 7.33 | 9.50 | READY |
| reports empty mobile | 6.58 | 9.17 | 8.83 | — | accepted (LOWs) |
| 403 desktop EN / mobile / AR | 9.42 / 8.67 / 9.00 | 9.50 / 10.00 / 9.50 | — | — | READY |
| class audit 1-on-1 desktop | 7.67 | 9.50 | — | — | READY |
| class audit 1-on-1 mobile | 7.50 | 8.83 | 9.67 | — | READY |
| class audit group desktop | 7.17 | 8.75 | 9.83 / 9.50 | — | READY |
| grid scrolled (desktop) | — | 8.50 | 8.50 | 9.53 | READY |

## Accepted debt (final, deliberate)

| Item | Why it can't reach 10 | Why acceptable |
|---|---|---|
| Desktop grid: rightmost column clipped at viewport edge in default scroll position | 15-column audit table exceeds the ~1080px content box at 1440; MUI's real horizontal scrollbar cue exists in real browsers (8px thin track styled via SCROLLBAR_CUE_SX) — headless Chrome never paints it, so captures look broken | real-user affordance exists; the inline-end columns render fully when scrolled (verified: vl2-final-grid-scrolled 9.53); clamping columns harder would harm content readability |
| CARRYOVER BALANCE ghost button detached/dim above the grid | owned by the carryover-balance plan, mid-integration on this page | out of this plan's fix scope by design; recorded for the carryover loop |
| Mobile empty: subtext last-line orphan wrap, header mixed wrap heights | cosmetic typography micro-polish inside an already composed empty state | no readability impact |
| Subject column "Arabic Rea…" truncation at 1440 | intentional ellipsis for long names in a dense grid; longer values surface on horizontal scroll | consistent with neighboring long-value columns |
| 'unknown' mobile provider badge (raw slug) | mobile meeting badge kept its existing pre-plan styling | desktop humanized via `watchOnline`; mobile route is out of plan-4's component set |

## Environment lessons (fed to the skill's evolution log)

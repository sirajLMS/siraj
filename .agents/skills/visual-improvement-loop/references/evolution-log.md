# Evolution Log

This log is how the skill keeps improving after every run. Each visual-improvement loop ends by
appending its reusable lessons here; lessons then graduate to a permanent home (a skill reference,
the agent-browser skill, or a global rule file) — and the entry records where it landed.

## Append rules

- One entry per lesson, dated, with the plan/run that produced it.
- Record **where it landed** (or "candidate" until promoted). An entry without a home is a to-do.
- Only GENERAL invariants graduate into rule files (AGENTS.md, instructions). Feature specifics
  (entity names, routes, permission strings) stay in the plan's outcome file — never in this log's
  promoted form.
- When a lesson revises an existing reference, update that reference in the same change and say so here.

## Entries

### 2026-08-30 — credit-adjustment-system (skill created from this run)

- `screenshot --full` resets interaction-driven client state on SPA pages with scroll containers —
  prefer viewport shot + `scrollIntoView`; verify DOM state after. → landed: `agent-browser` SKILL.md gotcha 0; `references/capture-protocol.md`.
- Auth expiry silently turns every later capture into a login-page screenshot — `document.title`
  guard is mandatory per capture, re-login via `browser-login.ts --inject` on bounce. → landed: `agent-browser` SKILL.md gotcha 0b; `references/capture-protocol.md`.
- Batched `ReadMediaFile` (multi-megabyte vision payloads) kills the upstream stream — one image per
  inspector subagent; comparator is the single two-image exception. → landed: SKILL.md golden rule 1.
- Prototype color comparison misleads (arbitrary Tailwind values) — structure-only comparison; spec
  wins conflicts. → landed: SKILL.md golden rule 3; `references/prototype-compare.md`.
- Parallel fix waves clobber each other without disjoint file ownership; shared-tree workstreams must
  never be reverted — assign non-overlapping file sets, record (don't fix) foreign pre-existing
  failures. → landed: SKILL.md golden rule 5.
- Re-inspections waste effort re-reporting already-fixed items — pass the prior findings list into
  re-inspection prompts so inspectors confirm-or-contradict. → landed: `references/rubric.md`.
- Inspectors spent effort on mechanical defects a script detects (console errors, overflow, wrong
  page) — objective pre-check gate before scoring. → landed: `references/objective-prechecks.md`, `scripts/visual-precheck.sh`, SKILL.md Phase 3/4.
- RTL/Arabic captures had no scoring criteria. → landed: `references/rubric.md` RTL checklist.
- Fix waves rediscovered the same recipes per finding. → landed: `references/fix-patterns.md`.
- Free-form outcome files made scores non-comparable. → landed: `references/outcome-template.md`.

### 2026-09-05 — session-event-audit

- Headless Chromium never paints scrollbars in screenshots — inspector findings of "no scroll cue"
  are always capture artifacts; verify the scrollbar element exists (`document.querySelector` +
  `getComputedStyle` visibility/opacity/size) before accepting the finding. → landed: this log;
  inspector prompt now carries the rule (add to rubric.md prompt text on next edit).
- Storybook captures of this app render in a serif fallback until fonts are wired: the app uses
  `next/font` CSS variables, so Storybook needs a `.storybook/preview-head.html` loading the webfonts
  (Inter/Hanken Grotesk/JetBrains Mono) and mapping the CSS vars. Preview-head changes need a
  Storybook RESTART (HMR does not apply them). → lesson for `storybook-protocol.md`.
- In Storybook iframes, `document.title` equals the story id (not "Storybook") — the precheck title
  guard must match the story id, or pass `--expect-title` accordingly. → lesson for `capture-protocol.md`.
- Bare `agent-browser viewport` silently keeps the old size; always `set viewport W H` per shot.
  Duplicate screenshots (byte-identical) were caught late — verify dimensions (`identify`) after changing viewports.
- Trilogy of Storybook staleness: stale bundle can look like a regression mid-loop. Before trusting a
  "fix didn't land" screenshot finding, probe the live DOM (`scrollWidth`/`clientWidth`, computed
  styles) — geometry numbers travel through bash, images don't need reloading to compare widths.
- Column-width budgeting against a declared sum is wrong by ~20px (MUI filler/separators); measure
  `virtualScroller.scrollWidth` vs `clientWidth` live and iterate to ≤ container, not to the sum.

## 2026-09-06 — whatsapp2 prototype parity run

- MUI `Select` options must be DIRECT `MenuItem` children: any custom wrapper component makes every option valueless to SelectInput ("out-of-range value" warning; clicks dead). Symptom-first check when a Select won't select.
- Empty-state / declined-state surfaces require SEEDED failure data to verify — route-level reachability proves nothing about state-gated banners/panels. Seed declined/failed/complete variants before the capture wave.
- DataGrid pagination is 0-indexed; a 1-indexed VM page state produces clamped re-queries (`OFFSET -n`) and phantom "Page 2 of 1" on empty lists.
- Very long multi-capture browser sessions stall the default agent-browser daemon; restarting as `agent-browser connect <port>` against a fresh headless Chrome (+ Playwright MCP storage inject fallback) is the working recovery.
- Full-page screenshots can still truncate scrollable inner panes at the viewport fold — pair every capture with DOM assertions for elements that must be present (markers inside scrollable thread panes especially).

## 2026-09-07 — session-event-audit round-2 (live-app loop)

- Custom `MuiDataGrid` `noRowsOverlay` leaves MUI's default footer "no data" caption visible next to the
  panel — hide it explicitly in the zero-row state (`& .MuiDataGrid-footerContainer .MuiTypography-root`).
- MUI X grid `valueFormatter` is SKIPPED for nullish cells — a "render '—' for null" requirement needs
  `renderCell`, not a formatter.
- Overflow-cue fades can sit in the DOM yet paint invisibly (gradient into the same paper tone). Verify
  fade cues by region-cropping the actual capture; DOM z-index checks alone give false confidence.
  Capture-side proof is now required for any "edge affordance" finding fix.
- Server-driven pagination: while a refetch is in flight, Apollo `data` flips undefined; if the grid's
  totalCount derives from it, MUI clamps the page back to 0 (the "Next flips you back to page 1" bug).
  Derive page data from `data ?? previousData` in every server-paginated view model.
- Long Arabic month names make "medium" datetime formats exceed EN width budgets (~135px): prefer
  numeric-month compact formats in dense grid time columns to avoid locale-coupled overflow.
- `agent-browser` + short-lived sessions: auth expires ~10-15 min under a shared dev tree; always
  re-inject cookies directly before a capture batch, or every later capture is a login page.
- Chrome's screencast/`record` context intermittently fails to resolve `localhost` (ERR_NAME_NOT_RESOLVED);
  after it begins, only restarting `agent-browser` sessions or switching to `127.0.0.1` heals it. And
  `record start <file>` (no URL) re-navigates to the CURRENT url — fatal for one-shot deep links whose
  query param gets consumed and stripped.
- Next dev "Compiling…" overlay toasts and the dev-tools badge leak into captures; poll for their absence
  before any screenshot that will be scored.
- Inspectors sometimes report "serif fallback" right after first-load font swap — verify computed
  `font-family` in the live page before assigning 'font mismatch' fixes; the app in this case matched
  (Hanken Grotesk) and the finding was a capture-timing artifact.

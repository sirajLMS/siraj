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

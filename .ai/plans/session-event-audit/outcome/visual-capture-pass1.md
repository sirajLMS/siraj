# Visual Capture Pass 1 — Session Audit Reports & Class Audit Override Dialog

Date: 2026-09-05
Session: `sa-cap-4e6bfa581bd6` (agent-browser, worktree scope)
Harness: `scripts/visual-precheck.sh` **not present** in repo → manual gate per
`.agents/skills/visual-improvement-loop/references/objective-prechecks.md` via `agent-browser eval`.

## Gate rules applied

- **title**: `document.title` must name the intended story id (Storybook `iframe.html` sets title to the
  story id, not the string "Storybook"). Auth/wrong-page bounce detector satisfied by story-id match.
- **console**: `console --level error`, with the known-ignored MUI-X DataGrid `:first-child` Emotion SSR
  warning filtered out. All observed `[error]` entries were exactly this warning (3 per page) → PASS.
- **overflow**: `document.documentElement.scrollWidth <= window.innerWidth`.
- **bleed**: element rects past the right viewport edge. All offenders were `MuiDataGrid-*` column-header
  descendants clipped by `MuiDataGrid-virtualScroller { overflow-x: scroll }` / `MuiDataGrid-main { hidden }`
  — internal grid scroll, not page overflow (document overflow was clean everywhere). Recorded as PASS with
  note. RTL (ar) captures show zero flagged elements because the grid scrolls left under RTL — consistent.
- **a11y smoke**: img-without-alt = 0 and unnamed icon-only buttons = 0 everywhere.

## Results

| Capture | File | Viewport | Gate | Notes |
|---|---|---|---|---|
| 1 | `sa-p1-populated-en-1440.png` | 1440x900 | PASS | 10.7 kB text content; DataGrid internal scroll bleed only |
| 2 | `sa-p1-populated-ar-1440.png` | 1440x900 | PASS | RTL; zero bleed flags |
| 3 | `sa-p1-populated-en-834.png` | 834x1112 | PASS | Retaken after viewport fix; snapshot 82→90 interactive nodes |
| 4 | `sa-p1-populated-en-390.png` | 390x844 | PASS | Retaken after viewport fix; no document overflow at 390 |
| 5 | `sa-p1-empty-en-1440.png` | 1440x900 | PASS | Empty state renders (innerText 485 chars) |
| 6 | `sa-p1-filtered-en-1440.png` | 1440x900 | PASS | Filtered state renders |
| 7 | `sa-p1-override-en-1440.png` | 1440x900 | PASS | Override dialog from deep link; no bleed |
| 8 | `sa-p1-override-ar-1440.png` | 1440x900 | PASS | RTL override dialog; no bleed |

## Verified dimensions / sizes

| File | Pixels | Bytes |
|---|---|---|
| sa-p1-populated-en-1440.png | 1440x900 | 107,927 |
| sa-p1-populated-ar-1440.png | 1440x900 | 104,480 |
| sa-p1-populated-en-834.png | 834x1112 | 89,040 |
| sa-p1-populated-en-390.png | 390x844 | 55,129 |
| sa-p1-empty-en-1440.png | 1440x900 | 51,976 |
| sa-p1-filtered-en-1440.png | 1440x900 | 108,694 |
| sa-p1-override-en-1440.png | 1440x900 | 129,363 |
| sa-p1-override-ar-1440.png | 1440x900 | 96,029 |

## Harness notes (for next pass)

- Viewport command is `agent-browser set viewport <w> <h>` (bare `agent-browser viewport` is an error and
  silently leaves the previous viewport — first run produced duplicate 1440x900 shots for captures 3–4,
  fixed by re-capture).
- `agent-browser console --level error` returns all buffered entries with level prefixes; filter
  `^\[error\]` for real errors.
- Console buffer accumulates across navigations; the same 3 Emotion warnings appear on every page —
  baseline noise, safe to ignore per instructions.
- Content sanity after each shot: `document.body.innerText.length` ranged 485–1,385 (empty state lowest,
  as expected) plus `snapshot -i -c` on re-captures.

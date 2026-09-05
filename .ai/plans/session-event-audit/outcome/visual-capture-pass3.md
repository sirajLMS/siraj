# Visual Capture — Pass 3

Date: 2026-09-05. Harness: `agent-browser` session `sa-cap3-4e6bfa581bd6` (worktree scope), Storybook `localhost:6006` (warm). All captures passed the quick gate: document title matches the story id, and console output contains no errors beyond the known MUI `:first-child` Emotion warnings and benign MSW/dev-tools info logs.

| # | File | Story / Viewport | Locale | Gate result | Notes |
|---|------|------------------|--------|-------------|-------|
| 1 | `scratch/screenshots/sa-p3-populated-en-1440.png` | `sessionauditreportscontainer--populated-desktop` @ 1440×900 | en | Pass (title match, no console errors) | Populated grid with status badges, filters, Export CSV header. |
| 2 | `scratch/screenshots/sa-p3-populated-ar-1440.png` | same @ 1440×900 | ar | Pass — `dir=rtl`, `lang=ar` confirmed | RTL populated state renders mirrored layout. |
| 3 | `scratch/screenshots/sa-p3-populated-en-834.png` | populated @ 834×1112 | en | Pass | Tablet-width populated state. |
| 4 | `scratch/screenshots/sa-p3-populated-en-390.png` | populated @ 390×844 | en | Pass — **STATUS column verified** | Column order: Scheduled start, Teacher, **Session status (index 2)**, Student, Subject, Room entry, Room exit. Status header rect `{left:255..371}` fully inside the 390px viewport with `docOverflowX: false` — visible without horizontal scrolling. (Trailing columns scroll horizontally within the grid scroller, which is expected.) |
| 5 | `scratch/screenshots/sa-p3-empty-en-1440.png` | `sessionauditreportscontainer--empty-state` @ 1440×900 | en | Pass (empty-state copy present in DOM) | Empty state renders its no-data messaging. |
| 6 | `scratch/screenshots/sa-p3-filtered-en-1440.png` | `sessionauditreportscontainer--filtered-state` @ 1440×900 | en | Pass | Filtered state story. |
| 7 | `scratch/screenshots/sa-p3-override-ar-1440.png` | `classauditcontainer--override-dialog-from-deep-link` @ 1440×900 | ar | Pass — dialog open, note text clean | Override dialog open from deep link in RTL. Note value extracted verbatim: “Session ran two minutes over the scheduled hour; billed in full under the standing rate agreement with the teacher.” — semicolon and punctuation intact, no bidi/quote mangling. Arabic option labels (استرداد/محسوب/غير محسوب/جزئي) render with correct em-dash separation. |

Screenshots saved for human review; not opened inline in this session per media-isolation policy.

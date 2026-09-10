# Palette's Journal - Critical Learnings

## 2026-03-31 - Shared Search Field Accessibility & Clear Action Pattern
**Learning:** `SearchBarField` is shared across dozens of views (mobile/desktop). Search inputs without explicit `htmlInput["aria-label"]` lack accessible names for screen readers, and lacking a clear button forces repetitive backspacing on populated searches.
**Action:** Always provide `aria-label` derived from placeholder on `htmlInput` and render a clear `IconButton` with `aria-label` when search input value is non-empty.

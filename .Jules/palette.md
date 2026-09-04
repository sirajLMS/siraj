## 2026-09-04 - Tooltip Wrapping on Disabled Action Buttons in Forms
**Learning:** In Material UI (MUI), disabled interactive elements (`IconButton`, `Button`) suppress pointer events and prevent `<Tooltip>` from firing on hover or focus. Wrapping disabled icon buttons inside a `<span>` or `<Box component="span">` ensures tooltips remain accessible when form fields or actions are in submitting/disabled states.
**Action:** Always wrap `IconButton` in `<span>` inside `<Tooltip>` when the icon button can be disabled (e.g. `disabled={isSubmitting}`).

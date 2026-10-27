## 2026-09-12 - Screen Reader Parity for Disabled Tooltip Actions

**Learning:** When interactive icon buttons (`IconButton`) are disabled with a specific `disabledReason` inside a `<Tooltip>`, visual users see hover tooltips explaining why the action is unavailable, but screen reader users only hear the generic button name. Providing `aria-disabled={true}` on the wrapper element and appending `(${disabledReason})` to `aria-label` gives screen reader users exact parity with visual tooltips.

**Action:** Whenever wrapping disabled UI controls in tooltips or non-interactive container spans, ensure `aria-disabled` and descriptive `aria-label` attributes propagate the disabled explanation to accessibility APIs.

## 2026-10-23 - Accessible Dialog Labeling via React useId

**Learning:** Modal dialog components (`<Dialog>`) without explicit `aria-labelledby` attributes leave screen reader users without immediate contextual announcement of the dialog's purpose when focus moves into the modal. Generating a unique title identifier with React's `useId()` and linking `<Dialog aria-labelledby={titleId}>` to `<DialogTitle id={titleId}>` provides accessible dialog naming across screen readers without requiring consumers to manage manual element IDs.

**Action:** Ensure all modal dialog shells assign a generated `id` to the `<DialogTitle>` element and reference it in `<Dialog aria-labelledby={id}>`.

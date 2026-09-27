## 2026-09-12 - Screen Reader Parity for Disabled Tooltip Actions

**Learning:** When interactive icon buttons (`IconButton`) are disabled with a specific `disabledReason` inside a `<Tooltip>`, visual users see hover tooltips explaining why the action is unavailable, but screen reader users only hear the generic button name. Providing `aria-disabled={true}` on the wrapper element and appending `(${disabledReason})` to `aria-label` gives screen reader users exact parity with visual tooltips.

**Action:** Whenever wrapping disabled UI controls in tooltips or non-interactive container spans, ensure `aria-disabled` and descriptive `aria-label` attributes propagate the disabled explanation to accessibility APIs.

## 2026-09-15 - Keyboard Navigation and Focusability for Inline Editable Typography

**Learning:** Inline editable text fields (`EditableTypography`) that activate on click or double-click are inaccessible to keyboard-only users unless explicitly configured with `tabIndex={0}`, `role="button"`, and `onKeyDown` handlers for `Enter` and `Space`. Adding `:focus-visible` ring styles and wrapping the display element in a `<Tooltip title={editHint}>` communicates clickability to mouse, keyboard, and screen reader users alike.

**Action:** Ensure custom inline-editable text controls provide `tabIndex={0}`, `role="button"`, keyboard activation listeners, and localized aria hints or tooltips so keyboard and screen reader users can trigger edit mode without requiring mouse interactions.

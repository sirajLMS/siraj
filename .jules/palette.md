## 2026-09-12 - Screen Reader Parity for Disabled Tooltip Actions

**Learning:** When interactive icon buttons (`IconButton`) are disabled with a specific `disabledReason` inside a `<Tooltip>`, visual users see hover tooltips explaining why the action is unavailable, but screen reader users only hear the generic button name. Providing `aria-disabled={true}` on the wrapper element and appending `(${disabledReason})` to `aria-label` gives screen reader users exact parity with visual tooltips.

**Action:** Whenever wrapping disabled UI controls in tooltips or non-interactive container spans, ensure `aria-disabled` and descriptive `aria-label` attributes propagate the disabled explanation to accessibility APIs.

## 2026-09-15 - Keyboard Search Field Clearing & Parent Overlay Event Isolation

**Learning:** When users press the `Escape` key inside a search input with active text, their intuitive expectation is to clear the search query rather than close the parent modal, drawer, or dialog container. Stopping event propagation (`event.stopPropagation()`) specifically when `Escape` is pressed while `value` is non-empty prevents unexpected overlay closure while enabling quick keyboard search resets.

**Action:** In search bar and filter input components, handle `Escape` keydown to call `onChange("")` and `event.stopPropagation()` when input text is present, allowing normal `Escape` bubbling to close overlays only when the search field is already empty.

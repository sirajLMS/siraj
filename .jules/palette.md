## 2026-09-12 - Screen Reader Parity for Disabled Tooltip Actions

**Learning:** When interactive icon buttons (`IconButton`) are disabled with a specific `disabledReason` inside a `<Tooltip>`, visual users see hover tooltips explaining why the action is unavailable, but screen reader users only hear the generic button name. Providing `aria-disabled={true}` on the wrapper element and appending `(${disabledReason})` to `aria-label` gives screen reader users exact parity with visual tooltips.

**Action:** Whenever wrapping disabled UI controls in tooltips or non-interactive container spans, ensure `aria-disabled` and descriptive `aria-label` attributes propagate the disabled explanation to accessibility APIs.

## 2026-10-06 - Keyboard Accessibility for Custom Popover Option Lists

**Learning:** Custom dropdown/popover lists built with container components (such as `Stack` or `Paper`) lack implicit keyboard navigation and option roles if rendered as generic `div`s. Setting `role="listbox"` on the list container and `component="li"`, `role="option"`, `tabIndex={0}`, `:focus-visible` ring styles, and `onKeyDown` handlers (for Enter/Space keys) on list options provides screen reader semantics and keyboard accessibility.

**Action:** Whenever building custom dropdown or popover option pickers, ensure container elements specify `role="listbox"` and option items specify `component="li"`, `role="option"`, `tabIndex={0}`, `:focus-visible`, and Enter/Space key selection logic.

## 2026-09-12 - Screen Reader Parity for Disabled Tooltip Actions

**Learning:** When interactive icon buttons (`IconButton`) are disabled with a specific `disabledReason` inside a `<Tooltip>`, visual users see hover tooltips explaining why the action is unavailable, but screen reader users only hear the generic button name. Providing `aria-disabled={true}` on the wrapper element and appending `(${disabledReason})` to `aria-label` gives screen reader users exact parity with visual tooltips.

**Action:** Whenever wrapping disabled UI controls in tooltips or non-interactive container spans, ensure `aria-disabled` and descriptive `aria-label` attributes propagate the disabled explanation to accessibility APIs.

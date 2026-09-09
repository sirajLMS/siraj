## 2026-09-09 - Tooltips on Table Row Action Icon Buttons
**Learning:** Icon-only action buttons in data grid columns (e.g., edit, delete) have `aria-label` for screen readers, but lack visible text or hover tooltips for visual users, leading to ambiguity on compact icons.
**Action:** Use `TooltipIconButton` for table row action columns to provide both `aria-label` accessibility and hover tooltips for sighted users.

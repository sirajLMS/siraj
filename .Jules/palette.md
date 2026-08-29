## 2026-08-29 - Icon-only Action Lists with MUI Tooltip & IconButton
**Learning:** In lists or rows featuring multiple icon-only actions (such as Edit, Set Default, and Delete icons in meeting configurations), providing both `aria-label` and visual `<Tooltip title={...}>` wrappers ensures mouse, keyboard, and screen reader users can all identify actions effortlessly without ambiguity.
**Action:** Always wrap icon-only action `IconButton`s in a `<Tooltip title={...}>` using the same localized string as `aria-label`.

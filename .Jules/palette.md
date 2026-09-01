## 2026-09-01 - Disabled Button Tooltips in Material UI
**Learning:** In Material UI (MUI), interactive elements like `IconButton` or `Button` with `disabled` set suppress pointer events, which prevents `<Tooltip>` from detecting hover or focus events to display tooltips.
**Action:** Wrap disabled interactive elements inside `<Box component="span" sx={{ display: "inline-flex" }}>` when using `<Tooltip>` so tooltips for disabled states work properly.

## 2025-05-18 - MUI Tooltips on Disabled Buttons Accessibility
**Learning:** Material UI suppresses pointer and hover events on `disabled` interactive elements (such as `<Button>` or `<IconButton>`), which prevents wrapping `<Tooltip>` components from displaying tooltips to users or screen readers.
**Action:** Always wrap disabled interactive elements inside a non-disabled wrapper (such as `<Box component="span">`) inside `<Tooltip>` so events fire correctly and tooltips are displayed on hover/focus.

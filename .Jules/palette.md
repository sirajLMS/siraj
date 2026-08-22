## 2025-05-18 - Focus Visible Indicators for Custom Styled Links
**Learning:** Custom styled `Link` components used as action icon buttons often lack native browser focus rings when styled without MUI `IconButton` defaults, causing keyboard accessibility failures for screen reader and keyboard-only users.
**Action:** Always include `&:focus-visible` ring/outline rules (`outline: 2px solid ${theme.palette.primary.main}`, `outlineOffset: 2`) when building styled link action buttons across common/mobile/desktop components.

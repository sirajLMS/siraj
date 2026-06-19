UX Specification: Main Permissions Page Layout

Route: /permissions

1. Page Header

Title: "Permission Management"

Subtitle: "Manage groups, view system permissions, and configure user-specific overrides."

Top-Right Action: (Optional) Global help icon linking to documentation.

2. Main Navigation Tabs

A top-level tab group spanning the width of the page content area.

Tab 1: Permission Groups (Default) -> Renders 02_tab_groups_ux.md

Tab 2: Permission Catalog -> Renders 03_tab_catalog_ux.md

Tab 3: User Overrides -> Renders 04_tab_overrides_ux.md

Interactions

Clicking a tab dynamically swaps the content area without a full page reload (preserving URL state via query params, e.g., ?tab=catalog).
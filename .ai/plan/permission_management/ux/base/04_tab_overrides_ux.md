UX Specification: Tab - User Overrides

Context

This tab manages single users who have permissions explicitly added (Grants) or denied (Revokes) outside of their assigned groups. This is critical for penalty states or elevated single-user access.

Layout

Top Bar:

Left: Search input ("Search by User ID, Name, or Email...")

Left Filters: "Show All", "Has Explicit Grants", "Has Explicit Denies", "Has Conflicts".

Right: Primary Button [ + Add Override ] -> Triggers 10_modal_manage_override_ux.md

Content: PaginatedDataGrid

Columns

User Details: Avatar + Name + Email.

Base Groups: Tags of groups assigned to the user (e.g., [Teacher], [Staff]).

Active Grants (Allow): Integer count of single permissions manually added.

Active Revokes (Deny): Integer count of permissions explicitly blocked.

Status/Alerts: Warning icon if there is a conflict (e.g., user is in "Admin" group but has explicitly denied admin permissions). Tooltip explains the conflict.

Actions:

[ Manage Overrides ] -> Triggers 10_modal_manage_override_ux.md for this user.
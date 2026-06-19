# Permission Management — UX Design Prompt

    This file is the design brief for the UX mockup of the Permission Management page.
    The resulting design files (PNG + HTML) must be placed in `.ai/ux/01-in_progress/`
    before Task G of `permission_management.md` can begin.

    ---

    ## 1. Page Overview

    - **Page Name:** Permission Management
    - **Route:** `/[locale]/(dashboard)/permissions`
    - **Access:** SuperAdmin only (`permission_groups.manage`)
    - **Purpose:** View all system permissions by category, manage permission groups

(create/edit/delete custom), assign groups to users.

    ---

    ## 2. Design System Reference

    - **UI Library:** Material UI (MUI) v9+
    - **Theme:** Material 3 dark-mode, custom M3 palette
    - **Font:** Inter / Outfit
    - **Layout:** Same dashboard shell as all pages (sidebar + topbar + content)
    - **RTL:** Arabic + English compatible

    ---

    ## 3. Page Layout

┌──────────────────────────────────────────────────────────┐
│ Dashboard Shell (Sidebar + TopNavbar) │
├──────────────────────────────────────────────────────────┤
│ PageHeader │
│ Title: "Permission Management" │
│ Subtitle: "Manage permission groups..." │
│ Action: [+ Create Group] │
├──────────────────────────────────────────────────────────┤
│ SectionPanel: "Permission Groups" │
│ AppDataGrid: Name | Slug | Type | Permissions | Acts │
├──────────────────────────────────────────────────────────┤
│ SectionPanel: "Permission Catalog" │
│ Filter chips (by category) above table │
│ AppDataGrid: Key | Resource | Action | Desc | Cat │
└──────────────────────────────────────────────────────────┘

    ---

    ## 4. Permission Groups Table

    ### Desktop Columns

    | Column | Content | Width |
    |---|---|---|
    | Group Name | Bold for system groups | flex 1.5 |
    | Slug | Monospace code chip | flex 1 |
    | Type | "System" (info) or "Custom" (success) badge | 100px |
    | Permissions | "12 permissions" count | 140px |
    | Actions | Icons: Edit ✏️, Delete 🗑️, Assign 👤 | 140px |

    ### System Group Rows
    - Subtle `primaryContainer` tinted background
    - Edit and Delete icons **hidden** (immutable)
    - Only "View Permissions" icon shown
    - "SYSTEM" badge in Type column

    ### Custom Group Rows
    - Normal background
    - All three action icons visible: Edit, Delete, Assign
    - "CUSTOM" badge in Type column

    ### Mobile Card (< 768px)

┌─────────────────────────────────────┐
│ [Group Name] [BADGE] │
│ Slug: custom_group_slug │
│ 12 permissions │
│ ───────────────────────────────── │
│ [Edit] [Delete] [Assign] │
└─────────────────────────────────────┘

    ---

    ## 5. Permission Catalog Table

    ### Category Filter Chips
    - Row of outlined chips per unique category
    - Clicking filters the table rows
    - "All Categories" chip always first
    - Active chip: primary filled variant; inactive: outlined

    ### Desktop Columns

    | Column | Content |
    |---|---|
    | Key | Full permission key — monospace (e.g. `session.activate`) |
    | Resource | Resource name |
    | Action | Action name |
    | Description | Human-readable description |
    | Category | Chip with `primaryContainer` background |

    - Read-only table — no action buttons
    - Dense row padding
    - Copy-to-clipboard icon on Key column (hover)

    ---

    ## 6. Create / Edit Permission Group Dialog

    - Width: 640px desktop / full-screen mobile
    - Max height: 80vh with scrollable permissions list

┌──────────────────────────────────────────────────────┐
│ Create Permission Group [✕] │
├──────────────────────────────────────────────────────┤
│ Group Name \* │
│ [] │
│ │
│ Description │
│ [] │
│ │
│ Permissions │
│ "Select permissions to include in group" │
│ ┌──────────────────────────────────────────────┐ │
│ │ Authentication [Select all] │ │
│ │ ☑ auth.login │ │
│ │ ☑ auth.view_own_profile │ │
│ │ Dashboard [Select all] │ │
│ │ ☐ dashboard.view │ │
│ │ ☑ dashboard.view_metrics │ │
│ └──────────────────────────────────────────────┘ │
│ 12 of 47 selected │
├──────────────────────────────────────────────────────┤
│ [Cancel] [Create Group] │
└──────────────────────────────────────────────────────┘

    **Permission list details:**
    - Grouped by category with bold category header
    - "Select all in category" link per header
    - Indented checkbox list per category
    - Selected count shown below list
    - Primary color checkmarks

    ---

    ## 7. Delete Confirmation Dialog

┌──────────────────────────────────────────────────────┐
│ Delete Permission Group [✕] │
├──────────────────────────────────────────────────────┤
│ ⚠️ Are you sure you want to delete │
│ "Custom Group Name"? │
│ │
│ This action cannot be undone and will remove │
│ all user assignments to this group. │
├──────────────────────────────────────────────────────┤
│ [Cancel] [Delete Group] │
│ (error/red button) │
└──────────────────────────────────────────────────────┘

    ---

    ## 8. Assign Group to User Dialog

┌──────────────────────────────────────────────────────┐
│ Assign Group to User [✕] │
├──────────────────────────────────────────────────────┤
│ Permission Group │
│ Custom Group Name (read-only display) │
│ │
│ User ID \* │
│ [Enter user UUID____________________________] │
│ │
├──────────────────────────────────────────────────────┤
│ [Cancel] [Revoke Group] [Assign Group] │
└──────────────────────────────────────────────────────┘

    ---

    ## 9. Empty States

    - **No groups:** Illustration + "No permission groups found" + [Create Group] button
    - **No permissions:** "No permissions found"
    - **Filtered catalog empty:** "No permissions in this category"

    ---

    ## 10. Responsive Breakpoints

    | Breakpoint | Behavior |
    |---|---|
    | `xs`–`sm` (< 768px) | Groups as `PermissionGroupCard` stack. Catalog hides resource/action

columns. |
| `md`+ (≥ 768px) | Full `AppDataGrid` for both sections. All columns visible. |

    ---

    ## 11. Interaction States

    | Element | State | Visual |
    |---|---|---|
    | Create Group button | Hover | MUI ripple |
    | DataGrid row | Hover | `surfaceVariant` bg |
    | System group row | Default | `primaryContainer` tint |
    | Category chip | Selected | Primary filled |
    | Category chip | Unselected | Outlined |
    | Permission checkbox | Checked | Primary color |
    | Delete button (dialog) | Default | `error` color |
    | Action icons | Hover | Tooltip shown |

    ---

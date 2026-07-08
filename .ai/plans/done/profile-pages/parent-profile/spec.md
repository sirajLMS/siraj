# Spec — Parent Profile

## Purpose

Full parent profile page for own view and admin view: account, identity, billing, social, and associated students grid inline on the profile tab.

## Audience & scope

| Scope | Route | Permissions |
|-------|-------|-------------|
| Own view | `/profile` | `auth.view_own_profile`, `parent.view_own_profile` |
| Own edit | `/profile/edit` | `auth.edit_own_profile`, `parent.edit_own_profile` |
| Admin view | `/users/[userId]/profile` | `user.edit_profile`, parent view permissions |
| Admin edit | `/users/[userId]/profile/edit` | `user.edit_profile` |

## Stitch references

**Project ID:** `3409377417207008542`

| Viewport | Screen | Screen ID |
|----------|--------|-----------|
| Desktop | Animated Parent Profile (Admin View) | `57a69f7fe3084128abc0a0b0bdc11241` |
| Mobile | Animated Parent Profile (Mobile Admin View) | `582ef0ac72a2464ba46103eb26e76503` |

**State screens — desktop:** loading `0686b9e029f54825aa7048e6086b7442`, empty `934bffcdbdd14e89b1afe020368b1042`, error `87112dff6cd448fa8a84d49b5f10f892`

**State screens — mobile:** loading `85cd467f6e574fae9486de2d352e4c55`, empty `3dfdcdc80a68434aa8481c1a8301878c`, error `dba401a0eb42483b9a5668da44c0ecf5`

## Layout sections & field matrix

| Section | Stitch label | Entity field | Own view | Own edit | Admin view | Admin edit |
|---------|--------------|--------------|----------|----------|------------|------------|
| Account | Full Name | `users.name` | Yes | Yes | Yes | Yes |
| Account | Primary Email | `users.email` | Yes | Yes | Yes | Yes |
| Account | Avatar | `users.avatarUrl` | Yes | Yes | Yes | Yes |
| Contact | Mobile Phone | `parents.phone` | Yes | Yes | Yes | Yes |
| Identity | Nationality | `parents.nationality` | No | No | Yes | Yes |
| Identity | Residential Address | `parents.address` | No | No | Yes | Yes |
| Social | Facebook | `parents.facebook` | Yes | Yes | Yes | Yes |
| Social | WhatsApp | `parents.whatsapp` | Yes | Yes | Yes | Yes |
| Social | Twitter | `parents.twitter` | Yes | Yes | Yes | Yes |
| Social | Skype | `parents.skype` | Yes | Yes | Yes | Yes |
| Zoom | Default Zoom Link | `parents.defaultZoomLink` | Yes | Yes | Yes | Yes |
| Billing | Invoice Type | `parents.invoiceType` | No | No | Yes | Yes |
| Billing | Base Fee Amount | `parents.feeAmount` | No | No | Yes | Yes |
| Billing | Default Payment Method | `parents.paymentMethod` | No | No | Yes | Yes |
| Billing | Currency | `parents.currency` | No | No | Yes | Yes |
| Billing | Timezone | `parents.timezone` | No | No | Yes | Yes |
| Status | Status | `parents.status` | No | No | Yes | No |
| Students | Associated Students | students relation | Yes | No | Yes | No |

## Responsive behavior

- **Desktop:** Billing + Identity in admin-only panels; students grid below sections
- **Mobile:** Stacked sections; students grid as card list

## Animations

- Section stagger on load; skeleton for grid rows during loading
- Empty state when no associated students
- Error retry on profile or students query failure

## Acceptance criteria

- [x] Own view/edit covers contact + social + zoom fields
- [x] Admin view shows billing + identity sections
- [x] Admin edit submits `ParentAdminProfileUpdateInput` (not own-only fields)
- [x] Associated students grid matches Stitch (name, grade, status)
- [x] Admin-only banner visible on admin scope
- [x] Mobile layout matches animated Stitch reference


- [x] All display/edit data via GraphQL only ([DATA_POLICY.md](../DATA_POLICY.md))
## Gaps

- Parent status edit uses separate deactivate flow — view only on profile

## Implementation layers

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). See `plan.md` for layer-specific files and `tasks.md` for ordered checklist. Complete lower layers before higher layers.

## Local Stitch assets

Use files in `stitch-assets/` (not MCP):

- **parent-profile-desktop-happy**: `stitch-assets/html/parent-profile-desktop-happy.html` | `stitch-assets/screenshots/parent-profile-desktop-happy.png`
- **parent-profile-mobile-happy**: `stitch-assets/html/parent-profile-mobile-happy.html` | `stitch-assets/screenshots/parent-profile-mobile-happy.png`

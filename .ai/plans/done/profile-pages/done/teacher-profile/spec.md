# Spec — Teacher Profile

## Purpose

Full teacher profile page for own view and admin view: account, identity, contact, zoom, compensation, and stats. Primary tab on teacher profile shell. Implements all teacher-relevant fields from `users` + `teachers` tables per field matrix.

## Audience & scope

| Scope | Route | Permissions |
|-------|-------|-------------|
| Own view | `/profile` | `auth.view_own_profile`, `teacher.view_own_profile` |
| Own edit | `/profile/edit` | `auth.edit_own_profile`, `teacher.edit_own_profile` |
| Admin view | `/users/[userId]/profile` | `user.edit_profile`, teacher view permissions |
| Admin edit | `/users/[userId]/profile/edit` | `user.edit_profile` |

## Stitch references

**Project ID:** `3409377417207008542`

| Viewport | Screen | Screen ID |
|----------|--------|-----------|
| Desktop (happy path) | Animated Teacher Profile - Navy Variant (Admin View) | `7175120a1b7449488fb370b59ae10146` |
| Mobile (happy path) | Animated Teacher Profile (Mobile Admin View) | `e57caae245be49b7824abd80f7af78b9` |

**State screens — desktop:** loading `8a9888f969d842aeb16354fefb7a7169`, empty `9f6f34efcaa14b56b40c0621494a6e1e`, error `90bb190963ea44bfa587fbd89d4b1376`

**State screens — mobile:** loading `170c7ec667894281855f2c45e124039c`, empty `780eab490b784617abe993f202bc145f`, error `91fae3b02427495c98d45d103ecb1997`

## Layout sections & field matrix

| Section | Stitch label | Entity field | Own view | Own edit | Admin view | Admin edit |
|---------|--------------|--------------|----------|----------|------------|------------|
| Account | Full Name | `users.name` | Yes | Yes | Yes | Yes |
| Account | Primary Email | `users.email` | Yes | Yes | Yes | Yes |
| Account | Avatar | `users.avatarUrl` | Yes | Yes | Yes | Yes |
| Identity | National ID | `teachers.nationalId` | No | No | Yes | Yes |
| Identity | Date of Birth | `teachers.dateOfBirth` | No | No | Yes | Yes |
| Identity | Gender | `teachers.gender` | No | No | Yes | Yes |
| Contact | Phone Number | `teachers.phone` | Yes | Yes | Yes | Yes |
| Contact | Residential Address | `teachers.address` | No | No | Yes | Yes |
| Contact | Timezone | `teachers.timezone` | Yes | No | Yes | Yes |
| Zoom | Personal Zoom Link | `teachers.zoomLink` | Yes | Yes | Yes | Yes |
| Zoom | Zoom Username | `teachers.zoomUsername` | No | No | Yes | Yes |
| Zoom | Zoom API Password | `teachers.zoomPassword` | No | No | Yes (masked) | Yes |
| Professional | Qualifications | `teachers.qualifications` | No | No | Yes | Yes |
| Professional | Skype ID | `teachers.skypeId` | No | No | Yes | Yes |
| Compensation | Hourly Rate | `teachers.hourlyRate` | Yes | No | Yes | Yes |
| Compensation | Currency | `teachers.rateCurrency` | Yes | No | Yes | Yes |
| Compensation | Payment Method | `teachers.paymentMethod` | Yes | No | Yes | Yes |
| Account status | Status | `teachers.status` | No | No | Yes | Yes |
| Stats | Total Classes | computed | Yes | No | Yes | No |
| Stats | Avg Engagement | computed | No | No | Yes | No |

Admin-only identity/zoom sections hidden from own profile per product decision.

## Responsive behavior

- **Desktop:** Two-column card layout; Identity + Compensation side-by-side
- **Mobile:** Single column stack; section panels full width

## Animations

- Section cards stagger fade-in on load (animated Stitch reference)
- Skeleton per section during loading state screens
- Empty state illustration when teacher record missing fields
- Error state with retry on query failure

## Acceptance criteria

- [x] Own view shows contact + compensation (read-only) + zoom link
- [x] Own edit saves phone + zoomLink + core fields via `updateOwnProfile`
- [x] Admin view shows all sections including Identity (admin-only)
- [x] Admin edit saves full teacher input via `updateUserProfile.teacher`
- [x] Sensitive fields (nationalId, zoomPassword) in admin-only section
- [x] Stats section shows totalClasses (and avgEngagement for admin)
- [x] Matches Stitch layout structure with Siraj theme colors
- [x] Mobile animated reference layout on small screens


- [x] All display/edit data via GraphQL only ([DATA_POLICY.md](../DATA_POLICY.md))
## Gaps

- Stitch Navy/Warm variants are color-only — use Siraj theme
- `teachers.nationality`, `countryCode` not in current update type — extend if needed

## Implementation layers

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). See `plan.md` for layer-specific files and `tasks.md` for ordered checklist. Complete lower layers before higher layers.

## Local Stitch assets

Use files in `stitch-assets/` (not MCP):

- **teacher-profile-desktop-happy**: `stitch-assets/html/teacher-profile-desktop-happy.html` | `stitch-assets/screenshots/teacher-profile-desktop-happy.png`
- **teacher-profile-mobile-happy**: `stitch-assets/html/teacher-profile-mobile-happy.html` | `stitch-assets/screenshots/teacher-profile-mobile-happy.png`
- **teacher-profile-desktop-loading**: `stitch-assets/html/teacher-profile-desktop-loading.html` | `stitch-assets/screenshots/teacher-profile-desktop-loading.png`
- **teacher-profile-desktop-empty**: `stitch-assets/html/teacher-profile-desktop-empty.html` | `stitch-assets/screenshots/teacher-profile-desktop-empty.png`
- **teacher-profile-desktop-error**: `stitch-assets/html/teacher-profile-desktop-error.html` | `stitch-assets/screenshots/teacher-profile-desktop-error.png`

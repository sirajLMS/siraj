# Spec — Shared Profile Shell

## Purpose

Cross-cutting profile page chrome shared by all audiences (teacher, parent, staff): header, tab navigation, action bar, loading/error/empty wrappers, and responsive layout breakpoints. Matches Stitch tab/header patterns; uses Siraj theme tokens only.

## Audience & scope

- **All audiences:** teacher, parent, staff
- **Scopes:** own (`/profile`) and other (`/users/[id]/profile`)
- **Modes:** view and edit (separate routes)
- **Permissions:** `auth.view_own_profile` (own), `user.edit_profile` + role view permissions (other)

## Stitch references

| Reference | Screen ID | Notes |
|-----------|-----------|-------|
| Tab bar pattern | From any animated profile screen | Profile, Banking, Students, Notifications, Permissions tabs |
| Header / action bar | `7175120a1b7449488fb370b59ae10146` (teacher desktop) | Edit Profile CTA, breadcrumb |
| Mobile layout | `e57caae245be49b7824abd80f7af78b9` (teacher mobile) | Stacked sections, bottom-safe padding |

**Project ID:** `3409377417207008542`

## Layout sections

| Section | Stitch label | Behavior |
|---------|--------------|----------|
| Page header | Profile title + subtitle | Shows audience-specific title from i18n |
| Avatar + identity row | Full Name, role badge | Avatar, name, email, role slug/name |
| Tab navigation | Profile / Banking / Students / Notifications / Permissions | Audience-conditional tabs |
| Action bar | Edit Profile | View mode only; links to edit route |
| Content area | Section panels | Audience container children |
| Footer links | Privacy Policy, Terms of Service | Optional; match Stitch footer if present |

## Tab visibility matrix

| Tab | Teacher own | Teacher admin | Parent own | Parent admin | Staff own | Staff admin |
|-----|-------------|---------------|------------|--------------|-----------|-------------|
| Profile | Yes | Yes | Yes | Yes | Yes | Yes |
| Banking | No | Yes | No | No | No | No |
| Assigned Students | No | Yes | No | No | No | No |
| Associated Students | No | No | Inline on profile | Inline on profile | No | No |
| Notifications | Yes | No | Yes | No | Yes | No |
| Permissions | No | Yes | No | Yes | No | Yes |

## Responsive behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥ md) | Horizontal tabs below header; two-column section panels where Stitch shows side-by-side cards |
| Mobile (< md) | Vertical stack; tabs as scrollable chip row; full-width section panels |

## Animations

| State | Behavior |
|-------|----------|
| Page entry | Fade + slide-up on content area |
| Tab switch | Cross-fade between tab panels |
| Loading | Skeleton placeholders for header + section cards |
| Error | Inline error banner with retry action |

## Acceptance criteria

- [ ] ProfileShell renders PageContainer + PageHeader with title, subtitle, actions slot
- [ ] Tab navigation shows only tabs valid for audience + scope
- [ ] Edit action navigates to correct edit route
- [ ] Loading state uses skeleton layout matching Stitch section structure
- [ ] Error state shows message + retry
- [ ] Mobile layout matches Stitch mobile animated reference
- [ ] All colors from Siraj theme palette
- [ ] RTL layout works via existing next-intl / MUI direction


- [ ] ProfileShell has no data fetches — receives props from GraphQL-backed containers only ([DATA_POLICY.md](../DATA_POLICY.md))
## Gaps / open questions

- Notifications and Permissions tabs have no dedicated Stitch screens
- Staff mobile has no animated happy-path main

## Implementation layers

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). See `plan.md` for layer-specific files and `tasks.md` for ordered checklist. Complete lower layers before higher layers.

## Local Stitch assets

Use files in `stitch-assets/` (not MCP):

- **teacher-profile-desktop-happy**: `stitch-assets/html/teacher-profile-desktop-happy.html` | `stitch-assets/screenshots/teacher-profile-desktop-happy.png`
- **teacher-profile-mobile-happy**: `stitch-assets/html/teacher-profile-mobile-happy.html` | `stitch-assets/screenshots/teacher-profile-mobile-happy.png`
- **teacher-profile-desktop-loading**: `stitch-assets/html/teacher-profile-desktop-loading.html` | `stitch-assets/screenshots/teacher-profile-desktop-loading.png`
- **teacher-profile-desktop-empty**: `stitch-assets/html/teacher-profile-desktop-empty.html` | `stitch-assets/screenshots/teacher-profile-desktop-empty.png`
- **teacher-profile-desktop-error**: `stitch-assets/html/teacher-profile-desktop-error.html` | `stitch-assets/screenshots/teacher-profile-desktop-error.png`
- **parent-profile-desktop-happy**: `stitch-assets/html/parent-profile-desktop-happy.html` | `stitch-assets/screenshots/parent-profile-desktop-happy.png`
- **parent-profile-mobile-happy**: `stitch-assets/html/parent-profile-mobile-happy.html` | `stitch-assets/screenshots/parent-profile-mobile-happy.png`
- **staff-profile-desktop-happy**: `stitch-assets/html/staff-profile-desktop-happy.html` | `stitch-assets/screenshots/staff-profile-desktop-happy.png`
- **staff-profile-mobile-static**: `stitch-assets/html/staff-profile-mobile-static.html` | `stitch-assets/screenshots/staff-profile-mobile-static.png`

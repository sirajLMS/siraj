# Spec — Staff Profile

## Purpose

Staff/manager profile page: account, role info, and read-only permissions panel. Supports own edit (contact) and admin edit (+ status).

## Audience & scope

| Scope | Route | Permissions |
|-------|-------|-------------|
| Own view | `/profile` | `auth.view_own_profile` |
| Own edit | `/profile/edit` | `auth.edit_own_profile` |
| Admin view | `/users/[userId]/profile` | `user.edit_profile` |
| Admin edit | `/users/[userId]/profile/edit` | `user.edit_profile` |

## Stitch references

**Project ID:** `3409377417207008542`

| Viewport | Screen | Screen ID |
|----------|--------|-----------|
| Desktop | Animated Staff Profile (Admin View) | `169b54c8dffd43e0a309a89294073045` |
| Mobile | **GAP** — no animated happy-path | Static fallback `9348fe3a9e6c43fea11a70568ff7e525` |

**State screens — mobile:** loading `873059a8871f4ae08c2653c2a0dadfb2`, empty permissions `3ba3b57f183b4494906bf3aa407f2bef`, error `c3eaa9b8ba9342aea8623838199ec0d4`

## Layout sections & field matrix

| Section | Stitch label | Entity field | Own view | Own edit | Admin view | Admin edit |
|---------|--------------|--------------|----------|----------|------------|------------|
| Account | Full Name | `users.name` | Yes | Yes | Yes | Yes |
| Account | Email Address | `users.email` | Yes | Yes | Yes | Yes |
| Account | Avatar | `users.avatarUrl` | Yes | Yes | Yes | Yes |
| Contact | Phone Number | `staff_profiles.phone` | Yes | Yes | Yes | Yes |
| Contact | Skype ID | `staff_profiles.skypeId` | Yes | Yes | Yes | Yes |
| Role | Role Name | permission_groups join | Yes | No | Yes | No |
| Role | Role Slug | permission_groups join | Yes | No | Yes | No |
| Role | Department | derived / future | Yes | No | Yes | No |
| Status | Status | `staff_profiles.status` | No | No | Yes | Yes |
| Permissions | Inherited Permission Groups | `user_permission_groups` | No | No | Yes | No |
| Permissions | Direct Overrides | `user_permission_overrides` | No | No | Yes | No |
| Permissions | Permission matrix | READ/WRITE per resource | No | No | Yes | No |

Permissions are read-only on profile — managed in `/permissions` admin.

## Responsive behavior

- **Desktop:** Permissions matrix table; role card beside account
- **Mobile:** Use static fallback layout; animated state screens for motion patterns

## Animations

- Permissions panel expand/collapse
- Empty permissions state (animated mobile screen `3ba3b57f183b4494906bf3aa407f2bef`)
- Loading skeleton for permissions table

## Acceptance criteria

- [ ] Own edit saves phone + skypeId + core via `updateOwnProfile`
- [ ] Admin edit saves phone + skypeId + status via `updateUserProfile`
- [ ] Permissions section read-only with groups and overrides listed
- [ ] Empty permissions state when no groups assigned
- [ ] Mobile layout from static fallback until animated main added


- [ ] All display/edit data via GraphQL only ([DATA_POLICY.md](../DATA_POLICY.md))
## Gaps

- No animated mobile happy-path main in Stitch
- `department` not in DB — omit or derive from role metadata
- GraphQL `updateUserProfile.staff.status` missing from pothos — must fix

## Implementation layers

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). See `plan.md` for layer-specific files and `tasks.md` for ordered checklist. Complete lower layers before higher layers.

## Local Stitch assets

Use files in `stitch-assets/` (not MCP):

- **staff-profile-desktop-happy**: `stitch-assets/html/staff-profile-desktop-happy.html` | `stitch-assets/screenshots/staff-profile-desktop-happy.png`
- **staff-profile-mobile-static**: `stitch-assets/html/staff-profile-mobile-static.html` | `stitch-assets/screenshots/staff-profile-mobile-static.png`

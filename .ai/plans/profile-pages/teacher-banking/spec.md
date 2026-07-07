# Spec — Teacher Banking

## Purpose

Admin-only tab on teacher profile showing encrypted banking details and verification status. Hidden from teacher own profile entirely.

## Audience & scope

| Scope | Visibility | Permissions |
|-------|------------|-------------|
| Own | **Hidden** | — |
| Admin view | `/users/[userId]/profile?tab=banking` | `user.edit_profile`, teacher banking view |
| Admin edit | Same tab, edit mode | Admin banking management permissions |

## Stitch references

**Project ID:** `3409377417207008542`

| Viewport | Screen | Screen ID |
|----------|--------|-----------|
| Desktop | Teacher Banking Details (Animated Admin View) | `04e10561a3d7470b82d9decae0cd9b20` |
| Mobile | **GAP** — no animated happy-path | Static fallback `ccfe165f84ae4bca82b713071d6ffd35` |

**State screens — desktop:** loading `6e47751a4cb8492f94ed1bfb1a8e8c17`, empty `d0bae093843e42d7855925b492e6a43c`, error `c83906d7a6ad4fc1a3c227c74388cb06`

**State screens — mobile:** loading `5006b8ba830945e29fa8af6e2f31fcda`, empty `4a365b23aeb24b5096ec71c3c5761a62`, error `b0b90444fac94083918f176e7f251fbc`

## Layout sections & field matrix

| Section | Stitch label | Entity field | Admin view | Admin edit |
|---------|--------------|--------------|------------|------------|
| Banking | Beneficiary Name | `teacher_banking_details_history.beneficiaryName` | Yes (masked) | Yes |
| Banking | Bank Name | `bankName` | Yes (masked) | Yes |
| Banking | Account Number | `accountNumber` | Yes (masked) | Yes |
| Banking | Routing Number | `routingNumber` | Yes (masked) | Yes |
| Banking | SWIFT/BIC | `swiftBic` | Yes (masked) | Yes |
| Banking | IBAN | `iban` | Yes (masked) | Yes |
| Verification | Verified At | `verifiedAt` | Yes | No |
| Verification | Verified By | `verifiedByUserId` | Yes | No |

All banking fields encrypted at application layer. Admin-only section — never on own profile.

## Responsive behavior

- **Desktop:** Single panel with labeled field grid
- **Mobile:** Static fallback layout; animated states for skeleton/empty/error

## Animations

- Skeleton fields during loading
- Empty state when no banking record (animated empty screens)
- Error with retry

## Acceptance criteria

- [ ] Tab hidden for teacher own profile
- [ ] Admin sees masked banking values
- [ ] Empty state when no active banking record
- [ ] Verification badge when `verifiedAt` set
- [ ] Edit links to existing banking workflow or inline admin form
- [ ] Mobile uses static fallback until animated main exists


- [ ] All display/edit data via GraphQL only ([DATA_POLICY.md](../DATA_POLICY.md))
## Gaps

- No animated mobile happy-path main
- Full edit may defer to `frontend/views/dashboard/teachers/onboarding/` banking flow

## Implementation layers

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). See `plan.md` for layer-specific files and `tasks.md` for ordered checklist. Complete lower layers before higher layers.

## Local Stitch assets

Use files in `stitch-assets/` (not MCP):

- **teacher-banking-desktop-happy**: `stitch-assets/html/teacher-banking-desktop-happy.html` | `stitch-assets/screenshots/teacher-banking-desktop-happy.png`
- **teacher-banking-mobile-static**: `stitch-assets/html/teacher-banking-mobile-static.html` | `stitch-assets/screenshots/teacher-banking-mobile-static.png`

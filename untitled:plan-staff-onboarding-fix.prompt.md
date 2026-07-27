## Plan: Fix staff onboarding page issues + routing

**TL;DR**: Fix UI bugs (duplicate password, wrong button label, broken layout, subtitle with "Siraj"), restructure route from /managers/onboarding → /staff/create and folder managers → staff, update title to "Staff Onboarding".

**Steps**
1. Rename folder `app/(dashboard)/managers/onboarding` → `app/(dashboard)/staff/create` (and parent `managers` → `staff` if exists)
2. Update page title: "Staff Onboarding"; subtitle: "Register a new staff member." (remove "Siraj")
3. Remove duplicate "Password *" input from System Permissions section
4. Change "SIGN UP" button to appropriate label (e.g., "SAVE" or "CREATE STAFF")
5. Fix layout imbalance in System Permissions (Account Type + description aligned properly, no orphaned input)
6. Group bottom stats cards (Active Staff, Pending Approval, Average Onboarding) with a header or container
7. Verify new route /staff/create loads; old /managers/onboarding removed

**Relevant files**
- `app/(dashboard)/managers/onboarding/page.tsx` (or similar) — title, subtitle, form fields, button
- Folder structure under `app/(dashboard)/`

**Verification**
- Check page renders at /staff/create
- Confirm no "Siraj" in subtitle
- Confirm no duplicate Password field in permissions section
- Confirm button label is not "SIGN UP"

**Decisions**
- Title: "Staff Onboarding"; subtitle: "Register a new staff member."
- Route: /managers/onboarding → /staff/create; folder managers → staff
- No redirect kept for old route
- All UI fixes included (password, button)
- **Stats cards entirely removed** from /staff/create page (mobile + desktop views)
